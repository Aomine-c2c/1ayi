"""
AYIS — service layer registry.

Lists all service modules so they can be imported centrally.
Used by views and tests to access business logic.
"""

SERVICES = {
    "farms": "ayis.farms.services",
    "users": "ayis.users.services",
}
