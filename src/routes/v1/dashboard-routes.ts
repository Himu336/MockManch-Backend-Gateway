import express from "express";
import {
  getDashboardController,
  getDashboardSummaryController,
  getDashboardGoalsController,
  getRecentActivityController,
  getAreasToImproveController,
  recordSessionController,
} from "../../controller/dashboard-controller.js";

const dashboardRouter = express.Router();

// GET /api/v1/dashboard - Get complete dashboard data
dashboardRouter.get("/", getDashboardController);

// GET /api/v1/dashboard/summary - Get summary statistics only
dashboardRouter.get("/summary", getDashboardSummaryController);

// GET /api/v1/dashboard/goals - Get user goals
dashboardRouter.get("/goals", getDashboardGoalsController);

// GET /api/v1/dashboard/recent-activity - Get recent activity
dashboardRouter.get("/recent-activity", getRecentActivityController);

// GET /api/v1/dashboard/areas-to-improve - Get areas to improve
dashboardRouter.get("/areas-to-improve", getAreasToImproveController);

// POST /api/v1/dashboard/record-session - Record a completed interview session
dashboardRouter.post("/record-session", recordSessionController);

export default dashboardRouter;

