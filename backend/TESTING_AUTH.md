# Hustle Auth System - Testing Guide

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Hustle Auth API",
    "description": "Complete testing suite for Hustle authentication system",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"username\": \"testuser\", \"email\": \"test@example.com\", \"password\": \"TestPassword123!\", \"role\": \"client\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/register",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"emailOrUsername\": \"testuser\", \"password\": \"TestPassword123!\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "login"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "http://localhost:4000/api/auth/me",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "me"]
            }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"refreshToken\": \"{{refreshToken}}\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/refresh",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "refresh"]
            }
          }
        },
        {
          "name": "Forgot Password",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"email\": \"test@example.com\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/forgot-password",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "forgot-password"]
            }
          }
        },
        {
          "name": "Reset Password",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"resetToken\": \"{{resetToken}}\", \"password\": \"NewPassword123!\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/reset-password",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "reset-password"]
            }
          }
        },
        {
          "name": "Send Verification Email",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "http://localhost:4000/api/auth/send-verification-email",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "send-verification-email"]
            }
          }
        },
        {
          "name": "Verify Email",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"verificationToken\": \"{{verificationToken}}\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/auth/verify-email",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "verify-email"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "http://localhost:4000/api/auth/logout",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "OAuth",
      "item": [
        {
          "name": "Google Login",
          "request": {
            "method": "GET",
            "url": {
              "raw": "http://localhost:4000/api/oauth/google",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "oauth", "google"]
            }
          }
        },
        {
          "name": "Apple Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"code\": \"...\", \"state\": \"...\"}"
            },
            "url": {
              "raw": "http://localhost:4000/api/oauth/apple",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4000",
              "path": ["api", "oauth", "apple"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "accessToken",
      "value": ""
    },
    {
      "key": "refreshToken",
      "value": ""
    },
    {
      "key": "resetToken",
      "value": ""
    },
    {
      "key": "verificationToken",
      "value": ""
    }
  ]
}
```

## Manual Testing with cURL

### 1. Register a User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123!",
    "role": "client"
  }'

# Save the accessToken and refreshToken from response
```

### 2. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "johndoe",
    "password": "SecurePassword123!"
  }'
```

### 3. Get Current User (Protected Route)
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Access Token
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Forgot Password
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'

# Save the resetToken from response
```

### 6. Reset Password
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "YOUR_RESET_TOKEN",
    "password": "NewSecurePassword123!"
  }'
```

### 7. Send Verification Email
```bash
curl -X POST http://localhost:4000/api/auth/send-verification-email \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Verify Email
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "verificationToken": "YOUR_VERIFICATION_TOKEN"
  }'
```

### 9. Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test Scenarios

### Scenario 1: Complete Registration & Login Flow
1. ✅ Register new user
2. ✅ Verify user created in database
3. ✅ Login with credentials
4. ✅ Receive access & refresh tokens
5. ✅ Use access token to access protected route

### Scenario 2: Token Refresh Flow
1. ✅ Register/Login to get tokens
2. ✅ Wait for access token to expire (or use expired token)
3. ✅ Call refresh endpoint with refresh token
4. ✅ Receive new access token
5. ✅ Use new access token to access protected route

### Scenario 3: Password Reset Flow
1. ✅ Register user
2. ✅ Call forgot-password endpoint
3. ✅ Save reset token
4. ✅ Call reset-password with new password
5. ✅ Login with new password

### Scenario 4: Email Verification Flow
1. ✅ Register user
2. ✅ Call send-verification-email while authenticated
3. ✅ Save verification token
4. ✅ Call verify-email with token
5. ✅ Check isVerified=true in database

### Scenario 5: Error Handling
1. ✅ Register duplicate username → 409 error
2. ✅ Register duplicate email → 409 error
3. ✅ Login with wrong password → 401 error
4. ✅ Access protected route without token → 401 error
5. ✅ Use expired token → 401 error
6. ✅ Reset password with invalid token → 401 error

## Database Verification

After testing, verify data in PostgreSQL:

```sql
-- View all users
SELECT id, username, email, role, provider, isVerified, isActive, createdAt FROM "User";

-- View specific user
SELECT * FROM "User" WHERE email = 'john@example.com';

-- View auth tokens (if tracked)
SELECT * FROM "AuthToken" WHERE "userId" = 'YOUR_USER_ID';

-- Check last login
SELECT username, "lastLoginAt" FROM "User" ORDER BY "lastLoginAt" DESC LIMIT 5;
```

## Expected Behavior

### Registration
- ✅ Creates new user with bcrypt-hashed password
- ✅ Returns access & refresh tokens
- ✅ User can immediately login or access protected routes
- ✅ Prevents duplicate username/email

### Login
- ✅ Verifies credentials
- ✅ Updates lastLoginAt timestamp
- ✅ Returns access & refresh tokens
- ✅ Supports email or username

### Token Refresh
- ✅ Validates refresh token
- ✅ Returns new access token
- ✅ Does not invalidate old token (no blacklist yet)

### Password Reset
- ✅ Generates secure reset token
- ✅ Resets password when valid token provided
- ✅ Token expires after 30 minutes
- ✅ Old password becomes invalid

### Email Verification
- ✅ User starts unverified (isVerified=false)
- ✅ Generates verification token
- ✅ Sets isVerified=true when verified
- ✅ Prevents duplicate verification

### Protected Routes
- ✅ Requires valid access token
- ✅ Returns 401 if token missing
- ✅ Returns 401 if token invalid/expired
- ✅ Returns 403 if insufficient permissions

## Performance & Load Testing

Test with multiple concurrent requests:

```bash
# Generate 100 concurrent register requests
for i in {1..100}; do
  curl -X POST http://localhost:4000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"user$i\", \"email\": \"user$i@example.com\", \"password\": \"Password123!\"}" &
done
wait

# Check response times (add -w timing)
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### "Invalid or expired authentication token"
- Check if token is properly formatted: `Bearer <token>`
- Verify token hasn't expired (access token: 15m, refresh: 30d)
- Ensure you're using the correct secret in .env

### "A user with this email already exists"
- Use unique email for registration
- Email is case-insensitive and trimmed

### "Refresh token invalid"
- Ensure refresh token format is correct
- Check if refresh token has expired (30 days)
- Try logging in again to get fresh tokens

### OAuth not working
- Verify Google/Apple credentials in .env
- Check callback URLs match provider settings
- Ensure CORS allows OAuth domains
