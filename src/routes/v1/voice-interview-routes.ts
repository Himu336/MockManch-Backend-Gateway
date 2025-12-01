import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  createVoiceInterviewController,
  transcribeAudioController,
  startVoiceInterviewController,
  processVoiceMessageController,
  getVoiceInterviewStateController,
  getVoiceSessionStatusController,
  getVoiceInterviewAnalysisController,
} from "../../controller/voice-interview-controller.js";

const voiceInterviewRouter = express.Router();

// POST /api/v1/voice-interview/create - Create a new voice interview session (REQUIRES AUTH & TOKENS)
voiceInterviewRouter.post("/create", authenticateToken, createVoiceInterviewController);

// POST /api/v1/voice-interview/transcribe - Transcribe audio to text (REQUIRES AUTH)
voiceInterviewRouter.post("/transcribe", authenticateToken, transcribeAudioController);

// POST /api/v1/voice-interview/start - Start the interview and get greeting (REQUIRES AUTH)
voiceInterviewRouter.post("/start", authenticateToken, startVoiceInterviewController);

// POST /api/v1/voice-interview/process - Process user message and get AI response (REQUIRES AUTH)
voiceInterviewRouter.post("/process", authenticateToken, processVoiceMessageController);

// GET /api/v1/voice-interview/:session_id/state - Get current state of the interview (REQUIRES AUTH)
voiceInterviewRouter.get("/:session_id/state", authenticateToken, getVoiceInterviewStateController);

// GET /api/v1/voice-interview/:session_id/status - Get session status information (REQUIRES AUTH)
voiceInterviewRouter.get("/:session_id/status", authenticateToken, getVoiceSessionStatusController);

// GET /api/v1/voice-interview/:session_id/analysis - Get comprehensive analysis (REQUIRES AUTH)
voiceInterviewRouter.get("/:session_id/analysis", authenticateToken, getVoiceInterviewAnalysisController);

export default voiceInterviewRouter;

