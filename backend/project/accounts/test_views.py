import pytest
from rest_framework.test import APIClient
from .models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.mark.django_db
class TestAuthentication:
    """Minimal authentication tests"""

    def test_signup(self, api_client):
        """Test user can sign up"""
        response = api_client.post('/signup/', {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123'
        })
        assert response.status_code == 201  # Changed from 200 to 201 (Created)
        assert User.objects.filter(username='newuser').exists()

    def test_login(self, api_client, test_user):
        """Test user can log in"""
        response = api_client.post('/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert len(response.data['access']) > 0
        assert len(response.data['refresh']) > 0

    def test_protected_route_requires_auth(self, api_client):
        """Test protected routes require authentication"""
        response = api_client.get('/check/')
        assert response.status_code == 401

    def test_login_with_2fa_sends_otp(self, api_client, test_user):
        """Test that 2FA login sends OTP"""
        from twofa.models import OtpToken
        
        test_user.two_factor_enabled = True
        test_user.save()
        
        response = api_client.post('/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        assert response.status_code == 200
        assert response.data['requires_2fa'] == True
        assert 'access' not in response.data
        assert OtpToken.objects.filter(user=test_user).exists()

    def test_logout(self, api_client, test_user):
        """Test user can log out"""
        login_response = api_client.post('/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        assert login_response.status_code == 200
        
        response = api_client.post('/logout/')
        assert response.status_code == 205
