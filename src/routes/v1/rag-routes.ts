import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { ragController } from "../../controller/rag-controller.js";

const ragRouter = express.Router();

// POST /api/v1/rag - Forward RAG requests to Python microservice
// REQUIRES AUTHENTICATION - Tokens are deducted before processing
ragRouter.post("/", authenticateToken, ragController);

export default ragRouter;

