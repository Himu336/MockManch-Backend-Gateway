import { db } from "../db/client.js";
import { 
  interviewSessions, 
  userStatistics, 
  achievements, 
  skillAssessments
} from "../db/schema/dashboard.js";
import { eq, desc, and, gte, sql, count, avg, sum, lte } from "drizzle-orm";

/**
 * Analytics data interfaces
 */
export interface AnalyticsOverview {
  overallScore: {
    value: number;
    change: number; // Change from last week
    changeType: "increase" | "decrease" | "neutral";
  };
  interviews: {
    count: number;
    period: "This month" | "This week" | "All time";
  };
  studyTime: {
    hours: number;
    period: "This week" | "This month" | "All time";
  };
  achievements: {
    unlocked: number;
    total: number;
  };
  scoreProgression: {
    week: string;
    score: number;
  }[];
  performanceByCategory: {
    category: string;
    currentScore: number;
    targetScore: number;
  }[];
}

export interface SkillRadarData {
  skill: string;
  score: number;
}

export interface SkillDetails {
  skillName: string;
  score: number;
  maxScore: number;
}

export interface WeakArea {
  topic: string;
  practiceSessions: number;
  recommendedSessions: number;
  progressPercentage: number;
  score: number;
  improvementPercentage: number;
}

export interface Achievement {
  id: string;
  achievementType: string;
  achievementName: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Get analytics overview data
 */
export async function getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  const now = new Date();
  
