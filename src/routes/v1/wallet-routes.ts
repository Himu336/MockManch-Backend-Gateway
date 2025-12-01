import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getWalletController,
  deductTokensController,
  purchaseTokensController,
} from "../../controller/wallet-controller.js";

const walletRouter = express.Router();

// GET /api/v1/wallet - Get wallet balance and recent transactions (authenticated)
walletRouter.get("/", authenticateToken, getWalletController);

// POST /api/v1/wallet/deduct - Deduct tokens for a service (authenticated)
walletRouter.post("/deduct", authenticateToken, deductTokensController);

// POST /api/v1/wallet/purchase - Purchase tokens or subscription (authenticated)
walletRouter.post("/purchase", authenticateToken, purchaseTokensController);

export default walletRouter;

