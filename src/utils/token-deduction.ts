import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import type { Response } from "express";
import { deductTokens } from "../services/wallet-service.js";

/**
 * Service name mapping for token deduction
 */
export const SERVICE_TOKEN_MAP: Record<string, string> = {
  "text_interview": "text_interview",
  "voice_interview": "voice_interview",
  "video_interview": "video_interview",
  "group_practice": "group_practice",
  "ai_chat": "ai_chat",
};

/**
 * Deduct tokens for a service with proper error handling
 * Returns true if tokens were deducted, false if insufficient tokens (402 sent)
 * Throws error for other issues
 */
export async function deductTokensForService(
  req: AuthenticatedRequest,
  res: Response,
  serviceName: string,
  metadata?: any
): Promise<boolean> {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please include a valid Authorization token.",
    });
    return false;
  }

  try {
    await deductTokens(req.user.id, serviceName, {
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"],
      ...metadata,
    });
    return true;
  } catch (tokenError: any) {
    // Handle insufficient tokens - RETURN IMMEDIATELY
    if (tokenError.message === "INSUFFICIENT_TOKENS") {
      res.status(402).json({
        success: false,
        error: "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      });
      return false;
    }

    // Handle database schema errors
    if (
      tokenError.message?.includes("does not exist") ||
      tokenError.message?.includes("relation") ||
      tokenError.code === "42P01"
    ) {
      console.error("[Wallet System] Database error:", tokenError.message);
      res.status(500).json({
        success: false,
        error: "Service temporarily unavailable. Please try again later.",
      });
      return false;
    }

    // Handle service configuration errors
    if (tokenError.message?.includes("not found in token costs")) {
      console.error("[Wallet System] Configuration error:", tokenError.message);
      res.status(500).json({
        success: false,
        error: "Service configuration error. Please contact support.",
      });
      return false;
    }

    // Re-throw unexpected errors
    throw tokenError;
  }
}

