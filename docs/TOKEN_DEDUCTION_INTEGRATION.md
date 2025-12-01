# Token Deduction System - Complete Integration

## Overview

The token deduction system has been **fully integrated** into all services across the platform. All service endpoints now require authentication and deduct tokens **BEFORE** processing requests. If insufficient tokens, requests are **immediately rejected** with a 402 error.

## Integrated Services

### ✅ 1. AI Chat (RAG) - `/api/v1/rag`
- **Service Name**: `ai_chat`
- **Token Cost**: 1 token per request
- **Endpoint**: `POST /api/v1/rag`
- **Token Deduction**: Before forwarding to RAG service
- **Status**: ✅ Integrated

### ✅ 2. Text Interview - `/api/v1/interview/create`
- **Service Name**: `text_interview`
- **Token Cost**: 5 tokens per session
- **Endpoint**: `POST /api/v1/interview/create`
- **Token Deduction**: Before creating interview session
- **Status**: ✅ Integrated

### ✅ 3. Voice Interview - `/api/v1/voice-interview/create`
- **Service Name**: `voice_interview`
- **Token Cost**: 10 tokens per session
- **Endpoint**: `POST /api/v1/voice-interview/create`
- **Token Deduction**: Before creating voice interview session
- **Status**: ✅ Integrated

### ✅ 4. Group Practice - `/api/v1/room/create` & `/api/v1/room/join`
- **Service Name**: `group_practice`
- **Token Cost**: 3 tokens per room creation/join
- **Endpoints**: 
  - `POST /api/v1/room/create`
  - `POST /api/v1/room/join`
- **Token Deduction**: Before creating or joining room
- **Status**: ✅ Integrated

## Architecture

### Reusable Token Deduction Utility

Created `src/utils/token-deduction.ts` with a centralized `deductTokensForService()` function that:
- Handles all token deduction logic
- Provides consistent error handling
- Returns boolean to indicate success/failure
- Sends appropriate HTTP responses (402, 500, etc.)

### Controller Pattern

All service controllers follow this pattern:

```typescript
export const serviceController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Validate authentication
    if (!req.user?.id) {
      return res.status(401).json({ ... });
    }

    // 2. CRITICAL: Deduct tokens BEFORE processing
    const tokensDeducted = await deductTokensForService(
      req,
      res,
      "service_name",
      { metadata }
    );

    if (!tokensDeducted) {
      // Error response already sent by utility
      return;
    }

    // 3. Process service request (only if tokens deducted)
    const result = await processServiceRequest(...);
    
    // 4. Return response
    return res.status(200).json({ ... });
  } catch (err) {
    // Error handling
  }
};
```

## Request Flow (All Services)

```
1. Request arrives at service endpoint
   ↓
2. Authentication middleware validates token
   ↓
3. Controller validates request body
   ↓
4. 🔒 TOKEN DEDUCTION (CRITICAL STEP)
   ├─ Check wallet balance
   ├─ If insufficient → Return 402 immediately (STOP HERE)
   └─ If sufficient → Deduct tokens atomically
   ↓
5. Process service request (only if tokens deducted)
   ↓
6. Return response to frontend
```

## Service Token Costs

| Service | Token Cost | Endpoint |
|---------|-----------|----------|
| AI Chat | 1 token | `POST /api/v1/rag` |
| Text Interview | 5 tokens | `POST /api/v1/interview/create` |
| Voice Interview | 10 tokens | `POST /api/v1/voice-interview/create` |
| Group Practice | 3 tokens | `POST /api/v1/room/create` or `/join` |

## Authentication Requirements

**ALL service endpoints now require authentication:**

- ✅ `POST /api/v1/rag` - Requires `authenticateToken`
- ✅ `POST /api/v1/interview/create` - Requires `authenticateToken`
- ✅ `POST /api/v1/voice-interview/create` - Requires `authenticateToken`
- ✅ `POST /api/v1/room/create` - Requires `authenticateToken`
- ✅ `POST /api/v1/room/join` - Requires `authenticateToken`

