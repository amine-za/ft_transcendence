from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom User model with additional fields"""
    language = models.CharField(max_length=5, default='en')
    two_factor_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.username
