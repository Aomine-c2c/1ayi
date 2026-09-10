#!/usr/bin/env python3
"""Verify the AYIS backend setup: dependencies, database, and API health.

Usage:
    python scripts/verify_backend.py

Exit codes:
    0 — all checks pass
    1 — a check failed
"""
import subprocess
import sys
import time


def run(cmd: list[str], timeout=30) -> tuple[int, str, str]:
    """Run a command inside the backend container."""
    result = subprocess.run(
        ["sudo", "docker", "compose", "run", "--rm", "backend"] + cmd,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return result.returncode, result.stdout, result.stderr


def main():
    print("=" * 60)
    print("AYIS Backend Verification")
    print("=" * 60)

    # 1. Check container is running
    print("\n[1/4] Checking PostgreSQL + Redis containers...")
    result = subprocess.run(
        ["sudo", "docker", "compose", "ps", "--format", "table"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if "healthy" not in result.stdout.lower() and "running" not in result.stdout.lower():
        print("FAIL: Containers not running")
        return 1
    print("PASS: Containers running")

    # 2. Check migrations applied
    print("\n[2/4] Checking database migrations...")
    rc, stdout, stderr = run(["python", "manage.py", "showmigrations", "--list"], timeout=30)
    if rc != 0:
        print(f"FAIL: showmigrations failed (rc={rc})")
        print(stderr[:500])
        return 1
    applied = [l for l in stdout.splitlines() if l.strip().startswith("[X]")]
    if not applied:
        print("FAIL: No migrations applied")
        return 1
    print(f"PASS: {len(applied)} migrations applied")

    # 3. Check seed data
    print("\n[3/4] Checking seed data...")
    import django
    django.setup()
    from ayis.users.models import User
    from ayis.farms.models import Farm
    from ayis.crops.models import Crop

    user_count = User.objects.count()
    farm_count = Farm.objects.count()
    crop_count = Crop.objects.count()

    if user_count < 3:
        print(f"FAIL: Only {user_count} users (need >= 3)")
        return 1
    if farm_count < 1:
        print(f"FAIL: Only {farm_count} farms (need >= 1)")
        return 1
    if crop_count < 1:
        print(f"FAIL: Only {crop_count} crops (need >= 1)")
        return 1
    print(f"PASS: {user_count} users, {farm_count} farms, {crop_count} crops")

    # 4. Check API health endpoint
    print("\n[4/4] Checking API health endpoint...")
    import urllib.request
    import json

    try:
        req = urllib.request.Request(
            "http://localhost:8000/api/v1/health/",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            if data.get("status") != "healthy":
                print(f"FAIL: Unexpected health status: {data}")
                return 1
            print(f"PASS: API healthy — {data}")
    except Exception as e:
        print(f"FAIL: API not accessible — {e}")
        print("The backend container may not be serving HTTP requests.")
        print("Try: sudo docker compose logs backend")
        return 1

    print("\n" + "=" * 60)
    print("ALL CHECKS PASSED")
    print("Backend available at: http://localhost:8000/api/v1/")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
