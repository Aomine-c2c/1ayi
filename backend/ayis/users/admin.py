from django.contrib import admin

from ayis.users.models import User  # noqa: F401
from ayis.farms.models import Farm  # noqa: F401


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)
    filter_horizontal = ("groups", "user_permissions")


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "area_ha", "created_at")
    list_filter = ("owner",)
    search_fields = ("name", "notes")
    ordering = ("name",)