## Error Responses

### Insufficient Tokens (402)
```json
{
  "success": false,
  "error": "You do not have enough tokens. Please purchase more tokens or upgrade your plan."
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authentication required. Please include a valid Authorization token."
}
```

### Database Error (500)
```json
{
  "success": false,
  "error": "Service temporarily unavailable. Please try again later."
}
```

## Security Features

1. **Mandatory Authentication**: All services require valid JWT tokens
2. **Pre-Deduction**: Tokens deducted BEFORE service processing
3. **Atomic Operations**: Database transactions prevent race conditions
4. **Server-Side Only**: Token costs never exposed to frontend
5. **Audit Trail**: All deductions logged in `wallet_transactions`
6. **Immediate Rejection**: Insufficient tokens = immediate 402 (no service call)

## Frontend Integration

### Required Changes

All service requests **MUST** include the Authorization header:

```javascript
// Example for all services
const response = await fetch('/api/v1/interview/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` // REQUIRED
  },
  body: JSON.stringify({
    job_role: 'Software Engineer',
    experience_level: 'Senior',
    // ... other fields
  })
});

// Handle insufficient tokens
if (response.status === 402) {
  const error = await response.json();
  showError(error.error);
  redirectToPurchase();
}
```

## Testing Checklist

- [ ] AI Chat with sufficient tokens → Tokens deducted, request succeeds
- [ ] AI Chat with insufficient tokens → Returns 402, no RAG call
- [ ] Text Interview with sufficient tokens → Tokens deducted, session created
- [ ] Text Interview with insufficient tokens → Returns 402, no session created
- [ ] Voice Interview with sufficient tokens → Tokens deducted, session created
- [ ] Voice Interview with insufficient tokens → Returns 402, no session created
- [ ] Group Practice create with sufficient tokens → Tokens deducted, room created
- [ ] Group Practice create with insufficient tokens → Returns 402, no room created
- [ ] Group Practice join with sufficient tokens → Tokens deducted, user joined
- [ ] Group Practice join with insufficient tokens → Returns 402, user not joined
- [ ] All endpoints without auth token → Returns 401

## Files Modified

### Controllers
- ✅ `src/controller/rag-controller.ts` - Token deduction integrated
- ✅ `src/controller/interview-controller.ts` - Token deduction integrated
- ✅ `src/controller/voice-interview-controller.ts` - Token deduction integrated
- ✅ `src/controller/room-controller.ts` - Token deduction integrated

### Routes
- ✅ `src/routes/v1/rag-routes.ts` - Authentication middleware added
- ✅ `src/routes/v1/interview-routes.ts` - Authentication middleware added
- ✅ `src/routes/v1/voice-interview-routes.ts` - Authentication middleware added
- ✅ `src/routes/v1/room-routes.ts` - Authentication middleware added

### Utilities
- ✅ `src/utils/token-deduction.ts` - Reusable token deduction utility created

## Important Notes

1. **Tokens are consumed on attempt**: Even if service fails after token deduction, tokens are not refunded (standard pay-per-use model)
2. **No partial charges**: Full service cost is deducted upfront
3. **Atomic operations**: Token deduction and transaction logging happen in a single database transaction
4. **Race condition safe**: Multiple concurrent requests are handled safely via database transactions
5. **User ID from token**: All services now use `req.user.id` from authenticated token (not from request body)

## Next Steps

1. ✅ Database migration applied (run `supabase_wallet_schema.sql`)
2. ✅ All services integrated
3. ✅ Authentication middleware added
4. ⏳ Frontend updates needed to send Authorization headers
5. ⏳ Test all endpoints with various token balances

## Support

For issues or questions:
- Check `TOKEN_DEDUCTION_SYSTEM.md` for detailed documentation
- Check `WALLET_SYSTEM_GUIDE.md` for wallet system overview
- Verify database migration is applied
- Check server logs for detailed error messages

