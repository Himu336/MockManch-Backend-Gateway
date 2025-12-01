# Strict Token Deduction System

## Overview

The token deduction system is now **strict and mandatory** for all RAG (AI Coach) requests. Tokens are deducted **BEFORE** the request is forwarded to the RAG service. If insufficient tokens, the request is **NOT forwarded** and a 402 error is returned immediately.

## Key Features

### ✅ Strict Token Deduction
- **Authentication Required**: All RAG requests MUST include a valid Authorization token
- **Pre-Deduction**: Tokens are deducted BEFORE forwarding to RAG service
- **Immediate Rejection**: If insufficient tokens, request is rejected with 402 status (no RAG call)
- **Atomic Operations**: All token operations use database transactions for consistency
- **Race Condition Protection**: PostgreSQL serializable isolation prevents concurrent deduction issues

## Request Flow

```
1. Request arrives at /api/v1/rag
   ↓
2. Authentication middleware validates token
   ↓
3. Controller validates request body (message required)
   ↓
4. 🔒 TOKEN DEDUCTION (CRITICAL STEP)
   ├─ Check wallet balance
   ├─ If insufficient → Return 402 immediately (STOP HERE)
   └─ If sufficient → Deduct tokens atomically
   ↓
5. Forward request to RAG service (only if tokens deducted)
   ↓
6. Return response to frontend
```

## API Endpoint

### POST /api/v1/rag

**Authentication**: **REQUIRED** (Bearer token in Authorization header)

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "Your question here"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    // RAG service response
  }
}
```

**Insufficient Tokens (402)**:
```json
{
  "success": false,
  "error": "You do not have enough tokens. Please purchase more tokens or upgrade your plan."
}
```

**Authentication Error (401)**:
```json
{
  "success": false,
  "error": "Authentication required. Please include a valid Authorization token."
}
```

## Token Costs

- **ai_chat**: 1 token per request

## Error Handling

### Insufficient Tokens (402)
- **When**: User balance < service cost
- **Action**: Request is **NOT forwarded** to RAG service
- **Response**: 402 status with error message
- **User Action**: User must purchase tokens or upgrade plan

### Database Errors (500)
- **When**: Wallet tables don't exist or database connection fails
- **Action**: Request is **NOT forwarded** to RAG service
- **Response**: 500 status with generic error message
- **Admin Action**: Run database migration

### Service Configuration Errors (500)
- **When**: Service cost not configured in database
- **Action**: Request is **NOT forwarded** to RAG service
- **Response**: 500 status with error message
- **Admin Action**: Initialize service costs in database

## Security Features

1. **Authentication Required**: Cannot bypass token deduction by omitting auth
2. **Server-Side Only**: Token costs are never exposed to frontend
3. **Atomic Transactions**: Prevents race conditions and double-deduction
4. **Audit Trail**: All token deductions are logged in `wallet_transactions` table

## Frontend Integration

### Required Changes

The frontend **MUST** send the Authorization header with every RAG request:

```javascript
// Example: React/Next.js
const response = await fetch('/api/v1/rag', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` // REQUIRED
  },
  body: JSON.stringify({
    message: userMessage
  })
});

// Handle insufficient tokens
if (response.status === 402) {
  const data = await response.json();
  // Show error: "You do not have enough tokens..."
  // Redirect to purchase page or show upgrade modal
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/v1/rag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ message })
  });

  if (response.status === 402) {
    // Insufficient tokens
    const error = await response.json();
    showError(error.error);
    redirectToPurchase();
  } else if (response.status === 401) {
    // Authentication error
    redirectToLogin();
  } else if (!response.ok) {
    // Other errors
    const error = await response.json();
    showError(error.error);
  } else {
    // Success
    const data = await response.json();
    displayResponse(data.data);
  }
} catch (error) {
  console.error('RAG request failed:', error);
  showError('Network error. Please try again.');
}
```

## Database Requirements

Ensure the wallet schema is created:

```sql
-- Run this migration
-- File: supabase_wallet_schema.sql
-- Or use: drizzle/apply_wallet_only.sql
```

Required tables:
- `wallet.wallets`
- `wallet.wallet_transactions`
- `wallet.services_token_costs`
- `wallet.subscription_plans`
- `wallet.purchases`

## Testing

### Test Cases

1. **Sufficient Tokens**
   - User has 10 tokens
   - Request succeeds
   - Balance becomes 9 tokens
   - RAG service is called

2. **Insufficient Tokens**
   - User has 0 tokens
   - Request returns 402
   - Balance remains 0
   - RAG service is **NOT** called

3. **No Authentication**
   - Request without Authorization header
   - Returns 401
   - RAG service is **NOT** called

4. **Invalid Token**
   - Request with expired/invalid token
   - Returns 401
   - RAG service is **NOT** called

## Monitoring

Check token deduction logs:
```sql
SELECT * FROM wallet.wallet_transactions 
WHERE reason = 'ai_chat' 
ORDER BY created_at DESC 
LIMIT 20;
```

Check user balances:
```sql
SELECT user_id, balance_tokens 
FROM wallet.wallets 
WHERE user_id = '<user_id>';
```

## Important Notes

1. **Tokens are consumed on attempt**: Even if RAG service fails, tokens are not refunded (standard pay-per-use model)
2. **No partial charges**: Full service cost is deducted upfront
3. **Atomic operations**: Token deduction and transaction logging happen in a single database transaction
4. **Race condition safe**: Multiple concurrent requests are handled safely via database transactions

## Troubleshooting

### Tokens not being deducted
- ✅ Check if Authorization header is being sent
- ✅ Verify token is valid (not expired)
- ✅ Check database migration is applied
- ✅ Verify `services_token_costs` table has `ai_chat` entry

### Getting 402 but user has tokens
- ✅ Check wallet balance in database
- ✅ Verify service cost configuration
- ✅ Check for concurrent requests (race condition)

### Database errors
- ✅ Run migration: `supabase_wallet_schema.sql`
- ✅ Verify database connection
- ✅ Check table permissions

