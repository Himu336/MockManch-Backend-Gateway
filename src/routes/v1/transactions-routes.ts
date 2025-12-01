import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { getTransactionsController } from "../../controller/wallet-controller.js";

const transactionsRouter = express.Router();

// GET /api/v1/transactions - Get transaction history (authenticated)
transactionsRouter.get("/", authenticateToken, getTransactionsController);

export default transactionsRouter;

