# Hustle Auth System - Quick Start Guide

## 🚀 30-Second Overview

Hustle now has a **complete, production-grade authentication system** with:
- ✅ JWT login (email/username + password)
- ✅ Google OAuth
- ✅ Apple OAuth  
- ✅ Password reset
- ✅ Email verification
- ✅ Role-based access control

---

## 📦 What's Available Right Now

### Endpoints You Can Use

#### Public Endpoints (No Auth Required)
```
POST   /api/auth/register                    → Create account
POST   /api/auth/login                       → Login with credentials
POST   /api/auth/refresh                     → Get new access token
POST   /api/auth/forgot-password             → Request password reset
POST   /api/auth/reset-password              → Reset password with token
POST   /api/auth/verify-email                → Verify email with token
GET    /api/oauth/google                     → Login with Google
POST   /api/oauth/apple                      → Login with Apple
```

#### Protected Endpoints (Auth Required)
```
GET    /api/auth/me                          → Get current user
POST   /api/auth/logout                      → Logout
POST   /api/auth/send-verification-email    → Send verification token
```

---

## 🎯 Quick Test (5 Minutes)

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "role": "client",
      "isVerified": false
    }
  }
}
```

### 3. Get Current User (Protected)
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "Password123!"
  }'
```

✅ **All working!**

---

## 📋 Common Tasks

### Protect Your Own Route
```javascript
import { Router } from "express";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Only authenticated users
router.get(
  "/dashboard",
  authenticate,
  (req, res) => {
    res.json({ user: req.user });
  }
);

// Only admin and hustler roles
router.delete(
  "/posts/:id",
  authenticate,
  requireRoles("admin", "hustler"),
  (req, res) => {
    res.json({ message: "Post deleted" });
  }
);

export default router;
```

### Get Current User Info
```javascript
// In any protected route, req.user contains:
{
  id: "...",
  username: "testuser",
  email: "test@example.com",
  role: "client",
  isActive: true
}
```

### Refresh Token When Expired
```javascript
// Frontend code
const response = await fetch("/api/auth/refresh", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refreshToken: storageRefreshToken })
});
const { data } = await response.json();
// Use data.accessToken for next requests
```

---

## 🔐 Authentication Flow

### Traditional Login
```
1. User enters username + password
2. POST /api/auth/register or /api/auth/login
3. Server validates & hashes password
4. Returns accessToken + refreshToken
5. Frontend stores tokens
6. Use accessToken for all API calls
7. When expired, use refreshToken to get new accessToken
```

### OAuth Login
```
1. User clicks "Login with Google"
2. GET /api/oauth/google (redirects to Google)
3. User authorizes Hustle
4. Google redirects back to /api/oauth/google/callback
5. Server creates/logs in user automatically
6. Returns tokens
7. Frontend stores and uses tokens
```

---

## 🛡️ Security Features

Your auth system has:
- ✅ **Bcrypt password hashing** - Industry standard
- ✅ **JWT tokens** - Stateless, scalable
- ✅ **Token expiration** - Access (15m), Refresh (30d)
- ✅ **Rate limiting** - Prevent brute force
- ✅ **Input validation** - Zod schemas
- ✅ **RBAC** - Role-based permissions
- ✅ **OAuth provider verification**
- ✅ **Active user status checking**

---

## 📱 Mobile Integration

### Token Storage Strategy
```javascript
// iOS/Android Native
KeyChain.set("accessToken", token);           // Secure enclave
SessionStorage.set("refreshToken", token);    // Memory

// React Native
SecureStore.setItemAsync("accessToken", token);
```

### Authorization Header
```
All requests: Authorization: Bearer <accessToken>
```

### Refresh Flow
```
1. Request with expired token → 401 response
2. Use refresh token to get new access token
3. Retry original request with new token
4. If refresh fails → redirect to login
```

---

## 🚪 Password Reset Flow

### Request Reset
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Response: {"resetToken": "eyJhbGciOi..."}
```

### Reset Password
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "eyJhbGciOi...",
    "password": "NewPassword123!"
  }'

# Now user can login with new password
```

---

## 📧 Email Verification

### Send Verification (When Authenticated)
```bash
curl -X POST http://localhost:4000/api/auth/send-verification-email \
  -H "Authorization: Bearer <accessToken>"

# Response: {"verificationToken": "eyJhbGciOi..."}
```

### Verify Email
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"verificationToken": "eyJhbGciOi..."}'

# User.isVerified now true
```

---

## 🧑‍💻 Role-Based Access Control

### Available Roles
```javascript
"client"  // Regular user
"hustler" // Creator/service provider
"agent"   // Admin agent
"admin"   // System administrator
```

### Protecting Routes by Role
```javascript
// Only admins can delete users
router.delete(
  "/users/:id",
  authenticate,
  requireRoles("admin"),
  controller.deleteUser
);

