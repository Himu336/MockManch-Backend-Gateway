# Authentication System Setup Guide

This guide explains how to set up and use the central authentication system for the MockManch platform using Supabase Auth.

## Overview

The authentication system uses **Supabase Auth** exclusively for all authentication operations. It includes:
- User signup and signin
- JWT token-based authentication
- Email verification
- Password reset
- User profile management
- Separate `auth` schema in Supabase for profile data

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Environment variables configured
3. Database migration applied

## Environment Variables

Add the following to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Existing variables
DATABASE_URL=your_database_connection_string
PORT=3000
# ... other existing variables
```

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon** key (public) → `SUPABASE_ANON_KEY`

⚠️ **Important**: Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client. It bypasses Row Level Security (RLS).

## Database Setup

### 1. Run the SQL Migration

Execute the SQL migration file to create the auth schema:

```bash
# Option 1: Using Supabase SQL Editor
# Copy and paste the contents of supabase_auth_schema.sql into the Supabase SQL Editor

# Option 2: Using psql
psql -h your-db-host -U postgres -d postgres -f supabase_auth_schema.sql
```

The migration creates:
- `auth.user_profiles` table - stores additional user profile data
- `auth.refresh_tokens` table - for refresh token management (optional)
- Row Level Security (RLS) policies
- Automatic triggers for profile creation and email verification sync

### 2. Update Drizzle Config

The `drizzle.config.ts` has been updated to include the `auth` schema. No additional changes needed.

## API Endpoints

All auth endpoints are prefixed with `/api/v1/auth`

### Public Endpoints (No Authentication Required)

#### 1. Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",  // optional
  "phoneNumber": "+1234567890"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 2. Sign In
```http
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 3. Sign Out
```http
POST /api/v1/auth/signout
Content-Type: application/json
X-Refresh-Token: your_refresh_token

{
  "refreshToken": "your_refresh_token"  // or send in header
}
```

#### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json
X-Refresh-Token: your_refresh_token

{
  "refreshToken": "your_refresh_token"  // or send in header
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### 5. Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

#### 6. Request Password Reset
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Protected Endpoints (Authentication Required)

Include the access token in the Authorization header:
```
Authorization: Bearer your_access_token
```

#### 7. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2024-01-01T00:00:00Z",
      ...
    },
    "profile": {
      "id": "uuid",
      "userId": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "bio": null,
      "avatarUrl": null,
      "isActive": true,
      "emailVerified": true,
      ...
    }
  }
}
```

#### 8. Update Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "phoneNumber": "+9876543210",
  "bio": "Software Engineer",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

## Using Authentication Middleware

To protect your routes, use the `authenticateToken` middleware:

```typescript
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";

// Protected route
router.get("/protected", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // Access user info via req.user
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  res.json({ message: "Protected route", userId });
});
```

### Optional Authentication

For routes that work with or without authentication:

```typescript
import { optionalAuth } from "../middleware/authMiddleware.js";

router.get("/public", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // User is authenticated
    res.json({ message: "Hello authenticated user", userId: req.user.id });
  } else {
    // User is not authenticated
    res.json({ message: "Hello guest" });
  }
});
```

## Frontend Integration

### Storing Tokens

Store tokens securely (preferably in httpOnly cookies or secure storage):

```javascript
// After signup/signin
const { accessToken, refreshToken } = response.data.data;

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Making Authenticated Requests

```javascript
const accessToken = localStorage.getItem('accessToken');

fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Token Refresh

Implement automatic token refresh when access token expires:

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Refresh-Token': refreshToken
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const { data } = await response.json();
  
  // Update stored tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.accessToken;
}
```

## Database Schema

### auth.user_profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users.id (Supabase Auth) |
| email | VARCHAR(255) | User email (unique) |
| full_name | VARCHAR(255) | User's full name |
| avatar_url | TEXT | Profile picture URL |
| phone_number | VARCHAR(20) | Phone number |
| bio | TEXT | User biography |
| is_active | BOOLEAN | Account active status |
| email_verified | BOOLEAN | Email verification status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### auth.refresh_tokens (Optional)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users.id |
| token | TEXT | Refresh token (unique) |
| expires_at | TIMESTAMP | Token expiration |
| revoked | BOOLEAN | Whether token is revoked |
| created_at | TIMESTAMP | Creation timestamp |

## Security Considerations

1. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to clients
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely (httpOnly cookies preferred)
4. **Token Expiration**: Implement proper token refresh logic
5. **RLS Policies**: Row Level Security is enabled on auth tables
6. **Password Policy**: Configure password requirements in Supabase dashboard

## Troubleshooting

### "SUPABASE_URL is required" Error

Make sure all Supabase environment variables are set in your `.env` file.

### "Invalid or expired token" Error

- Check if the token is correctly formatted in the Authorization header
- Verify the token hasn't expired
- Try refreshing the token

### Profile Not Created

The trigger `on_auth_user_created` should automatically create a profile. If it doesn't:
1. Check Supabase logs
2. Verify the trigger exists in the database
3. Manually create the profile if needed

### Email Verification Not Working

1. Check Supabase email settings in the dashboard
2. Verify email templates are configured
3. Check spam folder for verification emails

## Next Steps

1. Update existing routes to use authentication middleware
2. Replace `user_id` from request body with `req.user.id` from authenticated requests
3. Test all auth endpoints
4. Configure Supabase email templates
5. Set up password requirements in Supabase dashboard

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review Supabase Auth API: https://supabase.com/docs/reference/javascript/auth-api

