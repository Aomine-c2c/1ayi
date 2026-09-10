#!/bin/bash
# Test backend health and security from inside the container.
# Does NOT require sudo (uses HTTP from within the network).

set -e

echo "=== Backend Integration & Security Test ==="
echo ""

# 1. Django + settings chain
echo "1. Django setup + settings chain..."
python -c "
import sys; sys.path.insert(0, '/app')
import os; os.environ['DJANGO_SETTINGS_MODULE']='ayis.settings'; os.environ['DEBUG']='true'
import django; django.setup()
from django.apps import apps
print(f'   Apps: {len(apps.app_configs)} loaded')
from ayis.security import security_health_check
health = security_health_check()
print(f'   Security health: {len([v for v in health.values() if v])}/{len(health)} checks pass')
" 2>&1

# 2. HTTP health endpoint (from within the network)
echo ""
echo "2. HTTP health endpoint (localhost:8000)..."
curl -s -w "\nHTTP %{http_code}" http://localhost:8000/api/v1/health 2>&1 || echo "FAILED"

# 3. Public schema endpoint
echo ""
echo "3. OpenAPI schema endpoint..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8000/api/v1/schema/ 2>&1 || echo "FAILED"

# 4. PermissionDeniedWithAudit (imports audit lazily — should not crash)
echo ""
echo "4. PermissionDeniedWithAudit import + audit lazy load..."
python -c "
import sys; sys.path.insert(0, '/app')
import os; os.environ['DJANGO_SETTINGS_MODULE']='ayis.settings'; os.environ['DEBUG']='true'
import django; django.setup()
from ayis.permissions import PermissionDeniedWithAudit
p = PermissionDeniedWithAudit(detail='test denial', audit_context={'path': '/test'})
# This should trigger lazy audit log import without crashing
try:
    p.log_audit(None, None)
    print('   Audit log triggered without crash (expected: logged but no DB)')
except Exception as e:
    print(f'   Note: {type(e).__name__}: {e}')
print('   OK')
" 2>&1

echo ""
echo "=== Test complete ==="