  // Calculate week boundaries
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay()); // Monday
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const lastWeekEnd = new Date(currentWeekStart);
  
  // Calculate month boundaries
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  // Get overall score (average of all completed interviews)
  const overallScoreResult = await db
    .select({ avgScore: avg(interviewSessions.overallScore) })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const currentAvgScore = overallScoreResult[0]?.avgScore 
    ? Number(overallScoreResult[0].avgScore) 
    : 0;
  
  // Get last week's average score
  const lastWeekScoreResult = await db
    .select({ avgScore: avg(interviewSessions.overallScore) })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, lastWeekStart),
        lte(interviewSessions.completedAt, lastWeekEnd),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const lastWeekAvgScore = lastWeekScoreResult[0]?.avgScore 
    ? Number(lastWeekScoreResult[0].avgScore) 
    : currentAvgScore;
  
  const scoreChange = Math.round((currentAvgScore - lastWeekAvgScore) * 100) / 100;
  
  // Get interviews this month
  const interviewsThisMonth = await db
    .select({ count: count() })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, currentMonthStart),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const interviewsCount = Number(interviewsThisMonth[0]?.count || 0);
  
  // Get study time this week (in hours)
  const studyTimeResult = await db
    .select({ totalMinutes: sum(interviewSessions.durationMinutes) })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, currentWeekStart),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const studyTimeHours = studyTimeResult[0]?.totalMinutes 
    ? Number(studyTimeResult[0].totalMinutes) / 60 
    : 0;
  
  // Get achievements
  const achievementsResult = await db
    .select({ count: count() })
    .from(achievements)
    .where(eq(achievements.userId, userId));
  
  const unlockedAchievements = Number(achievementsResult[0]?.count || 0);
  const totalAchievements = 12; // Total predefined achievements
  
  // Get score progression (last 6 weeks)
  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
  sixWeeksAgo.setHours(0, 0, 0, 0);
  
  // Get all sessions in the last 6 weeks
  const recentSessions = await db
    .select({
      overallScore: interviewSessions.overallScore,
      completedAt: interviewSessions.completedAt,
    })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, sixWeeksAgo),
        sql`${interviewSessions.completedAt} IS NOT NULL`,
        sql`${interviewSessions.overallScore} IS NOT NULL`
      )
    )
    .orderBy(interviewSessions.completedAt);
  
  // Group by week and calculate average
  const weeklyData = new Map<string, number[]>();
  
  for (const session of recentSessions) {
    if (!session.completedAt || !session.overallScore) continue;
    
    const sessionDate = new Date(session.completedAt);
    const weekStart = new Date(sessionDate);
    weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weekKey) continue;
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, []);
    }
    
    const weekScores = weeklyData.get(weekKey);
    if (weekScores) {
      weekScores.push(Number(session.overallScore));
    }
  }
  
  // Calculate averages and create progression array
  const scoreProgression: { week: string; score: number }[] = [];
  const weekKeys = Array.from(weeklyData.keys()).sort();
  
  for (let i = 0; i < 6; i++) {
    const weekIndex = weekKeys.length - 6 + i;
    if (weekIndex >= 0 && weekIndex < weekKeys.length) {
      const weekKey = weekKeys[weekIndex];
      if (weekKey) {
        const scores = weeklyData.get(weekKey);
        if (scores && scores.length > 0) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          scoreProgression.push({
            week: `Week ${i + 1}`,
            score: Math.round(avgScore),
          });
        } else {
          const prevScore = scoreProgression.length > 0 
            ? scoreProgression[scoreProgression.length - 1]?.score || Math.round(currentAvgScore)
            : Math.round(currentAvgScore);
          scoreProgression.push({
            week: `Week ${i + 1}`,
            score: prevScore > 0 ? prevScore : 0,
          });
        }
      }
    } else {
      // If no data for this week, use previous week's score or 0
      const prevScore = scoreProgression.length > 0 
        ? (scoreProgression[scoreProgression.length - 1]?.score || Math.round(currentAvgScore))
        : Math.round(currentAvgScore);
      scoreProgression.push({
        week: `Week ${i + 1}`,
        score: prevScore > 0 ? prevScore : 0,
      });
    }
  }
  
  // If we have fewer than 6 weeks, pad from the beginning
  while (scoreProgression.length < 6) {
    scoreProgression.unshift({
      week: `Week ${scoreProgression.length + 1}`,
      score: 0,
    });
  }
  
  // Get performance by category
  const categoryScores = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId))
    .orderBy(desc(skillAssessments.updatedAt));
  
  // Map skills to categories
  const categoryMap: Record<string, string> = {
    "Technical Depth": "Technical",
    "Technical": "Technical",
    "Behavioral Questions": "Behavioral",
    "Behavioral": "Behavioral",
    "Problem Solving": "Problem Solving",
    "Communication Clarity": "Communication",
    "Communication": "Communication",
  };
  
  const categoryData = new Map<string, { current: number; count: number }>();
  
  for (const skill of categoryScores) {
    const category = categoryMap[skill.skillName] || "Other";
    const score = Number(skill.score);
    
    if (!categoryData.has(category)) {
      categoryData.set(category, { current: 0, count: 0 });
    }
    
    const existing = categoryData.get(category)!;
    existing.current += score;
    existing.count += 1;
  }
  
  const performanceByCategory = Array.from(categoryData.entries())
    .map(([category, data]) => ({
      category,
      currentScore: Math.round(data.current / data.count),
      targetScore: 95, // Default target
    }))
    .filter((item) => ["Technical", "Behavioral", "Problem Solving"].includes(item.category));
  
  // Ensure we have the three main categories
  const requiredCategories = ["Technical", "Behavioral", "Problem Solving"];
  for (const category of requiredCategories) {
    if (!performanceByCategory.find((c) => c.category === category)) {
      performanceByCategory.push({
        category,
        currentScore: 0,
        targetScore: 95,
      });
    }
  }
  
  return {
    overallScore: {
      value: Math.round(currentAvgScore),
      change: scoreChange,
      changeType: scoreChange > 0 ? "increase" : scoreChange < 0 ? "decrease" : "neutral",
    },
    interviews: {
      count: interviewsCount,
      period: "This month",
    },
    studyTime: {
      hours: Math.round(studyTimeHours * 10) / 10,
      period: "This week",
    },
    achievements: {
      unlocked: unlockedAchievements,
      total: totalAchievements,
    },
    scoreProgression,
    performanceByCategory,
  };
}

/**
 * Get skills breakdown (radar chart and details)
 */
export async function getSkillsBreakdown(userId: string): Promise<{
  radarData: SkillRadarData[];
  skillDetails: SkillDetails[];
}> {
  const skills = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId))
    .orderBy(desc(skillAssessments.updatedAt));
  
  // Get latest score for each skill
  const skillMap = new Map<string, number>();
  
  for (const skill of skills) {
    if (!skillMap.has(skill.skillName)) {
      skillMap.set(skill.skillName, Number(skill.score));
    }
  }
  
  // Define all skills we want to track
  const allSkills = [
    "Technical",
    "Behavioral",
    "Communication",
    "Leadership",
    "Problem Solving",
    "System Design",
  ];
  
  // Map existing skills to our standard names
  const skillMapping: Record<string, string> = {
    "Technical Depth": "Technical",
    "Behavioral Questions": "Behavioral",
    "Communication Clarity": "Communication",
    "Problem Solving": "Problem Solving",
    "System Design": "System Design",
    "Leadership": "Leadership",
  };
  
  const radarData: SkillRadarData[] = [];
  const skillDetails: SkillDetails[] = [];
  
  for (const skillName of allSkills) {
    // Find matching score
    let score = 0;
    for (const [dbSkill, mappedSkill] of Object.entries(skillMapping)) {
      if (mappedSkill === skillName && skillMap.has(dbSkill)) {
        score = skillMap.get(dbSkill)!;
        break;
      }
    }
    
    // If not found, try direct match
    if (score === 0 && skillMap.has(skillName)) {
      score = skillMap.get(skillName)!;
    }
    
    radarData.push({
      skill: skillName,
      score: Math.round(score),
    });
    
    skillDetails.push({
      skillName,
      score: Math.round(score),
      maxScore: 100,
    });
  }
  
  return {
    radarData,
    skillDetails,
  };
}

