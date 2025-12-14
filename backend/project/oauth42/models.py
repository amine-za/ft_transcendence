from django.db import models

class User(models.Model):
    # Assuming these fields are available from the 42 API
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    language = models.CharField(max_length=5, default='en')
    two_factor_enabled = models.BooleanField(default=False)
    avatar = models.URLField(blank=True, null=True)
    last_login = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username