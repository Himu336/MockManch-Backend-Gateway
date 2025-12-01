import type { Request, Response } from "express";
import {
  getDashboardData,
  getDashboardSummary,
  getDashboardGoals,
  getRecentActivity,
  getAreasToImprove,
  recordInterviewSession,
} from "../services/dashboard-service.js";

/**
 * Get complete dashboard data
 * GET /api/v1/dashboard
 */
export const getDashboardController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const dashboardData = await getDashboardData(userId);

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (err: any) {
    console.error("Get Dashboard Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get dashboard summary statistics only
 * GET /api/v1/dashboard/summary
 */
export const getDashboardSummaryController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const summary = await getDashboardSummary(userId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error("Get Dashboard Summary Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get user goals
 * GET /api/v1/dashboard/goals
 */
export const getDashboardGoalsController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const goals = await getDashboardGoals(userId);

    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (err: any) {
    console.error("Get Dashboard Goals Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get recent activity
 * GET /api/v1/dashboard/recent-activity
 */
export const getRecentActivityController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const activity = await getRecentActivity(userId);

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (err: any) {
    console.error("Get Recent Activity Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get areas to improve
 * GET /api/v1/dashboard/areas-to-improve
 */
export const getAreasToImproveController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const areas = await getAreasToImprove(userId);

    return res.status(200).json({
      success: true,
      data: areas,
    });
  } catch (err: any) {
    console.error("Get Areas to Improve Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Record a completed interview session
 * POST /api/v1/dashboard/record-session
 */
export const recordSessionController = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      session_id,
      interview_type,
      job_role,
      company,
      experience_level,
      duration_minutes,
    } = req.body;

    if (!user_id || !session_id || !interview_type) {
      return res.status(400).json({
        success: false,
        error: "user_id, session_id, and interview_type are required",
      });
    }

    if (!["text", "voice", "video"].includes(interview_type)) {
      return res.status(400).json({
        success: false,
        error: "interview_type must be 'text', 'voice', or 'video'",
      });
    }

    const result = await recordInterviewSession(
      user_id,
      session_id,
      interview_type,
      job_role,
      company,
      experience_level,
      duration_minutes
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Record Session Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