/**
 * Get weak areas that need attention
 */
export async function getWeakAreas(userId: string): Promise<WeakArea[]> {
  // Get all skills with their latest scores
  const skills = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId))
    .orderBy(desc(skillAssessments.updatedAt));
  
  // Get latest score for each skill
  const skillMap = new Map<string, { score: number; updatedAt: Date }>();
  
  for (const skill of skills) {
    const existing = skillMap.get(skill.skillName);
    if (!existing || (skill.updatedAt && new Date(skill.updatedAt) > existing.updatedAt)) {
      skillMap.set(skill.skillName, {
        score: Number(skill.score),
        updatedAt: skill.updatedAt ? new Date(skill.updatedAt) : new Date(),
      });
    }
  }
  
  // Count practice sessions per topic (from interview sessions)
  // We'll count sessions that relate to specific topics
  const allSessions = await db
    .select({
      id: interviewSessions.id,
      completedAt: interviewSessions.completedAt,
    })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  // Map skills to topics (for weak areas display)
  const topicMapping: Record<string, string> = {
    "Behavioral Questions": "Handling Conflict",
    "System Design": "System Design Scale",
    "Communication Clarity": "Salary Negotiation",
  };
  
  // Count sessions per topic (simplified: count all sessions for now)
  // In a real implementation, you'd analyze the interview content to categorize
  const totalSessions = allSessions.length;
  
  // Build weak areas list from skills that need improvement
  const weakAreas: WeakArea[] = [];
  
  // Get skills sorted by score (lowest first)
  const sortedSkills = Array.from(skillMap.entries())
    .map(([skillName, data]) => ({ skillName, ...data }))
    .sort((a, b) => a.score - b.score);
  
  // Map top 3 lowest scoring skills to topics
  for (const skillData of sortedSkills.slice(0, 3)) {
    const topic = topicMapping[skillData.skillName];
    
    if (topic) {
      // Distribute sessions across topics (simplified logic)
      // In production, you'd track which sessions covered which topics
      const sessionsForTopic = Math.floor(totalSessions / 3) + (weakAreas.length === 0 ? totalSessions % 3 : 0);
      
      // Calculate improvement percentage (mock data for now)
      // In production, compare current score to previous period
      const improvementPercentage = Math.max(5, Math.min(15, Math.floor(Math.random() * 10) + 5));
      
      // Recommended sessions (5 more if score < 70)
      const recommendedSessions = skillData.score < 70 ? 5 : 0;
      
      weakAreas.push({
        topic,
        practiceSessions: sessionsForTopic,
        recommendedSessions,
        progressPercentage: Math.round(skillData.score),
        score: Math.round(skillData.score),
        improvementPercentage,
      });
    }
  }
  
  // If we don't have enough weak areas, add default ones
  const defaultTopics = [
    { skill: "Behavioral Questions", topic: "Handling Conflict", defaultScore: 58 },
    { skill: "System Design", topic: "System Design Scale", defaultScore: 62 },
    { skill: "Communication Clarity", topic: "Salary Negotiation", defaultScore: 55 },
  ];
  
  for (const defaultTopic of defaultTopics) {
    if (!weakAreas.find((wa) => wa.topic === defaultTopic.topic)) {
      const skillData = skillMap.get(defaultTopic.skill);
      const score = skillData ? skillData.score : defaultTopic.defaultScore;
      
      weakAreas.push({
        topic: defaultTopic.topic,
        practiceSessions: Math.floor(totalSessions / 3),
        recommendedSessions: score < 70 ? 5 : 0,
        progressPercentage: Math.round(score),
        score: Math.round(score),
        improvementPercentage: Math.max(5, Math.min(15, Math.floor(Math.random() * 10) + 5)),
      });
    }
  }
  
  // Sort by score (lowest first) and limit to top 3
  return weakAreas
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}

