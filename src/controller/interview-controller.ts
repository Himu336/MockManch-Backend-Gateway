import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  createInterviewSession,
  getCurrentQuestion,
  submitAnswer,
  getAnalysis,
  getSessionStatus,
  type CreateInterviewRequest,
  type SubmitAnswerRequest,
} from "../services/interview-service.js";
import { deductTokensForService } from "../utils/token-deduction.js";

/**
 * Controller to create a new interview session
 * STRICT TOKEN DEDUCTION: Tokens are deducted BEFORE creating session
 */
export const createInterviewController = async (req: AuthenticatedRequest, res: Response) => {
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
      "text_interview",
      {
        service: "text_interview",
        interview_type: req.body.interview_type,
      }
    );

    if (!tokensDeducted) {
      // Error response already sent by deductTokensForService
      return;
    }

    const payload: CreateInterviewRequest = {
      job_role: req.body.job_role,
      experience_level: req.body.experience_level,
      company: req.body.company,
      job_description: req.body.job_description,
      interview_type: req.body.interview_type,
      user_id: req.user.id, // Use authenticated user ID
      num_questions: req.body.num_questions,
    };

    console.log("Create Interview - Request payload:", payload);
    const result = await createInterviewSession(payload);

    if (result.success && result.data) {
      console.log("Create Interview - Success, session_id:", result.data.session_id);
      return res.status(result.statusCode || 201).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Create Interview - Service error:", result.error);
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to create interview session",
      });
    }
  } catch (err: any) {
    console.error("Create Interview Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get current question for an interview session
 */
export const getCurrentQuestionController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    // Enhanced validation with logging
    if (!session_id || session_id === 'undefined' || session_id === 'null') {
      console.error("Get Current Question - Invalid session_id:", {
        session_id,
        params: req.params,
        url: req.url,
        path: req.path,
      });
      return res.status(400).json({
        success: false,
        error: `session_id parameter is required. Received: ${session_id || 'undefined'}`,
        debug: {
          params: req.params,
          url: req.url,
        }
      });
    }

    console.log("Get Current Question - Valid session_id:", session_id);
    const result = await getCurrentQuestion(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      console.error("Get Current Question - Service error:", {
        session_id,
        error: result.error,
        statusCode,
      });
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get current question",
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("Get Current Question Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to submit an answer for the current question
 */
export const submitAnswerController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;
    const payload: SubmitAnswerRequest = {
      answer: req.body.answer,
      question_id: req.body.question_id,
    };

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id parameter is required",
      });
    }

    const result = await submitAnswer(session_id, payload);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to submit answer",
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("Submit Answer Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get comprehensive analysis after interview completion
 */
export const getAnalysisController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id parameter is required",
      });
    }

    const result = await getAnalysis(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get analysis",
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("Get Analysis Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Controller to get current status of an interview session
 */
export const getSessionStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id parameter is required",
      });
    }

    const result = await getSessionStatus(session_id);

    if (result.success && result.data) {
      return res.status(result.statusCode || 200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = result.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error || "Failed to get session status",
        data: result.data,
      });
    }
  } catch (err: any) {
    console.error("Get Session Status Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

