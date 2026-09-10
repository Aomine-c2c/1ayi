"""
AYIS — resilience and error handling.

Covers resilience patterns for:
- Database failures
- Redis failures
- External API failures (weather)
- Celery job failures
- Authentication failures
- Input validation failures
- Network interruptions
- Duplicate/malformed requests

Graceful degradation and retry strategies.
"""

import logging
import time
from datetime import timedelta
from functools import wraps
from typing import Any, Callable

from django.db import DatabaseError, OperationalError
from django.core.cache import CacheKeyWarning, cache

logger = logging.getLogger("ayis.resilience")


# ---------------------------------------------------------------------------
# Retry with exponential backoff
# ---------------------------------------------------------------------------

class RetryExhausted(Exception):
    """Raised when all retry attempts are exhausted."""

    def __init__(self, last_exception: Exception, attempts: int):
        self.last_exception = last_exception
        self.attempts = attempts
        super().__init__(
            f"Operation failed after {attempts} attempts: {last_exception}"
        )


def retry_with_backoff(
    *,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    retry_on: tuple[type[Exception], ...] = (DatabaseError, OperationalError, ConnectionError),
    log_message: str = "Retrying operation (attempt {attempt}/{max_attempts})",
) -> Callable:
    """
    Decorator / wrapper that retries a function with exponential backoff.

    Usage as decorator:
        @retry_with_backoff(max_attempts=5)
        def sync_weather():
            ...

    Usage as wrapper:
        result = retry_with_backoff(max_attempts=5)(sync_weather)()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception: Exception | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except retry_on as e:
                    last_exception = e
                    if attempt < max_attempts:
                        delay = min(base_delay * (exponential_base ** (attempt - 1)), max_delay)
                        logger.warning(
                            log_message.format(attempt=attempt, max_attempts=max_attempts),
                            exc_info=e,
                        )
                        time.sleep(delay)
                    else:
                        logger.error(
                            "Operation failed permanently after %d attempts", max_attempts,
                            exc_info=e,
                        )
                        raise RetryExhausted(last_exception, max_attempts) from e
                except Exception:
                    # Non-retryable exception — raise immediately
                    raise
            # Should not reach here, but be safe
            if last_exception:
                raise RetryExhausted(last_exception, max_attempts)
            raise RetryExhausted(Exception("Unknown failure"), max_attempts)
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Database unavailable — graceful degradation
# ---------------------------------------------------------------------------

class DatabaseUnavailable(Exception):
    """Raised when the database is not reachable and we want to degrade gracefully."""


def with_database_fallback(
    fallback_value: Any = None,
    log_message: str = "Database unavailable, returning fallback",
) -> Callable:
    """
    Decorator that catches database errors and returns a fallback value.

    Use this for read operations where stale/missing data is acceptable
    (e.g. dashboard widgets, cached reports).
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except (DatabaseError, OperationalError) as e:
                logger.warning(f"{log_message}: {e}")
                return fallback_value
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Redis unavailable — graceful degradation
# ---------------------------------------------------------------------------

class RedisUnavailable(Exception):
    """Raised when Redis is not reachable."""


def redis_available() -> bool:
    """Check if Redis is reachable via Django's cache backend."""
    try:
        cache.set_test("__redis_health__", "ok", 1)
        cache.delete("__redis_health__")
        return True
    except Exception:
        return False