// Admins and hustlers can manage posts
router.post(
  "/posts",
  authenticate,
  requireRoles("admin", "hustler"),
  controller.createPost
);

// Everyone can view profile (if authenticated)
router.get(
  "/profile/:id",
  authenticate,
  controller.getProfile
);
```

---

## 🔧 Configuration

### Minimal Setup (.env)
```env
# Generate with: openssl rand -hex 32
JWT_ACCESS_SECRET=your-random-secret
JWT_REFRESH_SECRET=your-random-secret

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/oauth/google/callback

# Optional: Apple OAuth
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=...
APPLE_CALLBACK_URL=http://localhost:4000/api/oauth/apple/callback
```

### Token Expiration (Optional)
```env
JWT_ACCESS_EXPIRES_IN=15m           # Default: 15 minutes
JWT_REFRESH_EXPIRES_IN=30d          # Default: 30 days
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=24
```

---

## 📚 Documentation

### For API Reference
→ Read **AUTH_SYSTEM.md** in backend folder

### For Testing
→ Read **TESTING_AUTH.md** in backend folder

### For Details
→ Read **AUTH_IMPLEMENTATION_SUMMARY.md** in backend folder

### Checklist
→ Read **AUTH_CHECKLIST.md** in backend folder

---

## ✨ Features Ready to Go

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ | Email + password signup |
| User Login | ✅ | Email or username login |
| JWT Tokens | ✅ | Access (15m) + Refresh (30d) |
| Password Reset | ✅ | Secure token-based |
| Email Verification | ✅ | Token-based, no email provider yet |
| Google OAuth | ✅ | Needs credentials in .env |
| Apple OAuth | ✅ | Needs credentials in .env |
| Role-Based Access | ✅ | 4 roles: client, hustler, agent, admin |
| Rate Limiting | ✅ | Built-in protection |
| Input Validation | ✅ | Zod schemas on all endpoints |
| Security Headers | ✅ | Helmet configured |

---

## 🎓 Learning Path

### Step 1: Understand JWT
- Access token = proof you're logged in
- Refresh token = proof you own the account
- Both are JWTs (JSON Web Tokens)

### Step 2: Try the Endpoints
- Register → Login → Get user → Refresh token
- See them working in real-time

### Step 3: Implement OAuth (Optional)
- Add Google OAuth credentials to .env
- Test "Login with Google"
- It auto-creates accounts!

### Step 4: Protect Your Routes
- Use `authenticate` middleware for protected routes
- Use `requireRoles` for admin features

### Step 5: Frontend Integration
- Store tokens securely
- Send accessToken in Authorization header
- Refresh when needed

---

## 🐛 Troubleshooting

### "Invalid or expired authentication token"
```
→ Check token hasn't expired
→ Ensure Bearer prefix in header
→ Use correct secret in .env
```

### "A user with this email already exists"
```
→ Use unique email for registration
→ Email is case-insensitive
```

### "Refresh token invalid"
```
→ Refresh token might be expired
→ Try logging in again to get fresh tokens
```

### "Cannot find module 'passport'"
```
→ Run: npm install (already in package.json)
```

---

## 🎯 Next Steps

### Immediate (Next 30 min)
1. Test register endpoint
2. Test login endpoint
3. Test protected route

### This Week
1. Setup OAuth credentials (Google/Apple)
2. Test OAuth flows
3. Connect to frontend

### Next Sprint
1. Send real emails (for reset/verification)
2. Add 2FA
3. Session management

---

## 💡 Tips & Tricks

### Generate JWT Secrets
```bash
openssl rand -hex 32
```

### Decode JWT to See Contents
```bash
# At jwt.io or use:
node -e "console.log(require('util').inspect(JSON.parse(Buffer.from('YOUR_JWT'.split('.')[1], 'base64').toString()), false, null, true))"
```

### Test Rate Limiting
```bash
# Make 11+ requests to /api/auth/register
# Should get 429 Too Many Requests
```

### Monitor Active Sessions
```sql
SELECT COUNT(*) as active_users 
FROM "User" 
WHERE "lastLoginAt" > now() - interval '24 hours';
```

---

## 🎉 You're Ready!

Your Hustle backend now has a **production-ready authentication system**.

- ✅ Works locally
- ✅ Scales to production
- ✅ Supports mobile apps
- ✅ Handles OAuth
- ✅ Protects sensitive routes
- ✅ Validated with Zod
- ✅ Documented thoroughly

**Go build amazing things! 🚀**

---

## 📞 Quick Links

- 📖 **Full API Docs**: AUTH_SYSTEM.md
- 🧪 **Testing Guide**: TESTING_AUTH.md
- 📋 **Implementation Summary**: AUTH_IMPLEMENTATION_SUMMARY.md
- ✅ **Checklist**: AUTH_CHECKLIST.md
- 🔗 **Postman Collection**: In TESTING_AUTH.md

---

Last Updated: 2026-05-14 | Auth System v1.0
