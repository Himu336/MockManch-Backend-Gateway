# Environment Variables Setup

## Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the values in your `.env` file

## Required Variables

### Supabase Configuration (Required for Auth)

To get your Supabase credentials:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:

   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret, under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon** key (public, under "Project API keys") → `SUPABASE_ANON_KEY`

⚠️ **Important**: 
- Never commit your `.env` file to git
- The `SUPABASE_SERVICE_ROLE_KEY` is secret - never expose it to the client
- The `SUPABASE_ANON_KEY` is public and safe for client-side use

### Database Configuration

Your `DATABASE_URL` should be in the format:
```
postgresql://user:password@host:port/database
```

If using Supabase, you can find this in:
- **Settings** → **Database** → **Connection string** → **URI**

### Other Variables

- `PORT`: Server port (default: 3000)
- `AGORA_APP_ID` & `AGORA_APP_CERT`: For video/voice features (optional if not using)
- `PYTHON_MICROSERVICE_URL`: URL of your Python microservice (defaults to localhost:8000)

## Example `.env` File

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERT=your_agora_cert
PYTHON_MICROSERVICE_URL=http://127.0.0.1:8000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### Error: "SUPABASE_URL is required in environment variables"

This means your `.env` file is missing the Supabase variables. Make sure:
1. The `.env` file exists in the project root
2. All three Supabase variables are set
3. You've restarted the server after adding the variables

### Error: "DATABASE_URL is required"

Make sure your `DATABASE_URL` is set correctly in the `.env` file.

