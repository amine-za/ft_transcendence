# Backend Structure Documentation

## Overall Backend Structure

```
backend/project/
├── manage.py              # Django command-line tool
├── core/                  # Main configuration folder
│   ├── settings.py        # All Django settings
│   ├── urls.py           # Main URL router
│   ├── wsgi.py           # Production server entry
│   └── asgi.py           # Async server entry
├── accounts/             # Username/password authentication app
├── oauth42/              # 42 School OAuth login app
└── twofa/                # Two-factor authentication app
```

---

## 1. Core Folder (Configuration)

**Purpose:** Contains all the main Django configuration files.

- **`settings.py`**: All your project settings
  - Database connection (PostgreSQL)
  - Installed apps list
  - JWT authentication settings
  - CORS settings
  - Secret keys

- **`urls.py`**: Main URL router that connects URLs to apps
  ```python
  /api/user/...     → accounts app
  /api/login42/...  → oauth42 app
  /api/2fa/...      → twofa app
  ```

---

## 2. Accounts App (Standard Authentication)

**Purpose:** Handles normal username/password login.

**Key Files:**
- **`views.py`**: The logic for each endpoint
  - `login()` - Accepts username/password, returns JWT tokens
  - `signup()` - Creates new user accounts
  - `logout()` - Blacklists tokens and deletes cookies
  - `check_token()` - Verifies if user is authenticated (requires JWT)
  - `lang()` - Updates user language preference
  - `setfact()` / `getfact()` - Enable/disable 2FA for user

- **`urls.py`**: Maps URLs to views
  ```python
  /api/user/login/    → login()
  /api/user/signup/   → signup()
  /api/user/check/    → check_token()
  /api/user/logout/   → logout()
  ```

- **`authentication.py`**: Custom JWT authentication
  - `CustomJWTAuthentication` class reads JWT from cookies (not headers)
  - This is used by all `@permission_classes([IsAuthenticated])` endpoints

- **`serializers.py`**: Converts User objects to JSON and vice versa

---

## 3. OAuth42 App (42 School Login)

**Purpose:** Lets users log in with their 42 School account (OAuth 2.0).

**How it works:**
1. User clicks "Login with 42"
2. Redirects to 42's website
3. User authorizes your app
4. 42 redirects back with a code
5. Your backend exchanges code for access token
6. Gets user info from 42 API
7. Creates/logs in user and returns JWT tokens

**Key Files:**
- **`views.py`**: 
  - `login42()` - Starts OAuth flow (redirects to 42)
  - `login42_redir()` - Handles callback from 42, creates user, returns JWT

---

## 4. TwoFA App (Two-Factor Authentication)

**Purpose:** Adds email-based 2FA for extra security.

**How it works:**
1. User enables 2FA in their account settings
2. When they log in, backend sends 6-character code to their email
3. User must enter code to complete login
4. Code expires after 3 minutes

**Key Files:**
- **`models.py`**: 
  - `OtpToken` model stores temporary codes with expiration time

- **`views.py`**:
  - `login2fa()` - Generates code, sends email
  - `confirm()` - Verifies code is correct and not expired

---

## How Authentication Flow Works

### Normal Login (accounts app):
```
1. Frontend sends: POST /api/user/login/
   Body: { "username": "john", "password": "pass123" }

2. Backend checks password ✓

3. Backend generates JWT tokens:
   - Access token (short-lived, for API requests)
   - Refresh token (long-lived, to get new access tokens)

4. Backend returns:
   {
     "access": "eyJ0eXAiOiJKV1Qi...",
     "refresh": "eyJ0eXAiOiJKV1Qi...",
     "language": "en",
     "2fa": "f"  ← "t" if 2FA enabled, "f" if disabled
   }

5. Backend sets HTTP-only cookies with tokens

6. Frontend makes authenticated requests:
   Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

### With 2FA Enabled:
```
1. User logs in normally
2. Backend sees 2FA is enabled (user.last_name == "t")
3. Backend generates 6-char code, emails it to user
4. Frontend prompts user to enter code
5. User submits code to POST /api/2fa/confirm/
6. Backend verifies code, returns JWT tokens
```

---

## How Requests Are Protected

When you add `@permission_classes([IsAuthenticated])` to a view:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_token(req):
    return Response({"detail": "You are authenticated !"})
```

**What happens:**
1. Django REST Framework calls your `CustomJWTAuthentication` class
2. It reads the JWT token from cookies (or Authorization header)
3. Verifies the token is valid and not expired
4. Loads the user from the database
5. If valid: request proceeds, `req.user` is set to the logged-in user
6. If invalid: returns 401 Unauthorized immediately

---

## Database Tables

- **`auth_user`** (Django's built-in User table)
  - `username`, `email`, `password` (hashed)
  - `first_name` → stores language preference ("en", "ar", etc.)
  - `last_name` → stores 2FA status ("t" or "f")

- **`twofa_otptoken`** (your custom table)
  - `user` → which user this code belongs to
  - `otp_code` → 6-character code (e.g., "A3F7E2")
  - `created_at` → when code was generated
  - Codes expire after 3 minutes

---

## Why This Structure?

Each app has **one specific responsibility**:
- **accounts** = basic login/signup
- **oauth42** = 42 School integration
- **twofa** = extra security layer

This makes code easier to:
- Understand (each folder has clear purpose)
- Test (test each app independently)
- Maintain (change one feature without breaking others)
- Reuse (can copy `oauth42` app to other projects)
