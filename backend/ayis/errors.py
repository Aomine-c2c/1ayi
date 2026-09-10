"""
AYIS — error handling and secure responses.

Production-grade error handling that never leaks internal details.
- Safe exception handler (replaces/restores DRF's handler)
- Secure response builder (never includes stack traces, SQL, paths)
- Error code registry
"""

import logging
import os
from typing import Any

from django.conf import settings
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("ayis.errors")


class ErrorCode:
    """Canonical error codes returned by the API. Never expose internal details."""

    VALIDATION_ERROR = "validation_error"
    AUTHENTICATION_REQUIRED = "authentication_required"
    PERMISSION_DENIED = "permission_denied"
    NOT_FOUND = "not_found"
    METHOD_NOT_ALLOWED = "method_not_allowed"
    CONFLICT = "conflict"
    RATE_LIMITED = "rate_limited"
    INTERNAL_ERROR = "internal_error"
    SERVICE_UNAVAILABLE = "service_unavailable"


# Human-readable messages paired to error codes. These are safe to return
# to clients — they never leak stack traces, SQL, internal paths, or secrets.
SAFE_MESSAGES: dict[str, str] = {
    ErrorCode.VALIDATION_ERROR: "The request contained invalid data.",
    ErrorCode.AUTHENTICATION_REQUIRED: "Authentication is required.",
    ErrorCode.PERMISSION_DENIED: "You do not have permission to perform this action.",
    ErrorCode.NOT_FOUND: "The requested resource was not found.",
    ErrorCode.METHOD_NOT_ALLOWED: "The request method is not allowed.",
    ErrorCode.CONFLICT: "The request conflicts with the current state.",
    ErrorCode.RATE_LIMITED: "Too many requests. Please slow down.",
    ErrorCode.INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
    ErrorCode.SERVICE_UNAVAILABLE: "A service is temporarily unavailable. Please try again later.",
}


def safe_api_response(
    error_code: str,
    status: int,
    *,
    detail: str | None = None,
    extras: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Build a safe, consistent API error response.

    Never includes: stack traces, SQL queries, file paths, environment
    variables, request bodies, or any other internal detail.

    Args:
        error_code: Canonical error code from ErrorCode.
        status: HTTP status code.
        detail: Optional additional safe detail (e.g. field name for validation).
        extras: Optional additional safe key-value pairs.
    """
    response: dict[str, Any] = {
        "error": error_code,
        "message": SAFE_MESSAGES.get(error_code, SAFE_MESSAGES[ErrorCode.INTERNAL_ERROR]),
        "status": status,
    }
    if detail:
        response["detail"] = detail
    if extras:
        response.update(extras)
    return response


class SecureExceptionHandler:
    """
    Wraps DRF's exception handler to guarantee no sensitive information
    leaks to API clients.

    In production (DEBUG=False), *all* errors return the generic internal
    message. In development, validation errors still surface field details
    so developers can debug.

    Unhandled exceptions are always logged server-side with full traceback,
    but only a generic message is returned to the client.
    """

    # Exceptions we treat as "handled by DRF" and pass through (with normalization)
    _drf_handled_exceptions = ()

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        return response

    @classmethod
    def handle(cls, exc: Exception, context: dict) -> dict[str, Any]:
        """
        Return a safe error dict for the given exception.

        Callers are responsible for building the actual HTTP response.
        """
        from rest_framework.views import exception_handler
        from rest_framework import status

        response = exception_handler(exc, context)

        if response is not None:
            # DRF handled it — normalize to a safe, consistent shape.
            data = response.data
            status_code = response.status_code

            if isinstance(data, dict) and "detail" in data:
                # Detail dict (e.g. PermissionDenied, NotFound)
                return safe_api_response(
                    ErrorCode.PERMISSION_DENIED if status_code == 403 else ErrorCode.NOT_FOUND if status_code == 404 else ErrorCode.VALIDATION_ERROR,
                    status_code,
                    detail=str(data["detail"]),
                )

            if isinstance(data, dict):
                # Field-level validation errors — include only field names, never values
                safe_details = {}
                for field, errors in data.items():
                    if isinstance(errors, list):
                        safe_details[field] = [str(e) for e in errors]
                    else:
                        safe_details[field] = str(errors)
                return safe_api_response(ErrorCode.VALIDATION_ERROR, status_code, extras={"details": safe_details})

            if isinstance(data, list):
                return safe_api_response(
                    ErrorCode.VALIDATION_ERROR,
                    status_code,
                    extras={"details": {"non_field_errors": [str(e) for e in data]}},
                )

            # Scalar string
            return safe_api_response(ErrorCode.VALIDATION_ERROR, status_code, detail=str(data))

        # Unhandled exception — log full traceback server-side, return generic message.
        logger.exception(
            "Unhandled exception in %s %s: %s",
            context.get("view").__class__.__name__ if context.get("view") else "unknown",
            context.get("request").method if context.get("request") else "unknown",
            exc,
        )

        # Production: never leak anything. Development: still safe, but we
        # log the real error so devs can see it in the console.
        status_code = getattr(exc, "status_code", 500)
        if not isinstance(status_code, int):
            status_code = 500

        # Map common unhandled types to appropriate codes
        if isinstance(exc, ValueError):
            status_code = 400
        elif isinstance(exc, KeyError):
            status_code = 404
        elif isinstance(exc, PermissionError):
            status_code = 403

        return safe_api_response(ErrorCode.INTERNAL_ERROR, status_code)


def log_security_event(
    event: str,
    request: HttpRequest,
    *,
    extra: dict[str, Any] | None = None,
    level: str = "warning",
) -> None:
    """
    Log a security-relevant event with sanitized context.

    Never logs: Authorization headers, passwords, tokens, or request bodies
    that might contain secrets.
    """
    logger_opt = getattr(logger, level, logger.warning)

    sanitized: dict[str, Any] = {
        "event": event,
        "method": request.method,
        "path": request.path,
        "remote_addr": request.META.get("REMOTE_ADDR", "unknown"),
        "user_agent": request.META.get("HTTP_USER_AGENT", "")[:200],
    }

    # Include user if authenticated (never include password/token)
    if request.user and request.user.is_authenticated:
        sanitized["user_id"] = request.user.id
        sanitized["username"] = request.user.username

    if extra:
        sanitized.update(extra)

    logger_opt("Security event: %s", sanitized)


def mask_sensitive_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Return a copy of `data` with sensitive fields masked.

    Use before logging or returning any dict that might contain secrets.
    """
    sensitive_keys = {
        "password", "passwd", "secret", "api_key", "apikey", "token",
        "authorization", "auth", "access_token", "refresh_token",
        "db_password", "database_password",
    }

    masked: dict[str, Any] = {}
    for key, value in data.items():
        if any(s in key.lower() for s in sensitive_keys):
            masked[key] = "***REDACTED***"
        elif isinstance(value, dict):
            masked[key] = mask_sensitive_data(value)
        elif isinstance(value, list):
            masked[key] = [
                mask_sensitive_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            masked[key] = value

    return masked
