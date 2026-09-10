#!/usr/bin/env python3
"""Bootstrap script for AYIS backend + infra.

Usage:
  python3 scripts/bootstrap.py    # full bootstrap
  python3 scripts/bootstrap.py db # only infra
  python3 scripts/bootstrap.py migrate
  python3 scripts/bootstrap.py superuser
  python3 scripts/bootstrap.py health

All docker compose commands are invoked via the terminal's sudo context.
Infrastructure (db, redis) must be up before backend commands.
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

WORK_DIR = Path("/home/sila/ayi-system")
COMPOSE_FILE = WORK_DIR / "docker-compose.yml"
STATE_FILE = WORK_DIR / ".ayi-bootstrap-state.json"


def run(cmd: list[str], timeout: int = 300, check: bool = True) -> subprocess.CompletedProcess:
    """Run a command in the working directory, capturing output."""
    print(f"$ {' '.join(cmd)}")
    r = subprocess.run(
        cmd,
        cwd=WORK_DIR,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.stdout:
        print(r.stdout[-2000:])
    if r.stderr:
        print(r.stderr[-2000:], file=sys.stderr)
    if check and r.returncode != 0:
        print(f"[ERROR] Command failed with exit code {r.returncode}", file=sys.stderr)
        # Don't raise — let the caller decide how to handle it
    return r


def docker_compose(*args: str, timeout: int = 300) -> subprocess.CompletedProcess:
    return run(["sudo", "docker", "compose", "-f", str(COMPOSE_FILE), *args], timeout=timeout)


def wait_for_service(name: str, command: list[str], expected: str, timeout: int = 120) -> bool:
    """Poll a service until it returns the expected output."""
    print(f"Waiting for {name} to be ready...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = run(
            ["sudo", "docker", "compose", "-f", str(COMPOSE_FILE), "exec", "-T", name, *command],
            timeout=10,
            check=False,
        )
        if expected in r.stdout or r.returncode == 0:
            print(f"{name} is ready.")
            return True
        time.sleep(2)
    print(f"[WARNING] {name} did not become ready within {timeout}s")
    return False


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))


def target_db() -> int:
    state = load_state()
    if state.get("db_up"):
        print("DB already running (according to state file).")
        return 0

    print("=== Starting database and Redis ===")
    r = docker_compose("up", "-d", "db", "redis")
    if r.returncode != 0:
        print("[ERROR] Failed to start db/redis", file=sys.stderr)
        return 1

    if not wait_for_service("db", ["pg_isready", "-U", "ayis", "-d", "ayis"], "accepting connections"):
        return 1
    if not wait_for_service("redis", ["redis-cli", "ping"], "PONG"):
        return 1

    state["db_up"] = True
    state["redis_up"] = True
    save_state(state)
    print("=== Database and Redis are up ===")
    return 0


def target_backend() -> int:
    state = load_state()
    if state.get("backend_up"):
        print("Backend already running (according to state file).")
        return 0

    print("=== Starting backend ===")
    r = docker_compose("up", "-d", "backend", "backend-worker")
    if r.returncode != 0:
        print("[ERROR] Failed to start backend", file=sys.stderr)
        return 1

    # Give the container a moment to start
    time.sleep(3)
    state["backend_up"] = True
    save_state(state)
    print("=== Backend containers started ===")
    return 0


def target_migrate() -> int:
    print("=== Running database migrations ===")
    if not wait_for_service("db", ["pg_isready", "-U", "ayis", "-d", "ayis"], "accepting connections"):
        print("[ERROR] Database not available for migrations", file=sys.stderr)
        return 1

    r = docker_compose("exec", "-T", "backend", "python", "manage.py", "migrate", "--noinput")
    if r.returncode != 0:
        print("[ERROR] Migration failed", file=sys.stderr)
        return 1

    state = load_state()
    state["migrated"] = True
    save_state(state)
    print("=== Migrations complete ===")
    return 0


def target_superuser() -> int:
    print("=== Creating superuser ===")
    if not wait_for_service("db", ["pg_isready", "-U", "ayis", "-d", "ayis"], "accepting connections"):
        print("[ERROR] Database not available", file=sys.stderr)
        return 1

    # Use shell to create the user idempotently
    code = """
from ayis.users.models import User
u, created = User.objects.get_or_create(
    username="admin",
    defaults={
        "email": "admin@ayi.local",
        "role": "admin",
        "is_staff": True,
        "is_superuser": True,
    },
)
if created:
    u.set_password("admin123")
    u.save()
    print("Created admin / admin123")
else:
    print("Admin user already exists")
"""
    r = docker_compose("exec", "-T", "backend", "python", "manage.py", "shell", "-c", code)
    if r.returncode != 0:
        print("[ERROR] Superuser creation failed", file=sys.stderr)
        return 1

    print("=== Superuser ready (admin / admin123) ===")
    return 0


def target_health() -> int:
    print("=== Running health check ===")
    if not wait_for_service("db", ["pg_isready", "-U", "ayis", "-d", "ayis"], "accepting connections"):
        print("[ERROR] Database not available", file=sys.stderr)
        return 1

    r = run(["curl", "-sf", "http://localhost:8000/api/v1/health/"], timeout=15, check=False)
    if r.returncode != 0:
        print(f"[ERROR] Health check failed: {r.stderr}", file=sys.stderr)
        return 1
    print(f"Health response: {r.stdout.strip()}")
    print("=== Health check passed ===")
    return 0


def target_all() -> int:
    steps = [
        ("db", target_db),
        ("backend", target_backend),
        ("migrate", target_migrate),
        ("superuser", target_superuser),
        ("health", target_health),
    ]
    for name, fn in steps:
        print(f"\n{'='*50}")
        print(f"STEP: {name}")
        print(f"{'='*50}")
        code = fn()
        if code != 0:
            print(f"[ABORT] Step '{name}' failed with code {code}", file=sys.stderr)
            return code
    print("\n✓ All bootstrap steps complete.")
    return 0


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: bootstrap.py [all|db|backend|migrate|superuser|health]")
        sys.exit(1)

    target = sys.argv[1]
    handlers = {
        "all": target_all,
        "db": target_db,
        "backend": target_backend,
        "migrate": target_migrate,
        "superuser": target_superuser,
        "health": target_health,
    }

    if target not in handlers:
        print(f"Unknown target: {target}", file=sys.stderr)
        print(f"Valid targets: {', '.join(handlers)}", file=sys.stderr)
        sys.exit(1)

    code = handlers[target]()
    sys.exit(code)


if __name__ == "__main__":
    main()