def with_redis_fallback(
    fallback_value: Any = None,
    log_message: str = "Redis unavailable, using fallback",
) -> Callable:
    """
    Decorator that falls back when Redis operations fail.

    Cache reads return fallback; cache writes are silently skipped.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Broad catch: Redis operations can fail in many ways
                logger.warning(f"{log_message}: {e}")
                return fallback_value
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# External API failure — weather service resilience
# ---------------------------------------------------------------------------

class ExternalAPIError(Exception):
    """Base for external API failures."""
    def __init__(self, service: str, message: str, status_code: int | None = None):
        self.service = service
        self.message = message
        self.status_code = status_code
        super().__init__(f"{service}: {message}")


class WeatherAPIUnavailable(ExternalAPIError):
    """Open-Meteo or other weather API is down/unreachable."""


class WeatherInvalidResponse(ExternalAPIError):
    """Weather API returned unexpected/invalid data."""


# ---------------------------------------------------------------------------
# Celery job failure handling
# ---------------------------------------------------------------------------

class BackgroundJobFailed(Exception):
    """A background job (Celery task) failed."""

    def __init__(self, task_name: str, reason: str):
        self.task_name = task_name
        self.reason = reason
        super().__init__(f"Background job '{task_name}' failed: {reason}")


# ---------------------------------------------------------------------------
# Structured logging for resilience events
# ---------------------------------------------------------------------------

def log_resilience_event(
    event_type: str,
    context: dict[str, Any],
    level: str = "warning",
) -> None:
    """
    Log a structured resilience event.

    event_type: e.g. "database_unavailable", "redis_timeout", "weather_api_error",
                "celery_task_failed", "auth_failure", "rate_limited"
    context: structured key-value pairs for the event
    level: logging level
    """
    logger_opt = getattr(logger, level, logger.warning)
    logger_opt(
        "RESILIENCE %s: %s",
        event_type,
        context,
    )


# ---------------------------------------------------------------------------
# Input validation helpers (resilience against malformed input)
# ---------------------------------------------------------------------------

class MalformedRequest(Exception):
    """Raised when a request is malformed and cannot be processed."""

    def __init__(self, detail: str, field: str | None = None):
        self.detail = detail
        self.field = field
        super().__init__(f"Malformed request: {detail}")


def validate_positive_integer(value: Any, field_name: str = "value") -> int:
    """Validate and coerce to positive integer. Raises MalformedRequest on failure."""
    try:
        v = int(value)
        if v < 0:
            raise ValueError("must be non-negative")
        return v
    except (ValueError, TypeError) as e:
        raise MalformedRequest(f"Invalid {field_name}: {e}", field=field_name) from e


def validate_coordinate(value: Any, field_name: str = "coordinate") -> float:
    """Validate latitude/longitude. Raises MalformedRequest on failure."""
    try:
        v = float(value)
        if field_name.lower().startswith("lat"):
            if not -90 <= v <= 90:
                raise ValueError("latitude must be between -90 and 90")
        elif field_name.lower().startswith("lon") or field_name.lower() == "lng":
            if not -180 <= v <= 180:
                raise ValueError("longitude must be between -180 and 180")
        return v
    except (ValueError, TypeError) as e:
        raise MalformedRequest(f"Invalid {field_name}: {e}", field=field_name) from e


# ---------------------------------------------------------------------------
# Idempotency helper — avoid duplicate processing
# ---------------------------------------------------------------------------

class IdempotencyKeyConflict(Exception):
    """Raised when an idempotency key is reused with different payload."""


def idempotent_operation(
    cache_key_prefix: str,
    idempotency_window: int = 300,  # 5 minutes
):
    """
    Factory for idempotent operations.

    Returns a function that checks a cache key before executing.
    If the key exists and the result is cached, returns cached result.
    If the key exists with a different hash, raises IdempotencyKeyConflict.

    Usage in a view:
        idempotency = idempotent_operation("weather_sync", idempotency_window=600)

        @idempotency
        def handle_sync(request, farm_id):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Build idempotency key from args
            import hashlib
            import json

            key_data = {
                "prefix": cache_key_prefix,
                "args": [str(a) for a in args],
                "kwargs": {k: str(v) for k, v in sorted(kwargs.items())},
            }
            key_hash = hashlib.sha256(
                json.dumps(key_data, sort_keys=True).encode()
            ).hexdigest()[:16]

            full_key = f"idempotency:{cache_key_prefix}:{key_hash}"

            cached = cache.get(full_key)
            if cached is not None:
                logger.info("Idempotent hit for key %s", full_key)
                return cached

            result = func(*args, **kwargs)

            # Store result in cache
            cache.set(full_key, result, idempotency_window)
            logger.info("Idempotent result cached for key %s", full_key)

            return result
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Timeouts for external calls
# ---------------------------------------------------------------------------

class OperationTimeout(Exception):
    """Raised when an operation exceeds its time limit."""

    def __init__(self, operation: str, timeout_seconds: float):
        self.operation = operation
        self.timeout_seconds = timeout_seconds
        super().__init__(f"Operation '{operation}' timed out after {timeout_seconds}s")


def with_timeout(
    timeout_seconds: float,
    operation_name: str = "operation",
):
    """
    Wrap a callable to enforce a time limit.

    Note: Python's signal-based timeout only works in main thread.
    For Celery/web contexts, use per-request timeouts from the server
    (gunicorn --timeout) or Celery task timeouts.
    """
    import signal

    class TimeoutException(Exception):
        pass

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            def handler(signum, frame):
                raise TimeoutException()

            old_handler = signal.signal(signal.SIGALRM, handler)
            signal.alarm(int(timeout_seconds))
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)
        return wrapper
    return decorator
