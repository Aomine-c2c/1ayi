"""
AYIS — Permission Matrix & RBAC Architecture.

Defines the complete authorization model for AYIS.

ROLES:
- Farmer: manages own farms, cycles, production. Can generate personal reports.
- Agricultural Officer: can view all farms, cycles, production in their assigned region. 
  Can generate regional reports. Cannot modify farmer data.
- Administrator: full system management. Can create users, manage regions, 
  assign officers, view all data, generate all report types.

OBJECT-LEVEL ACCESS:
- Farmers: only their own farms, cycles, production, weather, intelligence, reports.
- Officers: farms/cycles/production in their assigned region(s) via OfficerAssignment.
- Admins: all objects.

DETAILED PERMISSION MATRIX:
                     Farmer   Officer   Admin
─────────────────────────────────────────────────
View own farm        ✓        ✗        ✓
View other farm      ✗        Region   ✓
View own cycle       ✓        ✗        ✓
View region cycle    ✗        Region   ✓
Edit own farm        ✓        ✗        ✓
Edit other farm      ✗        ✗        ✓
Create farm          ✓        ✗        ✓
Delete farm          ✓        ✗        ✓
Register user        ✗        ✗        ✓
Manage users         ✗        ✗        ✓
View own production  ✓        ✗        ✓
View region production ✗      Region   ✓
Edit own production  ✓        ✗        ✓
Create production    ✓        ✗        ✓
View own weather     ✓        ✗        ✓
View region weather  ✗        Region   ✓
View all weather     ✗        ✗        ✓
Sync weather         ✗        ✗        ✓
View own intelligence ✓       ✗        ✓
View region intelligence ✗    Region   ✓
Generate farmer report ✓       ✗        ✓
Generate officer report ✗     ✓        ✓
Generate admin report  ✗      ✗        ✓
View audit log       ✗        ✗        ✓
Manage regions       ✗        ✗        ✓
Assign officers      ✗        ✗        ✓
Manage system settings ✗      ✗        ✓
Approve recommendations ✗     ✓        ✓

AUTHENTICATION:
- JWT via djangorestframework-simplejwt
- Access token: 60 minutes (configurable)
- Refresh token: 7 days (configurable)
- Token blacklist enabled for logout
- Password hashed with Django's PBKDF2 (bcrypt available)
- Account activation/deactivation via is_active flag
- Password reset: email-token based architecture (not yet wired to SMTP)

RATE LIMITING:
- Authentication endpoints: 10 requests/minute per IP
- Write endpoints (create/update): 30 requests/minute per user
- Read endpoints: 60 requests/minute per user
- Implemented via Django cache-based rate limiting

AUDIT LOGGING:
- All authentication events logged (login, logout, register, password reset)
- All permission-denied access attempts logged
- All write operations logged with user, timestamp, object, action
- Audit log accessible only by administrators

PASSWORD RESET ARCHITECTURE:
- PasswordResetRequest model stores token + expiry
- Token sent via email (SMTP not yet configured)
- One-time use tokens
- 1-hour expiry
- Rate limited: max 3 requests per hour per user
- On success: invalidate all existing tokens for user
"""
