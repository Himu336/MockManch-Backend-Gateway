import express from "express";
import {
  getAnalyticsOverviewController,
  getSkillsBreakdownController,
  getWeakAreasController,
  getAchievementsController,
  checkAchievementsController,
} from "../../controller/analytics-controller.js";

const analyticsRouter = express.Router();

// GET /api/v1/analytics/overview - Get analytics overview
analyticsRouter.get("/overview", getAnalyticsOverviewController);

// GET /api/v1/analytics/skills-breakdown - Get skills breakdown
analyticsRouter.get("/skills-breakdown", getSkillsBreakdownController);

// GET /api/v1/analytics/weak-areas - Get weak areas
analyticsRouter.get("/weak-areas", getWeakAreasController);

// GET /api/v1/analytics/achievements - Get achievements
analyticsRouter.get("/achievements", getAchievementsController);

// POST /api/v1/analytics/check-achievements - Check and update achievements
analyticsRouter.post("/check-achievements", checkAchievementsController);

export default analyticsRouter;

