from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.serializers import UserSerializer
from accounts.views import set_token_cookies
from rest_framework import status
from accounts.models import User
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import OtpToken
from django.core.mail import send_mail
from django.utils import timezone
from datetime import datetime, timedelta
import secrets
import hashlib


@api_view(['POST'])
def login2fa(request):
    user = get_object_or_404(User, username=request.data['username'])
    if not user.check_password(request.data['password']):
        return Response({"detail": "Wrong Password !"}, status=status.HTTP_406_NOT_ACCEPTABLE)

    send_otp(username=request.data.get('username'))

    return (Response({}, status=status.HTTP_200_OK))

def send_otp(username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return
    
    OtpToken.objects.filter(user=user, otp_expires_at__gt=timezone.now()).delete()
    
    otp = OtpToken.objects.create(
        user=user,
        otp_code=secrets.token_hex(3),
        otp_expires_at=timezone.now() + timezone.timedelta(minutes=3)
    )

    subject = "Your 2FA Verification Code"
    message = f"""
Hello {user.username},

Your verification code is: {otp.otp_code}

This code will expire in 3 minutes.

If you did not request this code, please ignore this email.

Thanks,
The Team
    """
    sender = settings.EMAIL_HOST_USER
    receiver = [user.email]

    try:
        send_mail(subject, message, sender, receiver, fail_silently=False)
    except Exception as e:
        print(f"Failed to send email: {e}")

@api_view(['POST'])
def confirm_account(request):
    username = request.data.get('username')
    otp_input = request.data.get('otp')
    
    if not username or not otp_input:
        return Response({"detail": "Username and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        otp = OtpToken.objects.filter(
            user=user,
            otp_expires_at__gt=timezone.now()
        ).latest('otp_created_at')
    except OtpToken.DoesNotExist:
        return Response({"detail": "No valid OTP found. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
    
    if secrets.compare_digest(otp_input.lower(), otp.otp_code.lower()):
        otp.delete()
        
        refresh = RefreshToken.for_user(user)
        response = Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "language": user.language,
            "2fa": user.two_factor_enabled
        }, status=status.HTTP_200_OK)
        set_token_cookies(response, str(refresh), str(refresh.access_token))
        
        return response
    else:
        return Response({"detail": "Invalid OTP code"}, status=status.HTTP_401_UNAUTHORIZED)
