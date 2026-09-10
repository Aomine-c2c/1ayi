#!/usr/bin/env bash
# Quick syntax check for all new/modified Python files
set -e
cd /home/sila/ayi-system/backend
python3 -c "
import py_compile, sys
files = [
    'ayis/users/models.py',
    'ayis/users/services.py',
    'ayis/permissions.py',
    'ayis/intelligence/suitability_engine.py',
    'ayis/intelligence/services.py',
    'ayis/seed_data.py',
    'ayis/farms/models.py',
    'ayis/farms/services.py',
    'ayis/performance.py',
    'ayis/rbac_documentation.py',
]
ok = True
for f in files:
    try:
        py_compile.compile(f, doraise=True)
        print(f'  OK: {f}')
    except py_compile.PyCompileError as e:
        print(f'  FAIL: {f} — {e}')
        ok = False
sys.exit(0 if ok else 1)
"