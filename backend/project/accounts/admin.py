from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    
    # Fields to display in the list view
    list_display = ('username', 'email', 'first_name', 'last_name', 'language', 'two_factor_enabled', 'is_staff', 'is_active', 'date_joined')
    
    # Filters in the right sidebar
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'two_factor_enabled', 'language', 'date_joined')
    
    # Search fields
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Fields to display when editing a user
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Preferences', {'fields': ('language', 'two_factor_enabled')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'language', 'two_factor_enabled'),
        }),
    )
    
    # Ordering
    ordering = ('-date_joined',)
    
    # Make certain fields readonly
    readonly_fields = ('date_joined', 'last_login')
