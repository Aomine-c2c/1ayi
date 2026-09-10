#!/usr/bin/env python3
"""Trace the settings import chain to find where it breaks."""
import sys
sys.path.insert(0, '/app')
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'ayis.settings'
os.environ['DEBUG'] = 'true'

print("=== BEFORE settings import ===")
print("sys.path[0]:", sys.path[0])

import ayis.settings as s
print("\n=== AFTER settings import ===")
print("SETTINGS_MODULE:", s.SETTINGS_MODULE)
print("Has DEBUG?", hasattr(s, 'DEBUG'))
print("Has INSTALLED_APPS?", hasattr(s, 'INSTALLED_APPS'))

# Try to import the module that SETTINGS_MODULE points to
if hasattr(s, 'SETTINGS_MODULE'):
    target = s.SETTINGS_MODULE
    print(f"\n=== Importing {target} ===")
    try:
        m = __import__(target, fromlist=[''])
        print(f"Imported: {m}")
        print(f"Has DEBUG: {hasattr(m, 'DEBUG')}")
        if hasattr(m, 'DEBUG'):
            print(f"DEBUG value: {m.DEBUG}")
        if hasattr(m, 'INSTALLED_APPS'):
            print(f"INSTALLED_APPS length: {len(m.INSTALLED_APPS)}")
            for app in m.INSTALLED_APPS[:15]:
                print(f"  - {app}")
    except Exception as e:
        print(f"FAILED: {e}")

# Now try django.setup()
print("\n=== Django setup ===")
try:
    import django
    django.setup()
    print("Django setup OK")
    from django.apps import apps
    for label in ['auth', 'contenttypes', 'users']:
        app = apps.get_app_config(label)
        print(f"  App {label}: models={list(app.models.keys())}")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
