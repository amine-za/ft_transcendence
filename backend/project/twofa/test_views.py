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
        assert OtpToken.objects.filter(user=test_user).exists()
        otp = OtpToken.objects.get(user=test_user)
        assert len(otp.otp_code) == 6

    def test_confirm_with_valid_otp(self, api_client, test_user):
        """Test confirming account with valid OTP"""
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
        assert len(response.data['access']) > 0
        assert len(response.data['refresh']) > 0
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
        
        assert response.status_code == 401  # Changed from 400 to 401 (Unauthorized)
        assert response.data['detail'] == 'Invalid OTP code'

    def test_confirm_with_expired_otp(self, api_client, test_user):
        """Test confirming with expired OTP"""
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
        assert response.data['detail'] == 'No valid OTP found. Please request a new one.'
