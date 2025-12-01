# Google OAuth Setup Guide with Supabase

This guide will help you set up Google OAuth authentication using Supabase for your MockManch platform.

## Prerequisites

- Supabase project created
- Google Cloud Console account
- Backend API running
- Frontend application ready

## Step 1: Configure Google OAuth in Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "MockManch" (or your app name)
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (optional for development)
   - Save and continue

### 1.2 Create OAuth Client ID

1. Application type: **Web application**
2. Name: "MockManch Web Client" (or your choice)
3. **Authorized JavaScript origins:**
   ```
   https://your-project-ref.supabase.co
   ```
   Replace `your-project-ref` with your Supabase project reference.

4. **Authorized redirect URIs:**
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   This is the Supabase callback URL format.

5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Configure Google OAuth in Supabase

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list
5. Toggle **Enable Google provider** to ON

### 2.2 Add Google Credentials

1. In the Google provider settings, enter:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret

2. Click **Save**

### 2.3 Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your frontend callback URL:
   ```
   https://yourdomain.com/auth/callback
   ```
   Or for development:
   ```
   http://localhost:3000/auth/callback
   ```

## Step 3: Environment Variables

Make sure your `.env` file has the Supabase credentials:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Backend API Endpoints

The backend provides two OAuth endpoints:

### 4.1 Get Google OAuth URL

**Endpoint:** `GET /api/v1/auth/oauth/google`

**Query Parameters:**
- `redirect_to` (required): URL to redirect to after OAuth (your frontend callback URL)

**Example Request:**
```bash
GET /api/v1/auth/oauth/google?redirect_to=https://yourdomain.com/auth/callback
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://your-project-ref.supabase.co/auth/v1/authorize?provider=google&..."
  }
}
```

### 4.2 Verify OAuth Session

**Endpoint:** `POST /api/v1/auth/oauth/verify`

**Request Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Or use Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "user_metadata": {
        "full_name": "John Doe",
        "avatar_url": "https://..."
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**What this endpoint does:**
- Verifies the OAuth access token
- Creates user profile if it doesn't exist
- Initializes wallet with 60 welcome tokens
- Updates profile with Google account info (name, avatar)

## Step 5: Frontend Integration

### 5.1 Using Supabase Client (Recommended)

The easiest way is to use Supabase client directly in your frontend:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Sign in with Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://yourdomain.com/auth/callback'
    }
  })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  // User will be redirected to Google
  // After authorization, they'll be redirected back to your callback URL
}

// Handle callback
async function handleCallback() {
  const { data, error } = await supabase.auth.getSession()
  
  if (error || !data.session) {
    console.error('Error getting session:', error)
    return
  }
  
  // Verify session with backend to ensure profile/wallet are set up
  const response = await fetch('https://your-api.com/api/v1/auth/oauth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.session.access_token}`
    }
  })
  
  const result = await response.json()
  
  if (result.success) {
    // User is authenticated and profile/wallet are set up
    console.log('User:', result.data.user)
  }
}
```

### 5.2 Using Backend API

If you prefer to use the backend API:

```javascript
// Step 1: Get OAuth URL from backend
async function signInWithGoogle() {
  const response = await fetch(
    'https://your-api.com/api/v1/auth/oauth/google?redirect_to=https://yourdomain.com/auth/callback'
  )
  
  const result = await response.json()
  
  if (result.success) {
    // Redirect user to OAuth URL
    window.location.href = result.data.url
  }
}

// Step 2: Handle callback (in your callback page)
async function handleCallback() {
  // Supabase will add code and state to URL
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  
  if (!code) {
    console.error('No authorization code')
    return
  }
  
  // Exchange code for session using Supabase client
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error || !data.session) {
    console.error('Error exchanging code:', error)
    return
  }
  
  // Verify session with backend
  const response = await fetch('https://your-api.com/api/v1/auth/oauth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.session.access_token}`
    }
  })
  
  const result = await response.json()
  
  if (result.success) {
    // User is authenticated
    // Store tokens and redirect to dashboard
    localStorage.setItem('accessToken', data.session.access_token)
    localStorage.setItem('refreshToken', data.session.refresh_token)
    window.location.href = '/dashboard'
  }
}
```

## Step 6: Complete Frontend Example (React/Next.js)

```typescript
// pages/auth/callback.tsx (Next.js)
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        console.error('Error getting session:', error)
        router.push('/login?error=oauth_failed')
        return
      }

      // Verify session with backend
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          }
        })

        const result = await response.json()

        if (result.success) {
          // Store tokens
          localStorage.setItem('accessToken', data.session.access_token)
          localStorage.setItem('refreshToken', data.session.refresh_token)
          
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/login?error=verification_failed')
        }
      } catch (err) {
        console.error('Error verifying session:', err)
        router.push('/login?error=verification_failed')
      }
    }

    handleCallback()
  }, [router])

  return <div>Authenticating...</div>
}
```

## Step 7: Testing

1. **Test OAuth Flow:**
   - Click "Sign in with Google" button
   - You should be redirected to Google
   - After authorization, you should be redirected back
   - Check that user profile and wallet are created

2. **Verify Wallet Creation:**
   - After OAuth sign-in, check wallet balance
   - Should have 60 tokens (welcome bonus)

3. **Check User Profile:**
   - Profile should have name and avatar from Google
   - Email should be verified

## Troubleshooting

### Issue: "redirect_uri_mismatch"

**Solution:**
- Make sure the redirect URI in Google Console matches exactly:
  ```
  https://your-project-ref.supabase.co/auth/v1/callback
  ```
- Check for trailing slashes or protocol mismatches

### Issue: "OAuth provider not enabled"

**Solution:**
- Go to Supabase Dashboard > Authentication > Providers
- Make sure Google provider is enabled
- Verify Client ID and Secret are correct

### Issue: "Invalid client credentials"

**Solution:**
- Double-check Client ID and Secret in Supabase
- Make sure you copied them correctly (no extra spaces)

### Issue: User profile not created

**Solution:**
- Make sure you call `/api/v1/auth/oauth/verify` after OAuth
- Check backend logs for errors
- Verify database schema is set up correctly

### Issue: Wallet not created

**Solution:**
- The wallet is created automatically when profile is created
- Check that `initializeWallet` function is working
- Verify wallet schema exists in database

## Security Notes

1. **Never expose Service Role Key** - Only use it server-side
2. **Use HTTPS** - OAuth requires HTTPS in production
3. **Validate redirect URLs** - Only allow trusted domains
4. **Store tokens securely** - Use httpOnly cookies or secure storage
5. **Handle token refresh** - Implement refresh token rotation

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Check backend server logs
3. Verify all environment variables are set
4. Ensure database migrations are applied

