#!/bin/bash
# Test whether the backend Django stack loads inside the container.
set -e

CONTAINER="ayis-backend"
TEST_FILE="/tmp/_test_import.py"

cat > /tmp/_gen_test.py << 'PYEOF'
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'ayis.settings'
os.environ['DEBUG'] = 'true'

import sys
sys.path.insert(0, '/app')

import django
django.setup()
print("Django loaded OK")

from ayis.security import security_health_check
from ayis.permissions import IsFarmer
print("Security modules loaded OK")
print(f"Health: {security_health_check()}")
PYEOF

sudo docker compose cp /tmp/_gen_test.py "${CONTAINER}:${TEST_FILE}" 2>&1
sudo docker compose exec -T "${CONTAINER}" python "${TEST_FILE}" 2>&1

EXIT=$?
rm -f /tmp/_gen_test.py /tmp/_test_import.py
exit $EXIT
