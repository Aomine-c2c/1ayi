"""
AYIS — custom exception handler.

Ensures API errors are structured and never swallowed.
Validation errors include field-level detail.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wrap DRF's exception handler to guarantee a consistent error shape.
    """
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — return a safe generic error.
        # In production, log the real traceback server-side.
        return Response(
            {
                "error": "internal_error",
                "message": "An unexpected error occurred.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Normalize the response data into a consistent shape.
    data = response.data

    if isinstance(data, dict):
        # Field errors or detail dict.
        return Response(
            {
                "error": "validation_error",
                "details": data,
            },
            status=response.status_code,
        )

    if isinstance(data, list):
        return Response(
            {
                "error": "validation_error",
                "details": {"non_field_errors": data},
            },
            status=response.status_code,
        )

    # Scalar error message.
    return Response(
        {
            "error": "error",
            "message": str(data),
        },
        status=response.status_code,
    )
