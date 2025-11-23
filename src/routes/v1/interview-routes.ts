import express from "express";
import {
  createInterviewController,
  getCurrentQuestionController,
  submitAnswerController,
  getAnalysisController,
  getSessionStatusController,
} from "../../controller/interview-controller.js";

const interviewRouter = express.Router();

// POST /api/v1/interview/create - Create a new interview session
interviewRouter.post("/create", createInterviewController);

// GET /api/v1/interview/:session_id/question - Get current question
interviewRouter.get("/:session_id/question", getCurrentQuestionController);

// POST /api/v1/interview/:session_id/answer - Submit answer for current question
interviewRouter.post("/:session_id/answer", submitAnswerController);

// GET /api/v1/interview/:session_id/analysis - Get comprehensive analysis
interviewRouter.get("/:session_id/analysis", getAnalysisController);

// GET /api/v1/interview/:session_id/status - Get session status
interviewRouter.get("/:session_id/status", getSessionStatusController);

export default interviewRouter;

