import os
from django.shortcuts import redirect
from django.http import HttpRequest, HttpResponse, JsonResponse
from accounts.models import User
import requests

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.views import set_token_cookies
from twofa.views import send_otp

UID = os.environ.get('UID')
SECRET = os.environ.get('SECRET')
AUTH_URL = f"https://api.intra.42.fr/oauth/authorize?client_id={UID}&redirect_uri=https%3A%2F%2F127.0.0.1%3A8000%2Flogin42_redir%2F&response_type=code"
REDIRECT_URI = 'https://127.0.0.1:8000/login42_redir/'

def login42(request: HttpRequest):
	return redirect(AUTH_URL)

# Function to exchange authorization code for access token
def exchange_code_for_token(code: str):
    token_url = "https://api.intra.42.fr/oauth/token"
    data = {
        'client_id': UID,
        'client_secret': SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    response = requests.post(token_url, data=data)

    if response.status_code != 200:
        return None
    
    return response.json().get('access_token')

# Function to get user data from 42 API using the access token
def get_42_user_info(access_token: str):
    user_info_url = "https://api.intra.42.fr/v2/me"
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    response = requests.get(user_info_url, headers=headers)

    if response.status_code != 200:
        return None
    
    return response.json()

# Main view to handle the OAuth redirect
@api_view(['GET'])
def login42_redir(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({"error": "Authorization code not provided"}, status=400)
    access_token = exchange_code_for_token(code)
    if not access_token:
        return JsonResponse({"error": "Failed to retrieve access token"}, status=400)
    user_info = get_42_user_info(access_token)
    if not user_info:
        return JsonResponse({"error": "Failed to retrieve user information"}, status=400)
    username = user_info.get('login')
    try:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': user_info.get('email'),
                'language': "en",
                'two_factor_enabled': False
            }
        )

        if not user.two_factor_enabled:
            refresh = RefreshToken.for_user(user)

            response = redirect("https://127.0.0.1/#dashboard")
            set_token_cookies(response, str(refresh), str(refresh.access_token))
            response.set_cookie(key='username', value=username)
            response.set_cookie(key='language', value=user.language)

            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'

        elif user.two_factor_enabled:
            send_otp(username)

            response = redirect("https://127.0.0.1/#verify")
            response.set_cookie(key='username', value=username)
            response.set_cookie(key='language', value=user.language)

        return response

    except Exception as e:
        return JsonResponse({"error": "An error occurred"}, status=500)