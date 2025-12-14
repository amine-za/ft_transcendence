import pytest
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from accounts.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestOAuth42:
    """Minimal OAuth42 tests"""

    def test_login42_redirects(self, api_client):
        """Test that /login42/ redirects to 42 OAuth"""
        response = api_client.get('/login42/')
        
        assert response.status_code == 302  # Redirect
        assert '42.fr/oauth/authorize' in response['Location']

    @patch('oauth42.views.requests.post')
    @patch('oauth42.views.requests.get')
    def test_login42_redir_creates_new_user(self, mock_get, mock_post, api_client):
        """Test OAuth callback creates new user"""
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {'access_token': 'fake_token'}
        )
        
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'login': 'oauth_user',
                'email': 'oauth@42.fr'
            }
        )
        
        response = api_client.get('/login42_redir/?code=fake_code')
        
        assert response.status_code == 302  # Redirect
        assert User.objects.filter(username='oauth_user').exists()
        user = User.objects.get(username='oauth_user')
        assert user.email == 'oauth@42.fr'
        assert user.language == 'en'

    def test_login42_redir_without_code(self, api_client):
        """Test OAuth callback fails without authorization code"""
        response = api_client.get('/login42_redir/')
        
        assert response.status_code == 400
        assert 'Authorization code not provided' in str(response.content)

    @patch('oauth42.views.requests.post')
    @patch('oauth42.views.requests.get')
    def test_login42_redir_existing_user(self, mock_get, mock_post, api_client):
        """Test OAuth callback with existing user"""
        User.objects.create_user(
            username='existing_oauth_user',
            email='existing@42.fr',
            password='somepass'
        )
        
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {'access_token': 'fake_token'}
        )
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'login': 'existing_oauth_user',
                'email': 'existing@42.fr'
            }
        )
        
        initial_count = User.objects.count()
        
        response = api_client.get('/login42_redir/?code=fake_code')
        
        assert response.status_code == 302
        assert User.objects.count() == initial_count
