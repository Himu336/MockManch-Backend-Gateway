# Authentication Quick Reference

## Environment Variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create new user account |
| POST | `/api/v1/auth/signin` | Sign in existing user |
| POST | `/api/v1/auth/signout` | Sign out current user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/verify-email` | Verify email address |
| POST | `/api/v1/auth/forgot-password` | Request password reset |

### Protected Routes (Require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/me` | Get current user profile |
| PUT | `/api/v1/auth/profile` | Update user profile |

## Request Examples

### Sign Up
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "fullName": "John Doe"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer your_access_token"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "bio": "Software Engineer"
  }'
```

## Using Middleware

### Protect a Route
```typescript
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";

router.get("/protected", authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id; // Access authenticated user ID
  res.json({ userId });
});
```

### Optional Authentication
```typescript
import { optionalAuth } from "../middleware/authMiddleware.js";

router.get("/public", optionalAuth, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // User is not authenticated
  }
});
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Frontend Integration

### Store Tokens
```javascript
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Make Authenticated Request
```javascript
fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### Refresh Token
```javascript
fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});
```

## Database Schema

### auth.user_profiles
- `id` (UUID)
- `user_id` (UUID) - References auth.users.id
- `email` (VARCHAR)
- `full_name` (VARCHAR)
- `avatar_url` (TEXT)
- `phone_number` (VARCHAR)
- `bio` (TEXT)
- `is_active` (BOOLEAN)
- `email_verified` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Common Issues

| Issue | Solution |
|--------|----------|
| "Invalid or expired token" | Refresh the token or sign in again |
| "SUPABASE_URL is required" | Check `.env` file has all Supabase variables |
| Profile not created | Check database triggers are installed |
| Email verification not working | Check Supabase email settings |

