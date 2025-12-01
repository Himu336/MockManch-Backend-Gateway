import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  createInterviewController,
  getCurrentQuestionController,
  submitAnswerController,
  getAnalysisController,
  getSessionStatusController,
} from "../../controller/interview-controller.js";

const interviewRouter = express.Router();

// POST /api/v1/interview/create - Create a new interview session (REQUIRES AUTH & TOKENS)
interviewRouter.post("/create", authenticateToken, createInterviewController);

// GET /api/v1/interview/:session_id/question - Get current question (REQUIRES AUTH)
interviewRouter.get("/:session_id/question", authenticateToken, getCurrentQuestionController);

// POST /api/v1/interview/:session_id/answer - Submit answer for current question (REQUIRES AUTH)
interviewRouter.post("/:session_id/answer", authenticateToken, submitAnswerController);

// GET /api/v1/interview/:session_id/analysis - Get comprehensive analysis (REQUIRES AUTH)
interviewRouter.get("/:session_id/analysis", authenticateToken, getAnalysisController);

// GET /api/v1/interview/:session_id/status - Get session status (REQUIRES AUTH)
interviewRouter.get("/:session_id/status", authenticateToken, getSessionStatusController);

export default interviewRouter;

