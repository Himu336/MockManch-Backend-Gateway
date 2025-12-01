import { db } from "../db/client.js";
import { 
  interviewSessions, 
  userStatistics, 
  userGoals, 
  achievements, 
  skillAssessments,
  weeklyPractice 
} from "../db/schema/dashboard.js";
import { eq, desc, and, gte, sql, count, avg, sum } from "drizzle-orm";
import { getAnalysis } from "./interview-service.js";
import { getVoiceInterviewAnalysis } from "./voice-interview-service.js";

/**
 * Dashboard data interfaces
 */
export interface DashboardSummary {
  interviewsDone: number;
  avgScore: number;
  practiceHours: number;
  achievements: number;
}

export interface DashboardGoal {
  goalType: string;
  currentValue: number;
  targetValue: number;
  progress: number; // percentage
}

export interface RecentActivity {
  id: string;
  interviewType: string;
  jobRole: string;
  company?: string;
  score: number;
  completedAt: string;
  dateLabel: string; // "Today", "Yesterday", or date
}

export interface SkillArea {
  skillName: string;
  score: number;
  progressColor: string; // "green" | "red" | "yellow"
}

export interface DashboardData {
  summary: DashboardSummary;
  goals: DashboardGoal[];
  recentActivity: RecentActivity[];
  areasToImprove: SkillArea[];
}

/**
 * Get or create user statistics
 */
async function getUserStatistics(userId: string) {
  const stats = await db
    .select()
    .from(userStatistics)
    .where(eq(userStatistics.userId, userId))
    .limit(1);

  if (stats.length === 0) {
    // Create initial statistics
    const [newStats] = await db
      .insert(userStatistics)
      .values({
        userId: userId,
        interviewsDone: 0,
        avgScore: "0",
        practiceHours: "0",
        achievementsCount: 0,
      })
      .returning();
    if (!newStats) {
      throw new Error("Failed to create user statistics");
    }
    return newStats;
  }

  const result = stats[0];
  if (!result) {
    throw new Error("Failed to get user statistics");
  }
  return result;
}

/**
 * Update user statistics from interview sessions
 */
async function updateUserStatistics(userId: string) {
  // Calculate aggregated statistics
  const statsResult = await db
    .select({
      interviewsDone: count(),
      avgScore: avg(interviewSessions.overallScore),
      practiceHours: sum(interviewSessions.durationMinutes),
    })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId));

  const stats = statsResult[0];
  const interviewsDone = stats ? Number(stats.interviewsDone) || 0 : 0;
  const avgScore = stats?.avgScore ? Number(stats.avgScore) : 0;
  const practiceHours = stats?.practiceHours ? Number(stats.practiceHours) / 60 : 0; // Convert minutes to hours

  // Get achievements count
  const achievementsResult = await db
    .select({ count: count() })
    .from(achievements)
    .where(eq(achievements.userId, userId));

  const achievementsCount = Number(achievementsResult[0]?.count || 0);

  // Update or insert statistics
  await db
    .insert(userStatistics)
    .values({
      userId,
      interviewsDone,
      avgScore: avgScore.toString(),
      practiceHours: practiceHours.toString(),
      achievementsCount,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: userStatistics.userId,
      set: {
        interviewsDone,
        avgScore: avgScore.toString(),
        practiceHours: practiceHours.toString(),
        achievementsCount,
        lastUpdated: new Date(),
      },
    });

  return { interviewsDone, avgScore, practiceHours, achievementsCount };
}

/**
 * Get dashboard summary statistics
 */
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  // Update statistics first to ensure accuracy
  const stats = await updateUserStatistics(userId);
  
  return {
    interviewsDone: stats.interviewsDone,
    avgScore: Math.round(stats.avgScore * 100) / 100, // Round to 2 decimal places
    practiceHours: Math.round(stats.practiceHours * 10) / 10, // Round to 1 decimal place
    achievements: stats.achievementsCount,
  };
}

/**
 * Get user goals with progress
 */
