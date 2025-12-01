import type { Request, Response } from "express";
import {
  getAnalyticsOverview,
  getSkillsBreakdown,
  getWeakAreas,
  getAchievements,
  checkAndUpdateAchievements,
} from "../services/analytics-service.js";

/**
 * Get analytics overview
 * GET /api/v1/analytics/overview
 */
export const getAnalyticsOverviewController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const overview = await getAnalyticsOverview(userId);

    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (err: any) {
    console.error("Get Analytics Overview Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get skills breakdown
 * GET /api/v1/analytics/skills-breakdown
 */
export const getSkillsBreakdownController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const breakdown = await getSkillsBreakdown(userId);

    return res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (err: any) {
    console.error("Get Skills Breakdown Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get weak areas
 * GET /api/v1/analytics/weak-areas
 */
export const getWeakAreasController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    const weakAreas = await getWeakAreas(userId);

    return res.status(200).json({
      success: true,
      data: weakAreas,
    });
  } catch (err: any) {
    console.error("Get Weak Areas Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Get achievements
 * GET /api/v1/analytics/achievements
 */
export const getAchievementsController = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id query parameter is required",
      });
    }

    // Check and update achievements before returning
    await checkAndUpdateAchievements(userId);

    const achievements = await getAchievements(userId);

    return res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (err: any) {
    console.error("Get Achievements Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

/**
 * Check and update achievements
 * POST /api/v1/analytics/check-achievements
 */
export const checkAchievementsController = async (req: Request, res: Response) => {
  try {
    const userId = req.body.user_id || req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id is required",
      });
    }

    await checkAndUpdateAchievements(userId);

    return res.status(200).json({
      success: true,
      message: "Achievements checked and updated",
    });
  } catch (err: any) {
    console.error("Check Achievements Controller Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