/**
 * Get all achievements (unlocked and locked)
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
  // Get user's unlocked achievements
  const unlockedAchievements = await db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, userId));
  
  const unlockedMap = new Map<string, Achievement>();
  
  for (const achievement of unlockedAchievements) {
    const unlockedAchievement: Achievement = {
      id: achievement.id,
      achievementType: achievement.achievementType,
      achievementName: achievement.achievementName,
      description: achievement.description || "",
      unlocked: true,
    };
    
    if (achievement.unlockedAt) {
      unlockedAchievement.unlockedAt = achievement.unlockedAt.toISOString();
    }
    
    unlockedMap.set(achievement.achievementType, unlockedAchievement);
  }
  
  // Define all possible achievements
  const allAchievements: Omit<Achievement, "id" | "unlocked" | "unlockedAt">[] = [
    {
      achievementType: "7_day_streak",
      achievementName: "7-Day Streak",
      description: "Practiced 7 days in a row.",
    },
    {
      achievementType: "interview_master",
      achievementName: "Interview Master",
      description: "Completed 25 mock interviews.",
    },
    {
      achievementType: "quick_learner",
      achievementName: "Quick Learner",
      description: "Improved score by 20 points.",
    },
    {
      achievementType: "team_player",
      achievementName: "Team Player",
      description: "Joined 5 group sessions.",
    },
    {
      achievementType: "perfect_score",
      achievementName: "Perfect Score",
      description: "Scored 95+ on an interview.",
    },
    {
      achievementType: "consistency_king",
      achievementName: "Consistency King",
      description: "30-day practice streak.",
    },
  ];
  
  // Build complete achievements list
  const achievementsList: Achievement[] = allAchievements.map((achievement) => {
    const unlocked = unlockedMap.get(achievement.achievementType);
    
    if (unlocked) {
      return unlocked;
    }
    
    return {
      id: "",
      ...achievement,
      unlocked: false,
    };
  });
  
  return achievementsList;
}

/**
 * Check and update achievements based on user activity
 */
export async function checkAndUpdateAchievements(userId: string): Promise<void> {
  // Get user statistics
  const stats = await db
    .select()
    .from(userStatistics)
    .where(eq(userStatistics.userId, userId))
    .limit(1);
  
  if (stats.length === 0) return;
  
  const userStats = stats[0];
  if (!userStats) return;
  
  // Check for 7-day streak
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSessions = await db
    .select({
      date: sql<string>`DATE(${interviewSessions.completedAt})`,
    })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, sevenDaysAgo),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const uniqueDays = new Set(recentSessions.map((s) => s.date));
  if (uniqueDays.size >= 7) {
    await awardAchievementIfNotExists(
      userId,
      "7_day_streak",
      "7-Day Streak",
      "Practiced 7 days in a row."
    );
  }
  
  // Check for Interview Master (25 interviews)
  if (userStats.interviewsDone && userStats.interviewsDone >= 25) {
    await awardAchievementIfNotExists(
      userId,
      "interview_master",
      "Interview Master",
      "Completed 25 mock interviews."
    );
  }
  
  // Check for Quick Learner (score improvement)
  const recentScores = await db
    .select({ score: interviewSessions.overallScore })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    )
    .orderBy(desc(interviewSessions.completedAt))
    .limit(10);
  
  if (recentScores.length >= 2) {
    const latestScore = Number(recentScores[0]?.score || 0);
    const previousScore = Number(recentScores[recentScores.length - 1]?.score || 0);
    
    if (latestScore - previousScore >= 20) {
      await awardAchievementIfNotExists(
        userId,
        "quick_learner",
        "Quick Learner",
        "Improved score by 20 points."
      );
    }
  }
  
  // Check for Perfect Score (95+)
  const perfectScores = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        sql`${interviewSessions.overallScore} >= 95`,
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    )
    .limit(1);
  
  if (perfectScores.length > 0) {
    await awardAchievementIfNotExists(
      userId,
      "perfect_score",
      "Perfect Score",
      "Scored 95+ on an interview."
    );
  }
  
  // Check for Consistency King (30-day streak)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const monthSessions = await db
    .select({
      date: sql<string>`DATE(${interviewSessions.completedAt})`,
    })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.completedAt, thirtyDaysAgo),
        sql`${interviewSessions.completedAt} IS NOT NULL`
      )
    );
  
  const monthUniqueDays = new Set(monthSessions.map((s) => s.date));
  if (monthUniqueDays.size >= 30) {
    await awardAchievementIfNotExists(
      userId,
      "consistency_king",
      "Consistency King",
      "30-day practice streak."
    );
  }
}

/**
 * Award achievement if it doesn't already exist
 */
async function awardAchievementIfNotExists(
  userId: string,
  achievementType: string,
  achievementName: string,
  description: string
): Promise<void> {
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

