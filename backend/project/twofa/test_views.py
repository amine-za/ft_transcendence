import pytest
from rest_framework.test import APIClient
from accounts.models import User
from twofa.models import OtpToken
from django.utils import timezone


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        two_factor_enabled=True
    )


@pytest.mark.django_db
class TestTwoFactorAuth:
    """Minimal 2FA tests"""

    def test_login2fa_sends_otp(self, api_client, test_user):
        """Test that login2fa endpoint sends OTP"""
        response = api_client.post('/login2fa/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        assert response.status_code == 200
        # Verify OTP was created
        assert OtpToken.objects.filter(user=test_user).exists()
        otp = OtpToken.objects.get(user=test_user)
        assert len(otp.otp_code) == 6

    def test_confirm_with_valid_otp(self, api_client, test_user):
        """Test confirming account with valid OTP"""
        # Create an OTP
        otp = OtpToken.objects.create(
            user=test_user,
            otp_code='abc123',
            otp_expires_at=timezone.now() + timezone.timedelta(minutes=3)
        )
        
        response = api_client.post('/confirm/', {
            'username': 'testuser',
            'otp': 'abc123'
        })
        
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        # OTP should be deleted after successful verification
        assert not OtpToken.objects.filter(user=test_user).exists()

    def test_confirm_with_invalid_otp(self, api_client, test_user):
        """Test confirming with wrong OTP code"""
        # Create an OTP
        OtpToken.objects.create(
            user=test_user,
            otp_code='abc123',
            otp_expires_at=timezone.now() + timezone.timedelta(minutes=3)
        )
        
        response = api_client.post('/confirm/', {
            'username': 'testuser',
            'otp': 'wrong123'
        })
        
        assert response.status_code == 400
        assert 'invalide' in response.data['detail']

    def test_confirm_with_expired_otp(self, api_client, test_user):
        """Test confirming with expired OTP"""
        # Create an expired OTP (expires in the past)
        OtpToken.objects.create(
            user=test_user,
            otp_code='abc123',
            otp_expires_at=timezone.now() - timezone.timedelta(minutes=1)
        )
        
        response = api_client.post('/confirm/', {
            'username': 'testuser',
            'otp': 'abc123'
        })
        
        assert response.status_code == 400
        assert 'expired' in response.data['detail']
