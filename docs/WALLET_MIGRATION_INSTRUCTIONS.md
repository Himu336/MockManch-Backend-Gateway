# Wallet Schema Migration Instructions

## Quick Fix for "relation does not exist" Errors

The errors you're seeing indicate that the `wallet` schema and tables haven't been created in your database yet.

## Step-by-Step Migration

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Open the file `supabase_wallet_schema.sql` in your project
   - Copy the **entire contents** of the file
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - Check that all statements executed without errors

### Option 2: Using psql (Command Line)

If you have `psql` installed and your `DATABASE_URL` configured:

```bash
# Get your database connection string from .env file
# Format: postgresql://user:password@host:port/database

# Run the migration
psql $DATABASE_URL -f supabase_wallet_schema.sql
```

Or if using Windows PowerShell:
```powershell
# Read DATABASE_URL from .env and run migration
$env:DATABASE_URL = (Get-Content .env | Select-String "DATABASE_URL").ToString().Split("=")[1]
psql $env:DATABASE_URL -f supabase_wallet_schema.sql
```

### Option 3: Using Drizzle Kit (Alternative)

If you prefer using Drizzle migrations:

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

**Note**: This may not work if Drizzle doesn't detect the schema properly. Use Option 1 or 2 for guaranteed results.

## Verification

After running the migration, verify the tables were created:

### In Supabase SQL Editor, run:

```sql
-- Check if wallet schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'wallet';

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'wallet'
ORDER BY table_name;

-- Should return:
-- wallets
-- wallet_transactions
-- subscription_plans
-- purchases
-- services_token_costs

-- Check if default data was inserted
SELECT * FROM wallet.services_token_costs;
SELECT * FROM wallet.subscription_plans;
```

### Expected Results:

1. **Schema exists**: `wallet` schema should be listed
2. **5 tables created**: All tables should be listed
3. **Default service costs**: 5 rows (ai_chat, text_interview, voice_interview, video_interview, group_practice)
4. **Default plans**: 4 rows (Free Plan, Starter, Pro Monthly, Ultra)

## Troubleshooting

### Error: "permission denied for schema wallet"
- Make sure you're running the migration as a user with CREATE privileges
- In Supabase, use the SQL Editor (it has the right permissions)

### Error: "relation already exists"
- This is fine! The `IF NOT EXISTS` clauses will skip existing tables
- The migration is idempotent and safe to run multiple times

### Error: "function already exists"
- The trigger function might already exist from a previous run
- This is safe to ignore

## After Migration

Once the migration is complete:

1. **Restart your server** (if it's running)
   ```bash
   # Stop the current server (Ctrl+C)
   # Restart it
   npm run dev
   ```

2. **Test the endpoints**:
   - `GET /api/v1/plans` - Should return 4 plans
   - `GET /api/v1/wallet` - Should work without errors (may return 0 balance for new users)

3. **Verify no more errors**:
   - Check your server logs
   - The "relation does not exist" errors should be gone

## Need Help?

If you encounter any issues:
1. Check the error message in Supabase SQL Editor
2. Verify your `DATABASE_URL` is correct in `.env`
3. Ensure you have the necessary database permissions
4. Check that you're connected to the correct database

