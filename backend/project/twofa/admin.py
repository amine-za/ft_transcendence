from django.contrib import admin
from .models import OtpToken


@admin.register(OtpToken)
class OtpTokenAdmin(admin.ModelAdmin):
    """Admin interface for OTP tokens"""
    
    # Fields to display in the list view
    list_display = ('user', 'otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    # Filters in the right sidebar
    list_filter = ('otp_created_at', 'otp_expires_at')
    
    # Search fields
    search_fields = ('user__username', 'user__email', 'otp_code')
    
    # Read-only fields (OTP shouldn't be editable)
    readonly_fields = ('otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    # Ordering (newest first)
    ordering = ('-otp_created_at',)
    
    # Fields to display when viewing/editing
    fields = ('user', 'otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    def is_expired(self, obj):
        """Check if the OTP token has expired"""
        from django.utils import timezone
        if obj.otp_expires_at:
            return timezone.now() > obj.otp_expires_at
        return False
    
    is_expired.boolean = True  # Display as a boolean icon
    is_expired.short_description = 'Expired'
    
    def has_add_permission(self, request):
        """Disable manual OTP creation through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make OTP tokens read-only"""
        return True
    
    # Optional: Add a custom action to delete expired OTPs
    actions = ['delete_expired_otps']
    
    def delete_expired_otps(self, request, queryset):
        """Delete all expired OTP tokens"""
        from django.utils import timezone
        deleted = queryset.filter(otp_expires_at__lt=timezone.now()).delete()
        self.message_user(request, f'{deleted[0]} expired OTP token(s) deleted successfully.')
    
    delete_expired_otps.short_description = 'Delete expired OTP tokens'
