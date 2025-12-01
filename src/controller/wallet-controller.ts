import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  getWalletBalance,
  deductTokens,
  processPurchase,
  getAllPlans,
  getTransactionHistory,
} from "../services/wallet-service.js";

/**
 * GET /wallet - Get current token balance and recent transactions
 */
export const getWalletController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const walletData = await getWalletBalance(req.user.id);

    return res.status(200).json({
      success: true,
      data: walletData,
    });
  } catch (err: any) {
    console.error("Get wallet error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * POST /wallet/deduct - Deduct tokens for a service
 * Body: { service_name: "ai_chat" }
 */
export const deductTokensController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { service_name } = req.body;

    if (!service_name || typeof service_name !== "string") {
      return res.status(400).json({
        success: false,
        error: "service_name is required and must be a string",
      });
    }

    const result = await deductTokens(req.user.id, service_name, {
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      data: {
        newBalance: result.newBalance,
        serviceName: service_name,
      },
    });
  } catch (err: any) {
    console.error("Deduct tokens error:", err);

    // Handle insufficient tokens error
    if (err.message === "INSUFFICIENT_TOKENS") {
      return res.status(402).json({
        success: false,
        error: "You do not have enough tokens. Please purchase more tokens or upgrade your plan.",
      });
    }

    // Handle service not found error
    if (err.message?.includes("not found in token costs")) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * POST /wallet/purchase - Purchase tokens or subscription
 * Body: { plan_id: "...", payment_id: "..." }
 */
export const purchaseTokensController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { plan_id, payment_id } = req.body;

    if (!plan_id || typeof plan_id !== "string") {
      return res.status(400).json({
        success: false,
        error: "plan_id is required and must be a string",
      });
    }

    if (!payment_id || typeof payment_id !== "string") {
      return res.status(400).json({
        success: false,
        error: "payment_id is required and must be a string",
      });
    }

    const result = await processPurchase(req.user.id, {
      planId: plan_id,
      paymentId: payment_id,
    });

    return res.status(200).json({
      success: true,
      data: {
        newBalance: result.newBalance,
        purchaseId: result.purchaseId,
      },
    });
  } catch (err: any) {
    console.error("Purchase tokens error:", err);

    // Handle duplicate payment
    if (err.message?.includes("already processed")) {
      return res.status(409).json({
        success: false,
        error: err.message,
      });
    }

    // Handle plan not found
    if (err.message?.includes("Plan not found")) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * GET /plans - Get all available subscription plans
 */
export const getPlansController = async (
  _req: Request,
  res: Response
) => {
  try {
    const plans = await getAllPlans();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (err: any) {
    console.error("Get plans error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * GET /transactions - Get full transaction history for user
 */
export const getTransactionsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        error: "limit must be a number between 1 and 1000",
      });
    }

    const transactions = await getTransactionHistory(req.user.id, limit);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err: any) {
    console.error("Get transactions error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

