from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer
from .models import User
from rest_framework import status
from django.shortcuts import get_object_or_404

def set_token_cookies(response, refresh_token, access_token):
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='None',
    )
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=False,
        secure=True,
        samesite='None',
    )

@api_view(['POST'])
def login(req):
    username = req.data.get('username')
    password = req.data.get('password')
    
    if not username or not password:
        return Response({"detail": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.check_password(password):
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if user.two_factor_enabled:
        from twofa.views import send_otp
        send_otp(username=username)
        return Response({
            "requires_2fa": True,
            "message": "Verification code sent to your email"
        }, status=status.HTTP_200_OK)
    
    serializer = UserSerializer(instance=user)
    refresh = RefreshToken.for_user(user)
    response = Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "language": user.language,
        "requires_2fa": False
    }, status=status.HTTP_200_OK)
    set_token_cookies(response, str(refresh), str(refresh.access_token))
    return response

@api_view(['POST'])
def signup(req):
    username = req.data.get('username')
    email = req.data.get('email')
    password = req.data.get('password')
    
    if not username or not email or not password:
        return Response({"error": "Username, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already taken"}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = UserSerializer(data=req.data)
    if serializer.is_valid():
        serializer.save()
        user = User.objects.get(username=username)
        user.language = "en"
        user.two_factor_enabled = False
        user.set_password(password)
        user.save()
        return Response({"user": serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(req):
    try:
        refresh_token = req.COOKIES.get('refresh_token')
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        response.delete_cookie('username')
        response.delete_cookie('language')
        return response
    except Exception as e:
        return Response({"detail": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_token(req):
    return Response({"detail": "You are authenticated !"}, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def lang(req):
    user = req.user
    updated_language = req.data.get('language')

    if not updated_language:
        return Response({"error": "language is required"}, status=status.HTTP_400_BAD_REQUEST)

    user.language = updated_language
    user.save()
    response = Response({"message": "language updated successfully", "language": user.language})
    response.set_cookie(
        key='language',
        value=updated_language,
        samesite='None',
    )
    return response

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def set_2fa_status(req):
    user = req.user
    new_value = req.data.get('two_factor_enabled')

    if new_value is None:
        return Response({"error": "two_factor_enabled is required"}, status=status.HTTP_400_BAD_REQUEST)

    user.two_factor_enabled = new_value
    user.save()
    response = Response({"message": "value updated successfully", "two_factor_enabled": user.two_factor_enabled})
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_2fa_status(req):
    user = req.user
    return Response({"two_factor_enabled": user.two_factor_enabled}, status=status.HTTP_200_OK)