export async function getDashboardGoals(userId: string): Promise<DashboardGoal[]> {
  // Get active goals
  const goals = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.userId, userId), eq(userGoals.isActive, true)))
    .orderBy(userGoals.createdAt);

  // Calculate progress for each goal
  const goalsWithProgress: DashboardGoal[] = goals.map((goal) => {
    const currentValue = goal.currentValue ?? 0;
    const progress = goal.targetValue > 0 
      ? Math.round((currentValue / goal.targetValue) * 100)
      : 0;

    return {
      goalType: goal.goalType,
      currentValue: currentValue,
      targetValue: goal.targetValue,
      progress: Math.min(progress, 100), // Cap at 100%
    };
  });

  // If no goals exist, create default goals
  if (goalsWithProgress.length === 0) {
    const defaultGoals = [
      {
        userId,
        goalType: "weekly_practice",
        targetValue: 7,
        currentValue: 0,
        isActive: true,
      },
      {
        userId,
        goalType: "interview_mastery",
        targetValue: 25,
        currentValue: 0,
        isActive: true,
      },
      {
        userId,
        goalType: "communication_skills",
        targetValue: 5,
        currentValue: 0,
        isActive: true,
      },
    ];

    await db.insert(userGoals).values(defaultGoals);
    
    return defaultGoals.map((goal) => ({
      goalType: goal.goalType,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      progress: 0,
    }));
  }

  return goalsWithProgress;
}

/**
 * Update goals based on user activity
 */
async function updateGoals(userId: string) {
  // Update weekly practice goal
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Get Monday of current week
  weekStart.setHours(0, 0, 0, 0);

  const weekPractice = await db
    .select()
    .from(weeklyPractice)
    .where(
      and(
        eq(weeklyPractice.userId, userId),
        gte(weeklyPractice.weekStartDate, weekStart)
      )
    )
    .limit(1);

  // Count unique practice days this week
  const practiceDaysResult = await db
    .select({
      practiceDays: sql<number>`COUNT(DISTINCT DATE(${interviewSessions.completedAt}))`,
    })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, weekStart),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );

  const practiceDays = Number(practiceDaysResult[0]?.practiceDays || 0);

  // Update or create weekly practice record
  if (weekPractice.length > 0 && weekPractice[0]) {
    await db
      .update(weeklyPractice)
      .set({
        practiceDays,
        updatedAt: new Date(),
      })
      .where(eq(weeklyPractice.id, weekPractice[0].id));
  } else {
    await db.insert(weeklyPractice).values({
      userId,
      weekStartDate: weekStart,
      practiceDays,
    });
  }

  // Update weekly practice goal
  await db
    .update(userGoals)
    .set({
      currentValue: practiceDays,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userGoals.userId, userId),
        eq(userGoals.goalType, "weekly_practice"),
        eq(userGoals.isActive, true)
      )
    );

  // Update interview mastery goal (total completed interviews)
  const totalInterviews = await db
    .select({ count: count() })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId));

  const interviewsCount = Number(totalInterviews[0]?.count || 0);

  await db
    .update(userGoals)
    .set({
      currentValue: interviewsCount,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userGoals.userId, userId),
        eq(userGoals.goalType, "interview_mastery"),
        eq(userGoals.isActive, true)
      )
    );

  // Update communication skills goal (based on avg communication score)
  const communicationScores = await db
    .select({ score: skillAssessments.score })
    .from(skillAssessments)
    .where(
      and(
        eq(skillAssessments.userId, userId),
        eq(skillAssessments.skillName, "Communication Clarity")
      )
    )
    .orderBy(desc(skillAssessments.updatedAt))
    .limit(1);

  if (communicationScores.length > 0 && communicationScores[0]) {
    const commScore = Number(communicationScores[0].score);
    // Map score (0-100) to level (1-5)
    const level = Math.min(5, Math.max(1, Math.ceil(commScore / 20)));

    await db
      .update(userGoals)
      .set({
        currentValue: level,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userGoals.userId, userId),
          eq(userGoals.goalType, "communication_skills"),
          eq(userGoals.isActive, true)
        )
      );
  }
}

/**
 * Get recent activity (last 10 completed interviews)
 */
export async function getRecentActivity(userId: string): Promise<RecentActivity[]> {
  const recentSessions = await db
    .select({
      id: interviewSessions.id,
      sessionId: interviewSessions.sessionId,
      interviewType: interviewSessions.interviewType,
      jobRole: interviewSessions.jobRole,
      company: interviewSessions.company,
      overallScore: interviewSessions.overallScore,
      completedAt: interviewSessions.completedAt,
    })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.completedAt))
    .limit(10);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return recentSessions.map((session) => {
    const completedAt = session.completedAt ? new Date(session.completedAt) : new Date();
    const completedDate = new Date(completedAt.getFullYear(), completedAt.getMonth(), completedAt.getDate());

    let dateLabel: string;
    if (completedDate.getTime() === today.getTime()) {
      dateLabel = "Today";
    } else if (completedDate.getTime() === yesterday.getTime()) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = completedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    const result: RecentActivity = {
      id: session.id,
      interviewType: session.interviewType === "voice" ? "Video Interview" : "Text Interview",
      jobRole: session.jobRole || "N/A",
      score: session.overallScore ? Math.round(Number(session.overallScore)) : 0,
      completedAt: completedAt.toISOString(),
      dateLabel,
    };
    
    if (session.company) {
      result.company = session.company;
    }
    
    return result;
  });
}

