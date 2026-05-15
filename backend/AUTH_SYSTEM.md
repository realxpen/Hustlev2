# Hustle Authentication System

## Overview

Production-grade authentication system supporting JWT and OAuth (Google/Apple) with role-based access control, password reset, and email verification.

## Architecture

### Token Strategy
- **Access Token**: Short-lived JWT (15 minutes)
- **Refresh Token**: Long-lived JWT (30 days)
- **Reset Token**: Temporary token for password reset (30 minutes)
- **Verification Token**: Temporary token for email verification (24 hours)
- **OAuth State Token**: Temporary token for OAuth state verification (10 minutes)

### Key Services
- `tokenService` - JWT generation and verification
- `authService` - Core auth logic (register, login, password reset)
- `oauthService` - OAuth provider integration
- `authenticate` - JWT verification middleware
- `requireRoles` - RBAC middleware

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "role": "client" // or "hustler"
}

Response:
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "client",
      "isVerified": false
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john_doe",
  "password": "SecurePassword123!"
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "client",
      "isVerified": true
    }
  }
}
```

#### Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOi..."
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { ... }
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Logout successful. Token has been invalidated on the server.",
  "data": null
}
```

### Password Management

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset token generated. Use this token to reset your password.",
  "data": {
    "resetToken": "eyJhbGciOi..."
  }
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "eyJhbGciOi...",
  "password": "NewSecurePassword123!"
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully.",
  "data": null
}
```

### Email Verification

#### Send Verification Email
```http
POST /api/auth/send-verification-email
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Email verification token generated. Use this token to verify your email.",
  "data": {
    "verificationToken": "eyJhbGciOi..."
  }
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "verificationToken": "eyJhbGciOi..."
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully.",
  "data": null
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Authenticated user fetched successfully.",
  "data": {
    "id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profilePhoto": null,
    "bio": null,
    "role": "client",
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### OAuth

#### Google Login
```http
GET /api/oauth/google

Redirects to Google authorization URL
```

#### Google Callback
```http
GET /api/oauth/google/callback?code=...&state=...

Redirects to: http://localhost:3000/auth/callback?accessToken=...&refreshToken=...&userId=...&username=...
```

#### Apple Login
```http
POST /api/oauth/apple

{
  "code": "...",
  "state": "..."
}

Redirects to: http://localhost:3000/auth/callback?accessToken=...&refreshToken=...&userId=...&username=...
```

## Usage in Controllers

### Protecting Routes with Authentication
```javascript
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/protected",
  authenticate,
  (req, res) => {
    // req.user contains { id, username, email, role, isActive }
    res.json({ message: `Hello ${req.user.username}` });
  }
);
```

### Protecting Routes with Roles
```javascript
import { Router } from "express";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.delete(
  "/posts/:id",
  authenticate,
  requireRoles("admin", "hustler"),
  (req, res) => {
    // Only admin or hustler can delete posts
    res.json({ message: "Post deleted" });
  }
);
```

## Roles

- **client**: Regular user who posts and engages
- **hustler**: Creator/service provider
- **agent**: Admin agent
- **admin**: System administrator

## Configuration

Update `.env` with OAuth credentials:

```env
# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_STATE_SECRET=your-state-secret

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Password & Email Tokens
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=24

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/oauth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=your-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key
APPLE_CALLBACK_URL=http://localhost:4000/api/oauth/apple/callback

# Auth Settings
AUTH_REFRESH_COOKIE_NAME=hustle_refresh_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
AUTH_SET_REFRESH_COOKIE=true
AUTH_ALLOWED_REDIRECTS=http://localhost:3000,https://app.hustle.com
```

## Security Features

- ✅ bcryptjs password hashing (12 salt rounds)
- ✅ JWT token verification
- ✅ Rate limiting on auth endpoints
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Request validation (Zod)
- ✅ Unique email/username enforcement
- ✅ OAuth provider verification
- ✅ Token expiration handling
- ✅ Active user status checking

## Error Handling

All auth endpoints follow standard error response format:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired authentication token.",
  "error": "...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Common error codes:
- **400**: Invalid input/validation error
- **401**: Authentication failed or token expired
- **403**: Insufficient permissions
- **409**: Duplicate email/username
- **404**: User not found

## Mobile Integration

### Token Storage
Store tokens securely on mobile:
- **Access Token**: Memory or secure enclave
- **Refresh Token**: Keychain (iOS) / Keystore (Android)

### OAuth Flow
1. Client initiates OAuth login
2. Server redirects to provider
3. Provider redirects back with auth code
4. Server exchanges code for user data
5. Server returns access + refresh tokens
6. Client stores tokens securely

### Refresh Flow
1. Client attempts request with expired access token
2. Server returns 401
3. Client uses refresh token to get new access token
4. Client retries original request
5. If refresh token expired, redirect to login

## Testing

### Test Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "TestPassword123!"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Mobile/Web Client               │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼─────┐ ┌──▼──────┐ ┌──▼──────────┐
    │ JWT Auth │ │  OAuth  │ │  Password   │
    │          │ │         │ │  Reset      │
    └────┬─────┘ └──┬──────┘ └──┬──────────┘
         │          │           │
         └──────────┼───────────┘
                    │
         ┌──────────▼──────────┐
         │  tokenService       │
         │  authService        │
         │  oauthService       │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL DB     │
         │   (Prisma ORM)      │
         └─────────────────────┘
```

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Social login linking
- [ ] Account recovery options
- [ ] Session management
- [ ] IP-based security checks
- [ ] Email notifications
- [ ] Account activity logging
- [ ] Device management
