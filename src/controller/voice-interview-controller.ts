import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  createVoiceInterviewSession,
  transcribeAudio,
  startVoiceInterview,
  processVoiceMessage,
  getVoiceInterviewState,
  getVoiceSessionStatus,
  getVoiceInterviewAnalysis,
  type CreateVoiceInterviewRequest,
  type TranscribeAudioRequest,
  type ProcessMessageRequest,
} from "../services/voice-interview-service.js";
import { deductTokensForService } from "../utils/token-deduction.js";

/**
 * Controller to create a new voice interview session
 * STRICT TOKEN DEDUCTION: Tokens are deducted BEFORE creating session
 */
export const createVoiceInterviewController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication is required (enforced by middleware)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please include a valid Authorization token.",
      });
    }

    // ============================================
    // CRITICAL: Deduct tokens BEFORE creating session
    // ============================================
    const tokensDeducted = await deductTokensForService(
      req,
      res,
      "voice_interview",
      {
        service: "voice_interview",
        interview_type: req.body.interview_type,
      }
    );

    if (!tokensDeducted) {
      // Error response already sent by deductTokensForService
      return;
    }

    const payload: CreateVoiceInterviewRequest = {
      job_role: req.body.job_role,
      experience_level: req.body.experience_level,
      company: req.body.company,
      job_description: req.body.job_description,
      interview_type: req.body.interview_type,
      interview_role: req.body.interview_role,
      difficulty: req.body.difficulty,
      user_id: req.user.id, // Use authenticated user ID
      num_questions: req.body.num_questions,
      duration_minutes: req.body.duration_minutes,
    };

    console.log("Create Voice Interview - Request payload:", payload);
    const result = await createVoiceInterviewSession(payload);

    if (result.success && result.data) {
      console.log("Create Voice Interview - Success, session_id:", result.data.session_id);
      return res.status(result.statusCode || 201).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Create Voice Interview - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to create voice interview session",
      });
    }
  } catch (err: any) {
    console.error("Create Voice Interview Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to transcribe audio to text
 */
export const transcribeAudioController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload: TranscribeAudioRequest = {
      session_id: req.body.session_id,
      audio_data: req.body.audio_data,
      audio_format: req.body.audio_format,
      sample_rate: req.body.sample_rate,
    };

    if (!payload.session_id || !payload.audio_data) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: session_id and audio_data are required",
      });
    }

    console.log("Transcribe Audio - Session:", payload.session_id);
    const result = await transcribeAudio(payload);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Transcribe Audio - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to transcribe audio",
      });
    }
  } catch (err: any) {
    console.error("Transcribe Audio Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to start the voice interview
 */
export const startVoiceInterviewController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id is required in request body",
      });
    }

    console.log("Start Voice Interview - Session:", session_id);
    const result = await startVoiceInterview(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Start Voice Interview - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to start voice interview",
      });
    }
  } catch (err: any) {
    console.error("Start Voice Interview Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to process user message and get AI response
 */
export const processVoiceMessageController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload: ProcessMessageRequest = {
      session_id: req.body.session_id,
      user_message: req.body.user_message,
      include_audio: req.body.include_audio,
    };

    if (!payload.session_id || !payload.user_message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: session_id and user_message are required",
      });
    }

    console.log("Process Voice Message - Session:", payload.session_id);
    const result = await processVoiceMessage(payload);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Process Voice Message - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to process voice message",
      });
    }
  } catch (err: any) {
    console.error("Process Voice Message Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get current state of the interview session
 */
export const getVoiceInterviewStateController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id || session_id === "undefined" || session_id === "null") {
      return res.status(400).json({
        success: false,
        error: `session_id parameter is required. Received: ${session_id || "undefined"}`,
      });
    }

    console.log("Get Voice Interview State - Session:", session_id);
    const result = await getVoiceInterviewState(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Get Voice Interview State - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get interview state",
      });
    }
  } catch (err: any) {
    console.error("Get Voice Interview State Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get session status information
 */
export const getVoiceSessionStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id || session_id === "undefined" || session_id === "null") {
      return res.status(400).json({
        success: false,
        error: `session_id parameter is required. Received: ${session_id || "undefined"}`,
      });
    }

    console.log("Get Voice Session Status - Session:", session_id);
    const result = await getVoiceSessionStatus(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Get Voice Session Status - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get session status",
      });
    }
  } catch (err: any) {
    console.error("Get Voice Session Status Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get comprehensive analysis of completed interview
 */
export const getVoiceInterviewAnalysisController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id || session_id === "undefined" || session_id === "null") {
      return res.status(400).json({
        success: false,
        error: `session_id parameter is required. Received: ${session_id || "undefined"}`,
      });
    }

    console.log("Get Voice Interview Analysis - Session:", session_id);
    const result = await getVoiceInterviewAnalysis(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Get Voice Interview Analysis - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get interview analysis",
      });
    }
  } catch (err: any) {
    console.error("Get Voice Interview Analysis Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