/**
 * Get areas to improve (skill assessments)
 */
export async function getAreasToImprove(userId: string): Promise<SkillArea[]> {
  const skills = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId))
    .orderBy(desc(skillAssessments.updatedAt));

  // If no skills exist, return default skills with 0 scores
  if (skills.length === 0) {
    return [
      { skillName: "Behavioral Questions", score: 0, progressColor: "red" },
      { skillName: "Technical Depth", score: 0, progressColor: "red" },
      { skillName: "Communication Clarity", score: 0, progressColor: "red" },
    ];
  }

  // Get the latest assessment for each skill
  const latestSkills = new Map<string, { score: number; updatedAt: Date }>();
  for (const skill of skills) {
    const existing = latestSkills.get(skill.skillName);
    if (!existing || (skill.updatedAt && new Date(skill.updatedAt) > existing.updatedAt)) {
      latestSkills.set(skill.skillName, {
        score: Number(skill.score),
        updatedAt: skill.updatedAt ? new Date(skill.updatedAt) : new Date(),
      });
    }
  }

  // Convert to array and determine color
  const skillAreas: SkillArea[] = Array.from(latestSkills.entries()).map(([skillName, data]) => {
    let progressColor: "green" | "red" | "yellow";
    if (data.score >= 70) {
      progressColor = "green";
    } else if (data.score >= 50) {
      progressColor = "yellow";
    } else {
      progressColor = "red";
    }

    return {
      skillName,
      score: Math.round(data.score),
      progressColor,
    };
  });

  // Sort by score (lowest first - areas to improve)
  return skillAreas.sort((a, b) => a.score - b.score).slice(0, 5);
}

/**
 * Update skill assessments from interview analysis
 */
