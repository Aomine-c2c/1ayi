"""
AYIS farm models — Farm, FarmRegion, OfficerAssignment.

All three models are defined here so Django's migration autodetector
picks them up in a single initial migration.
This is the single source of truth for farm-related models.

NOTE: region_models.py was the original location but caused a conflict
when models were moved here. The region_models.py file has been removed
and all references now point to farms.models.
"""
