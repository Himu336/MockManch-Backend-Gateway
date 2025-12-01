import { pgSchema, uuid, varchar, timestamp, integer, numeric, boolean, jsonb, text } from "drizzle-orm/pg-core";

export const dashboardSchema = pgSchema("dashboard");

/**
 * Stores completed interview sessions for tracking and analytics
 */
export const interviewSessions = dashboardSchema.table("interview_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: varchar("session_id").notNull().unique(), // Session ID from Python microservice
  userId: varchar("user_id").notNull(),
  interviewType: varchar("interview_type").notNull(), // "text" | "voice" | "video"
  jobRole: varchar("job_role"),
  company: varchar("company"),
  experienceLevel: varchar("experience_level"),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }), // 0-100
  totalQuestions: integer("total_questions").default(0),
  answeredQuestions: integer("answered_questions").default(0),
  durationMinutes: numeric("duration_minutes", { precision: 10, scale: 2 }), // Practice hours tracking
  analysisData: jsonb("analysis_data"), // Full analysis response from microservice
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * User statistics - cached aggregated data for fast dashboard loading
 */
export const userStatistics = dashboardSchema.table("user_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  interviewsDone: integer("interviews_done").default(0),
  avgScore: numeric("avg_score", { precision: 5, scale: 2 }).default("0"), // 0-100
  practiceHours: numeric("practice_hours", { precision: 10, scale: 2 }).default("0"),
  achievementsCount: integer("achievements_count").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * User goals tracking
 */
export const userGoals = dashboardSchema.table("user_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  goalType: varchar("goal_type").notNull(), // "weekly_practice" | "interview_mastery" | "communication_skills"
  targetValue: integer("target_value").notNull(), // e.g., 7 days, 25 interviews, 5 levels
  currentValue: integer("current_value").default(0),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * User achievements
 */
export const achievements = dashboardSchema.table("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementType: varchar("achievement_type").notNull(), // e.g., "first_interview", "perfect_score", "weekly_streak"
  achievementName: varchar("achievement_name").notNull(),
  description: text("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Skill assessments - areas to improve
 */
export const skillAssessments = dashboardSchema.table("skill_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  skillName: varchar("skill_name").notNull(), // e.g., "Behavioral Questions", "Technical Depth", "Communication Clarity"
  score: numeric("score", { precision: 5, scale: 2 }).notNull(), // 0-100
  lastAssessedAt: timestamp("last_assessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Unique constraint on userId + skillName will be added via migration
});

/**
 * Weekly practice tracking for goals
 */
export const weeklyPractice = dashboardSchema.table("weekly_practice", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  weekStartDate: timestamp("week_start_date").notNull(), // Monday of the week
  practiceDays: integer("practice_days").default(0), // Count of days practiced this week
  totalSessions: integer("total_sessions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

