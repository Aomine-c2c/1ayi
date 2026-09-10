# ayis.audit — lazy exports.

# DO NOT import models or the audit_log singleton at module level.
# Doing so triggers model definition during django.setup() (apps.populate()),
# before Django's app registry is ready, causing:
#   "Apps aren't loaded yet."
#
# Import audit_log and AuditLogEntry only after Django is fully initialized.
# Convenience accessors:
#   from ayis.audit import get_audit_log
#   audit_log = get_audit_log()  # call AFTER django.setup()
#   from ayis.audit.models import AuditLogEntry  # direct model import is fine after setup


def get_audit_log():
    """Return the audit_log singleton (lazy — must be called after django.setup())."""
    from ayis.audit.models import audit_log as _al
    return _al