async function updateSkillAssessments(userId: string, sessionId: string, interviewType: string) {
  try {
    // Get analysis from microservice
    let analysis: any;
    if (interviewType === "voice") {
      const result = await getVoiceInterviewAnalysis(sessionId);
      if (result.success && result.data) {
        analysis = result.data;
      }
    } else {
      const result = await getAnalysis(sessionId);
      if (result.success && result.data) {
        analysis = result.data;
      }
    }

    if (!analysis) return;

    // Extract skill scores from analysis
    const now = new Date();
    
    // Update Communication Clarity (from communication_score or overall feedback)
    if (analysis.communication_score !== undefined) {
      // Check if record exists
      const existing = await db
        .select()
        .from(skillAssessments)
        .where(
          and(
            eq(skillAssessments.userId, userId),
            eq(skillAssessments.skillName, "Communication Clarity")
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        await db
          .update(skillAssessments)
          .set({
            score: analysis.communication_score.toString(),
            lastAssessedAt: now,
            updatedAt: now,
          })
          .where(eq(skillAssessments.id, existing[0].id));
      } else {
        await db.insert(skillAssessments).values({
          userId,
          skillName: "Communication Clarity",
          score: analysis.communication_score.toString(),
          lastAssessedAt: now,
        });
      }
    }

    // Update Technical Depth (from content_score or technical evaluation)
    if (analysis.content_score !== undefined) {
      const existing = await db
        .select()
        .from(skillAssessments)
        .where(
          and(
            eq(skillAssessments.userId, userId),
            eq(skillAssessments.skillName, "Technical Depth")
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        await db
          .update(skillAssessments)
          .set({
            score: analysis.content_score.toString(),
            lastAssessedAt: now,
            updatedAt: now,
          })
          .where(eq(skillAssessments.id, existing[0].id));
      } else {
        await db.insert(skillAssessments).values({
          userId,
          skillName: "Technical Depth",
          score: analysis.content_score.toString(),
          lastAssessedAt: now,
        });
      }
    }

    // Update Behavioral Questions (from improvement_areas or evaluations)
    if (analysis.improvement_areas) {
      const hasBehavioral = analysis.improvement_areas.some((area: string) =>
        area.toLowerCase().includes("behavioral") || area.toLowerCase().includes("behavior")
      );
      
      // Calculate behavioral score based on whether it's in improvement areas
      const behavioralScore = hasBehavioral ? 50 : 75; // Simplified logic
      
      const existing = await db
        .select()
        .from(skillAssessments)
        .where(
          and(
            eq(skillAssessments.userId, userId),
            eq(skillAssessments.skillName, "Behavioral Questions")
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        await db
          .update(skillAssessments)
          .set({
            score: behavioralScore.toString(),
            lastAssessedAt: now,
            updatedAt: now,
          })
          .where(eq(skillAssessments.id, existing[0].id));
      } else {
        await db.insert(skillAssessments).values({
          userId,
          skillName: "Behavioral Questions",
          score: behavioralScore.toString(),
          lastAssessedAt: now,
        });
      }
    }
  } catch (error) {
    console.error("Error updating skill assessments:", error);
    // Don't throw - this is a background update
  }
}

/**
 * Record a completed interview session
 */
export async function recordInterviewSession(
  userId: string,
  sessionId: string,
  interviewType: "text" | "voice" | "video",
  jobRole?: string,
  company?: string,
  experienceLevel?: string,
  durationMinutes?: number
) {
  try {
    // Get analysis to extract score
    let overallScore: number | null = null;
    let analysisData: any = null;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    if (interviewType === "voice") {
      const result = await getVoiceInterviewAnalysis(sessionId);
      if (result.success && result.data) {
        analysisData = result.data;
        overallScore = result.data.overall_score;
        totalQuestions = result.data.total_questions || 0;
        answeredQuestions = result.data.answered_questions || 0;
      }
    } else {
      const result = await getAnalysis(sessionId);
      if (result.success && result.data) {
        analysisData = result.data;
        overallScore = result.data.overall_score;
        // Text interviews don't have total_questions in the same format
        totalQuestions = result.data.evaluations?.length || 0;
        answeredQuestions = totalQuestions;
      }
    }

    // Record the session
    await db.insert(interviewSessions).values({
      sessionId,
      userId,
      interviewType,
      jobRole,
      company,
      experienceLevel,
      overallScore: overallScore ? overallScore.toString() : null,
      totalQuestions,
      answeredQuestions,
      durationMinutes: durationMinutes ? durationMinutes.toString() : null,
      analysisData,
      completedAt: new Date(),
    });

    // Update statistics
    await updateUserStatistics(userId);

    // Update goals
    await updateGoals(userId);

    // Update skill assessments
    if (analysisData) {
      await updateSkillAssessments(userId, sessionId, interviewType);
    }

    // Check for achievements
    await checkAndAwardAchievements(userId);

    return { success: true };
  } catch (error: any) {
    console.error("Error recording interview session:", error);
    // Check if it's a duplicate session
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { success: true, message: "Session already recorded" };
    }
    throw error;
  }
}

/**
 * Check and award achievements
 */
async function checkAndAwardAchievements(userId: string) {
  const stats = await getUserStatistics(userId);

  // First interview achievement
  if (stats.interviewsDone === 1) {
    await awardAchievement(userId, "first_interview", "First Interview", "Completed your first interview!");
  }

  // Perfect score achievement
  if (Number(stats.avgScore) >= 100) {
    await awardAchievement(userId, "perfect_score", "Perfect Score", "Achieved a perfect score!");
  }

  // Milestone achievements
  const milestones = [5, 10, 25, 50, 100];
  for (const milestone of milestones) {
    if (stats.interviewsDone === milestone) {
      await awardAchievement(
        userId,
        `milestone_${milestone}`,
        `${milestone} Interviews`,
        `Completed ${milestone} interviews!`
      );
    }
  }

  // Practice hours achievements
  const hoursMilestones = [5, 10, 25, 50, 100];
  for (const hours of hoursMilestones) {
    if (Number(stats.practiceHours) >= hours) {
      await awardAchievement(
        userId,
        `hours_${hours}`,
        `${hours} Practice Hours`,
        `Logged ${hours} hours of practice!`
      );
    }
  }
}

/**
 * Award an achievement if not already awarded
 */
async function awardAchievement(
  userId: string,
  achievementType: string,
  achievementName: string,
  description: string
) {
  const existing = await db
    .select()
    .from(achievements)
    .where(
      and(
        eq(achievements.userId, userId),
        eq(achievements.achievementType, achievementType)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(achievements).values({
      userId,
      achievementType,
      achievementName,
      description,
    });
  }
}

/**
 * Get complete dashboard data
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Update goals first to ensure accuracy
  await updateGoals(userId);

  // Fetch all dashboard data in parallel for optimal performance
  const [summary, goals, recentActivity, areasToImprove] = await Promise.all([
    getDashboardSummary(userId),
    getDashboardGoals(userId),
    getRecentActivity(userId),
    getAreasToImprove(userId),
  ]);

  return {
    summary,
    goals,
    recentActivity,
    areasToImprove,
  };
}

