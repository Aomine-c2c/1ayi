"""AYIS backend image build / Docker Compose startup."""
import json, os, time, subprocess, sys

WORK_DIR = "/home/sila/ayi-system"
COMPOSE = ["sudo", "docker", "compose", "-f", os.path.join(WORK_DIR, "docker-compose.yml")]
CACHE = os.path.join(WORK_DIR, ".ayi-build-state.json")

def run(cmd, timeout=600):
    print(f"[run] {' '.join(cmd)}")
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=WORK_DIR)
    return r.returncode, r.stdout[-4000:], r.stderr[-4000:]

def save_state(state):
    with open(CACHE, "w") as f:
        json.dump(state, f)

def load_state():
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            return json.load(f)
    return {}

def wait_for_db(timeout=60):
    print("[wait] waiting for PostgreSQL to be ready...")
    t0 = time.time()
    while time.time() - t0 < timeout:
        rc, out, _ = run(["sudo", "docker", "compose", "-f", os.path.join(WORK_DIR, "docker-compose.yml"), "exec", "db", "pg_isready", "-U", "ayis", "-d", "ayis"], timeout=10)
        if rc == 0:
            print("[wait] PostgreSQL ready.")
            return True
        time.sleep(2)
    print("[wait] PostgreSQL NOT ready after timeout.")
    return False

def wait_for_redis(timeout=30):
    print("[wait] waiting for Redis to be ready...")
    t0 = time.time()
    while time.time() - t0 < timeout:
        rc, out, _ = run(["sudo", "docker", "compose", "-f", os.path.join(WORK_DIR, "docker-compose.yml"), "exec", "redis", "redis-cli", "ping"], timeout=10)
        if rc == 0 and "PONG" in out:
            print("[wait] Redis ready.")
            return True
        time.sleep(2)
    print("[wait] Redis NOT ready after timeout.")
    return False

def main():
    state = load_state()
    target = sys.argv[1] if len(sys.argv) > 1 else "all"

    if target in ("db", "all"):
        if not state.get("db_pulled"):
            rc, out, err = run(["sudo", "docker", "compose", "-f", os.path.join(WORK_DIR, "docker-compose.yml"), "pull", "db", "redis"], timeout=300)
            if rc != 0:
                print(f"[fail] pull db/redis: {err[-500:]}")
                sys.exit(1)
            state["db_pulled"] = True
            save_state(state)
        rc, out, err = run(COMPOSE + ["up", "-d", "db", "redis"], timeout=120)
        if rc != 0:
            print(f"[fail] up db/redis: {err[-500:]}")
            sys.exit(1)
        if not wait_for_db():
            sys.exit(1)
        if not wait_for_redis():
            sys.exit(1)
        state["db_up"] = True
        save_state(state)
        print("[ok] db + redis up and healthy")

    if target in ("backend", "all"):
        rc, out, err = run(COMPOSE + ["up", "-d", "backend"], timeout=120)
        if rc != 0:
            print(f"[fail] up backend: {err[-500:]}")
            sys.exit(1)
        state["backend_up"] = True
        save_state(state)
        print("[ok] backend container started")

    if target in ("migrate", "all"):
        if not wait_for_db(timeout=90):
            sys.exit(1)
        rc, out, err = run(COMPOSE + ["exec", "backend", "python", "manage.py", "migrate", "--noinput"], timeout=120)
        if rc != 0:
            print(f"[fail] migrate: {err[-1000:]}")
            sys.exit(1)
        print("[ok] migrations applied")
        state["migrated"] = True
        save_state(state)

    if target in ("superuser", "all"):
        if not wait_for_db(timeout=60):
            sys.exit(1)
        rc, out, err = run(COMPOSE + ["exec", "backend", "python", "manage.py", "shell", "-c", 
            "from ayis.users.models import User; "
            "u,_=User.objects.get_or_create(username='admin',defaults={'email':'admin@ayi.local','role':'admin','is_staff':True,'is_superuser':True}); "
            "u.set_password('admin123'); u.save(); "
            "print('admin created')"], timeout=60)
        if rc != 0:
            print(f"[fail] superuser: {err[-500:]}")
            sys.exit(1)
        print("[ok] admin superuser ready")
        state["superuser"] = True
        save_state(state)

    if target in ("health", "all"):
        if not wait_for_db(timeout=60):
            sys.exit(1)
        rc, out, err = run(["curl", "-sf", "http://localhost:8000/api/v1/health/"], timeout=15)
        if rc != 0:
            print(f"[fail] health check: {err[-500:]}")
            sys.exit(1)
        print(f"[ok] health: {out.strip()}")

    print("[done] target:", target)

if __name__ == "__main__":
    main()
