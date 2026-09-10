"""
AYIS — RBAC Permission Classes.

Object-level and role-based permissions for the entire API.
Every endpoint is protected by these classes.

See rbac_documentation.py for the complete permission matrix.
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from ayis.users.models import User


class IsFarmer(permissions.BasePermission):
    """Only users with farmer role."""

    message = "Farmer access required."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.FARMER


class IsOfficer(permissions.BasePermission):
    """Only users with agricultural officer role."""

    message = "Agricultural Officer access required."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.OFFICER


class IsAdmin(permissions.BasePermission):
    """Only users with administrator role."""

    message = "Administrator access required."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class IsOfficerOrAdmin(permissions.BasePermission):
    """Officers and administrators."""

    message = "Officer or Administrator access required."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            User.Role.OFFICER, User.Role.ADMIN
        )


class IsOwner(permissions.BasePermission):
    """
    Object-level: user owns the object.
    Used for farmer-owned resources (farms, cycles, harvests).
    """

    message = "You do not own this resource."

    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == User.Role.ADMIN:
            return True
        # Check owner relationship
        owner_field = getattr(obj, "owner", None)
        if owner_field is not None:
            return owner_field == request.user
        return False


class IsOwnerOrAssignedOfficer(permissions.BasePermission):
    """
    Object-level: owner OR officer assigned to the farm's region.
    """

    message = "Access denied."

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        # Check ownership
        owner = getattr(obj, "owner", None)
        if owner == request.user:
            return True

        # Check officer assignment (officer sees farms in assigned regions)
        if request.user.role == User.Role.OFFICER:
            farm = getattr(obj, "farm", None) or getattr(obj, "owner", None)
            if farm is not None:
                from ayis.farms.models import Farm
                if isinstance(farm, Farm):
                    return farm in request.user.officer_accessible_farms()
                # If farm is a reference that needs resolving
                return False
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Read: owner + assigned officers + admin.
    Write/Delete: owner only (or admin).
    """

    message = "You do not have permission to modify this resource."

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        # Read permissions
        if request.method in permissions.SAFE_METHODS:
            owner = getattr(obj, "owner", None)
            if owner == request.user:
                return True
            if request.user.role == User.Role.OFFICER:
                farm = getattr(obj, "farm", None) or getattr(obj, "owner", None)
                if farm is not None:
                    from ayis.farms.models import Farm
                    if isinstance(farm, Farm):
                        return farm in request.user.officer_accessible_farms()
            return False

        # Write/Delete: owner or admin
        owner = getattr(obj, "owner", None)
        return owner == request.user


class IsAssignedOfficerForFarm(permissions.BasePermission):
    """
    Permission for officer to access farm-scoped resources.
    Used on views where the farm is determined from the URL kwarg.
    """

    message = "You are not assigned to this farm's region."

    def has_permission(self, request, view):
        if request.user.role == User.Role.ADMIN:
            return True
        if request.user.role != User.Role.OFFICER:
            return False

        farm_id = view.kwargs.get("farm_id") or view.kwargs.get("pk")
        if farm_id is None:
            return False

        from ayis.farms.models import Farm
        try:
            farm = Farm.objects.get(pk=farm_id)
            return farm in request.user.officer_accessible_farms()
        except Farm.DoesNotExist:
            return False


class IsActiveUser(permissions.BasePermission):
    """
    Ensure the authenticated user's account is active.
    """

    message = "Account is disabled."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active
