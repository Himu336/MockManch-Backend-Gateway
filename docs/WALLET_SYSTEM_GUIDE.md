# Token Wallet System Guide

## Overview

The token wallet system provides a centralized way to manage user tokens for pay-per-use services and subscription-based token refills. All token operations are atomic, secure, and auditable.

## Database Schema

The wallet system uses the `wallet` schema with the following tables:

- **wallets**: Stores user token balances
- **wallet_transactions**: Audit log of all token changes
- **subscription_plans**: Available token packs and subscription plans
- **purchases**: Records of all purchases made by users
- **services_token_costs**: Defines token cost for each service

## Setup

### 1. Run Database Migration

Execute the SQL migration file to create the wallet schema:

```bash
# Option 1: Using Supabase SQL Editor
# Copy and paste the contents of supabase_wallet_schema.sql into the Supabase SQL Editor

# Option 2: Using psql
psql -h your-db-host -U postgres -d postgres -f supabase_wallet_schema.sql
```

The migration will:
- Create the `wallet` schema
- Create all required tables
- Initialize default service costs
- Initialize default subscription plans
- Create indexes for performance
- Set up triggers for `updated_at` timestamps

### 2. Update Drizzle Config

The `drizzle.config.ts` has been updated to include the `wallet` schema. If you need to generate migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## API Endpoints

### GET /api/v1/wallet

Get current token balance and recent 20 transactions.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 150,
    "recentTransactions": [
      {
        "transactionId": "...",
        "changeAmount": -5,
        "type": "debit",
        "reason": "text_interview",
        "metadata": {...},
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### POST /api/v1/wallet/deduct

Deduct tokens for a service usage.

**Authentication**: Required

**Request Body**:
```json
{
  "service_name": "ai_chat"
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "newBalance": 145,
    "serviceName": "ai_chat"
  }
}
```

**Response** (Insufficient Tokens - 402):
```json
{
  "success": false,
  "error": "You do not have enough tokens. Please purchase more tokens or upgrade your plan."
}
```

### POST /api/v1/wallet/purchase

Purchase tokens or subscription plan.

**Authentication**: Required

**Request Body**:
```json
{
  "plan_id": "uuid-of-plan",
  "payment_id": "razorpay-or-stripe-payment-id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "newBalance": 520,
    "purchaseId": "uuid-of-purchase"
  }
}
```

**Note**: In production, you should verify the payment with Razorpay/Stripe webhook before crediting tokens. The current implementation assumes payment is valid if `payment_id` is provided.

### GET /api/v1/plans

Get all available subscription plans.

**Authentication**: Not required (public endpoint)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "planId": "...",
      "name": "Free Plan",
      "tokens": 20,
      "price": "0.00",
      "durationDays": 0,
      "isRecurring": false
    },
    {
      "planId": "...",
      "name": "Starter",
      "tokens": 200,
      "price": "9.99",
      "durationDays": 0,
      "isRecurring": false
    },
    {
      "planId": "...",
      "name": "Pro Monthly",
      "tokens": 500,
      "price": "19.99",
      "durationDays": 30,
      "isRecurring": true
    },
    {
      "planId": "...",
      "name": "Ultra",
      "tokens": 2000,
      "price": "49.99",
      "durationDays": 0,
      "isRecurring": false
    }
  ]
}
```

### GET /api/v1/transactions

Get full transaction history for the authenticated user.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of transactions to return (1-1000, default: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "...",
      "changeAmount": 500,
      "type": "credit",
      "reason": "Subscription Purchase: Pro Monthly",
      "metadata": {...},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Service Token Costs

Default service costs (can be modified in database):

- `ai_chat`: 1 token
- `text_interview`: 5 tokens
- `voice_interview`: 10 tokens
- `video_interview`: 15 tokens
- `group_practice`: 3 tokens

## Integration with Services

To deduct tokens when a service is used, call the wallet service before processing the request:

```typescript
import { deductTokens } from "../services/wallet-service.js";

// Before processing service request
try {
  await deductTokens(userId, "ai_chat", {
    // Additional metadata
  });
  // Process service request
} catch (error) {
  if (error.message === "INSUFFICIENT_TOKENS") {
    // Return 402 error to client
  }
}
```

## Security Features

1. **Atomic Operations**: All token operations use database transactions
2. **Transaction Isolation**: PostgreSQL transactions provide serializable isolation
3. **Audit Trail**: All token changes are logged in `wallet_transactions`
4. **Payment Verification**: Payment IDs are checked to prevent replay attacks
5. **Server-Side Only**: Token costs are never exposed to frontend
6. **Authentication Required**: All wallet operations require authentication

## Business Logic

### Token Deduction

- Must be performed only on backend
- Uses database transactions to avoid race conditions
- Never accepts token cost from frontend
- Returns 402 error if insufficient tokens

### Subscription Purchases

- Validates payment ID to prevent duplicate processing
- Credits tokens to wallet atomically
- Creates purchase record for audit
- For recurring plans, tokens should be auto-added every `duration_days` (requires cron job or scheduled task)

### Wallet Creation

- Wallets are created automatically on first use
- Initial balance is 0 tokens
- Users can purchase tokens to increase balance

## Future Enhancements

1. **Payment Gateway Integration**: Add webhook handlers for Razorpay/Stripe
2. **Recurring Subscriptions**: Implement cron job to auto-add tokens for recurring plans
3. **Token Expiration**: Add expiration dates for tokens if needed
4. **Promotional Tokens**: Add system to grant promotional tokens
5. **Admin Dashboard**: Add endpoints for managing plans and viewing all transactions

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error codes:
- `400`: Bad request (missing/invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `402`: Payment required (insufficient tokens)
- `404`: Not found (plan not found)
- `409`: Conflict (payment already processed)
- `500`: Internal server error

