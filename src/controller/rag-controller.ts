import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { processRAGRequest } from "../services/rag-service.js";
import { deductTokens } from "../services/wallet-service.js";

/**
 * Controller to handle RAG requests from frontend
 * STRICT TOKEN DEDUCTION: Tokens are deducted BEFORE forwarding to RAG service
 * If insufficient tokens, request is NOT forwarded and 402 error is returned
 */
export const ragController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;

    // Validate request body
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request: message is required and must be a non-empty string",
      });
    }

    // Authentication is required (enforced by middleware)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please include a valid Authorization token.",
      });
    }

    const userId = req.user.id;

    // ============================================
    // CRITICAL: Deduct tokens BEFORE processing
    // If insufficient tokens, return 402 and STOP (don't forward to RAG)
    // ============================================
    try {
      await deductTokens(userId, "ai_chat", {
        timestamp: new Date().toISOString(),
        userAgent: req.headers["user-agent"],
        messageLength: message.length,
        service: "rag",
      });
    } catch (tokenError: any) {
      // Handle insufficient tokens - RETURN IMMEDIATELY (don't forward to RAG)
      if (tokenError.message === "INSUFFICIENT_TOKENS") {
        return res.status(402).json({
          success: false,
          error: "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
        });
      }

      // Handle database schema errors
      if (tokenError.message?.includes("does not exist") || 
          tokenError.message?.includes("relation") ||
          tokenError.code === "42P01") {
        console.error("[Wallet System] Database error:", tokenError.message);
        return res.status(500).json({
          success: false,
          error: "Service temporarily unavailable. Please try again later.",
        });
      }

      // Handle service configuration errors
      if (tokenError.message?.includes("not found in token costs")) {
        console.error("[Wallet System] Configuration error:", tokenError.message);
        return res.status(500).json({
          success: false,
          error: "Service configuration error. Please contact support.",
        });
      }

      // Re-throw unexpected errors to be caught by outer catch
      throw tokenError;
    }

    // ============================================
    // Tokens successfully deducted - Now forward to RAG service
    // ============================================
    const result = await processRAGRequest({
      message: message.trim(),
      user_id: userId,
    });

    // Return appropriate status code based on result
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      // Determine status code based on error type
      const statusCode = result.error?.includes("not available") || result.error?.includes("Connection refused")
        ? 503 // Service Unavailable
        : result.error?.includes("timed out")
        ? 504 // Gateway Timeout
        : 500; // Internal Server Error

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("RAG Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

