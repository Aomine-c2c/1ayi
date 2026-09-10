"""
AYIS — security controls and middleware.

Centralizes security-related middleware, utilities, and configuration.

Covers:
- Security headers (production)
- Rate limiting
- Input sanitization helpers
- Secure response helpers
- Audit logging integration
"""

import logging
import os
import re
from typing import Any

from django.conf import settings
from django.http import HttpRequest, HttpResponse


logger = logging.getLogger("ayis.security")


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.

    In production, sets strict headers. In development, sets safe-but-permissive
    headers so the UI still functions.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)

        # Content sniffing protection
        response["X-Content-Type-Options"] = "nosniff"

        # Frame protection — prevent clickjacking
        response["X-Frame-Options"] = "DENY"

        # XSS protection (legacy, but still useful for older browsers)
        response["X-XSS-Protection"] = "0"

        # Referrer policy
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Production-only strict headers
        if not getattr(settings, "DEBUG", False):
            response["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self' http://localhost:* https://* tauri://localhost; "
                "frame-ancestors 'none'"
            )
            response["Permissions-Policy"] = (
                "geolocation=(), microphone=(), camera=()"
            )

        return response


def sanitize_for_log(value: Any) -> str:
    """
    Sanitize a value before including it in logs.

    Strips or masks common sensitive patterns:
    - Passwords / secrets in URLs
    - Authorization headers
    - Long tokens
    """
    if value is None:
        return ""

    s = str(value)

    # Don't log authorization headers / bearer tokens
    if isinstance(value, str) and value.lower().startswith("bearer "):
        return "[REDACTED:authorization]"

    # Mask potential API keys / secrets in query strings
    if isinstance(s, str) and ("key=" in s.lower() or "secret=" in s.lower()):
        return "[REDACTED:query_secret]"

    # Truncate very long values
    if len(s) > 500:
        return s[:500] + "...[truncated]"

    return s


def safe_error_response(message: str, status_code: int = 400) -> dict[str, Any]:
    """
    Build a safe error response that never leaks internal details.

    Usage in except blocks where you want to avoid leaking stack traces,
    SQL, or internal paths to the client.
    """
    logger.warning(f"Client-visible error: {message}")
    return {
        "error": "request_error",
        "message": message,
        "status": status_code,
    }


class RateLimitExceeded(Exception):
    """Raised when a rate limit is hit."""

    def __init__(self, retry_after: int | None = None):
        self.retry_after = retry_after
        super().__init__("Rate limit exceeded")


def rate_limit_check(
    identifier: str,
    limit: int,
    window_seconds: int,
    cache,
) -> None:
    """
    Simple fixed-window rate limit check.

    identifier: unique key for the rate limit bucket
                (e.g. "login:<ip>" or "api:<user_id>")
    limit: max requests per window
    window_seconds: window duration
    cache: django cache backend

    Raises RateLimitExceeded if the limit is exceeded.
    """
    key = f"ratelimit:{identifier}"
    current = cache.get(key, 0)

    if current >= limit:
        raise RateLimitExceeded(retry_after=window_seconds)

    cache.set(key, current + 1, window_seconds)
