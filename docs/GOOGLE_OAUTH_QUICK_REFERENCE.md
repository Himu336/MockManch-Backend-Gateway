# Google OAuth Quick Reference

## Backend Endpoints

### 1. Get OAuth URL
```
GET /api/v1/auth/oauth/google?redirect_to=https://yourdomain.com/callback
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}
```

### 2. Verify OAuth Session
```
POST /api/v1/auth/oauth/verify
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "..."
  }
}
```

## Frontend Flow

1. **Get OAuth URL** from backend or use Supabase client directly
2. **Redirect user** to Google OAuth
3. **Handle callback** - Supabase redirects back with code
4. **Exchange code** for session (Supabase client)
5. **Verify session** with backend (`/oauth/verify`)
6. **Store tokens** and redirect to app

## Required Supabase Configuration

1. **Google Provider Enabled** in Supabase Dashboard
2. **Client ID & Secret** added in Supabase
3. **Redirect URI** configured:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

## Required Google Cloud Console Configuration

1. **OAuth Consent Screen** configured
2. **OAuth Client ID** created (Web application)
3. **Authorized redirect URI**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

## What Happens Automatically

✅ User profile created/updated  
✅ Wallet initialized with 60 tokens  
✅ Email verified  
✅ Avatar and name synced from Google  

## Frontend Code Snippet

```javascript
// Sign in with Google
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/callback'
  }
})

// In callback page
const { data: { session } } = await supabase.auth.getSession()

// Verify with backend
await fetch('/api/v1/auth/oauth/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
```

