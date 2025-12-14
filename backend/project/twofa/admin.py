from django.contrib import admin
from .models import OtpToken


@admin.register(OtpToken)
class OtpTokenAdmin(admin.ModelAdmin):
    
    list_display = ('user', 'otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    list_filter = ('otp_created_at', 'otp_expires_at')
    
    search_fields = ('user__username', 'user__email', 'otp_code')
    
    readonly_fields = ('otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    ordering = ('-otp_created_at',)
    
    fields = ('user', 'otp_code', 'otp_created_at', 'otp_expires_at', 'is_expired')
    
    def is_expired(self, obj):
        from django.utils import timezone
        if obj.otp_expires_at:
            return timezone.now() > obj.otp_expires_at
        return False
    
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return True
    
    actions = ['delete_expired_otps']
    
    def delete_expired_otps(self, request, queryset):
        from django.utils import timezone
        deleted = queryset.filter(otp_expires_at__lt=timezone.now()).delete()
        self.message_user(request, f'{deleted[0]} expired OTP token(s) deleted successfully.')
    
    delete_expired_otps.short_description = 'Delete expired OTP tokens'
