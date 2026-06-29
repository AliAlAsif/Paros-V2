import { Router, type IRouter } from "express";
import { desc, gte } from "drizzle-orm";
import { db, studySessionsTable, subjectsTable } from "@workspace/db";
import {
  GetStudyHoursAnalyticsQueryParams,
  GetActivityHeatmapQueryParams,
  GetComparisonQueryParams,
  GetStudyHoursAnalyticsResponse,
  GetSubjectDistributionResponse,
  GetActivityHeatmapResponse,
  GetStreaksResponse,
  GetComparisonResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/study-hours", async (req, res): Promise<void> => {
  const query = GetStudyHoursAnalyticsQueryParams.safeParse(req.query);
  const period = (query.success && query.data.period) ? query.data.period : "daily";

  const allSessions = await db.select().from(studySessionsTable)
    .where(undefined)
    .orderBy(desc(studySessionsTable.date));

  const validSessions = allSessions.filter(s => s.completionStatus !== "cancelled");

  // Group by date/week/month/year
  const groupMap = new Map<string, { studyMinutes: number; researchMinutes: number }>();

  for (const s of validSessions) {
    let key: string;
    const d = new Date(s.date);
    if (period === "daily") {
      key = s.date;
    } else if (period === "weekly") {
      // ISO week
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const weekNum = Math.ceil((((d.getTime() - jan4.getTime()) / 86400000) + jan4.getDay() + 1) / 7);
      key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    } else if (period === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = String(d.getFullYear());
    }

    const existing = groupMap.get(key) ?? { studyMinutes: 0, researchMinutes: 0 };
    if (s.sessionKind === "study") {
      existing.studyMinutes += s.durationMinutes;
    } else {
      existing.researchMinutes += s.durationMinutes;
    }
    groupMap.set(key, existing);
  }

  const data = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      label: key,
      date: key,
      studyMinutes: val.studyMinutes,
      researchMinutes: val.researchMinutes,
    }));

  const last7Days = data.slice(-7).map(d => d.studyMinutes);
  const last30Days = data.slice(-30).map(d => d.studyMinutes);
  const rolling7 = last7Days.length > 0 ? last7Days.reduce((a, b) => a + b, 0) / last7Days.length : 0;
  const rolling30 = last30Days.length > 0 ? last30Days.reduce((a, b) => a + b, 0) / last30Days.length : 0;
  const totalStudy = validSessions.filter(s => s.sessionKind === "study").reduce((a, s) => a + s.durationMinutes, 0);
  const totalResearch = validSessions.filter(s => s.sessionKind === "research").reduce((a, s) => a + s.durationMinutes, 0);

  res.json(GetStudyHoursAnalyticsResponse.parse({
    data,
    rolling7DayAvgMinutes: Math.round(rolling7 * 10) / 10,
    rolling30DayAvgMinutes: Math.round(rolling30 * 10) / 10,
    totalStudyMinutes: totalStudy,
    totalResearchMinutes: totalResearch,
  }));
});

router.get("/analytics/subject-distribution", async (_req, res): Promise<void> => {
  const [sessions, subjects] = await Promise.all([
    db.select().from(studySessionsTable),
    db.select().from(subjectsTable),
  ]);

  const validStudy = sessions.filter(s => s.sessionKind === "study" && s.completionStatus !== "cancelled" && s.subjectId);
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const minutesBySubject = new Map<number, number>();
  for (const s of validStudy) {
    if (s.subjectId) {
      minutesBySubject.set(s.subjectId, (minutesBySubject.get(s.subjectId) ?? 0) + s.durationMinutes);
    }
  }

  const total = Array.from(minutesBySubject.values()).reduce((a, b) => a + b, 0);

  const result = Array.from(minutesBySubject.entries())
    .map(([subjectId, totalMinutes]) => {
      const subject = subjectMap.get(subjectId);
      return {
        subjectId,
        subjectName: subject?.name ?? "Unknown",
        color: subject?.color ?? "#6366f1",
        totalMinutes,
        percentage: total > 0 ? Math.round((totalMinutes / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  res.json(GetSubjectDistributionResponse.parse(result));
});

router.get("/analytics/heatmap", async (req, res): Promise<void> => {
  const query = GetActivityHeatmapQueryParams.safeParse(req.query);
  const year = (query.success && query.data.year) ? query.data.year : new Date().getFullYear();
  const yearStr = String(year);

  const sessions = await db.select().from(studySessionsTable);
  const validSessions = sessions.filter(s => s.date.startsWith(yearStr) && s.completionStatus !== "cancelled");

  const dateMap = new Map<string, number>();
  for (const s of validSessions) {
    dateMap.set(s.date, (dateMap.get(s.date) ?? 0) + 1);
  }

  const result = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  res.json(GetActivityHeatmapResponse.parse(result));
});

router.get("/analytics/streaks", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(studySessionsTable);

  function calcStreaks(sessions: typeof studySessionsTable.$inferSelect[]) {
    const dates = [...new Set(sessions.filter(s => s.completionStatus !== "cancelled").map(s => s.date))].sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) return { current: 0, longest: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let longest = 0;
    let streak = 0;

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);

      if (d.getTime() === expected.getTime()) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        if (i === 0) current = 0;
        break;
      }
    }
    current = streak;

    // Longest streak pass
    streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      prev.setHours(0, 0, 0, 0);
      curr.setHours(0, 0, 0, 0);
      const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 1;
      }
    }

    return { current, longest };
  }

  const studySessions = sessions.filter(s => s.sessionKind === "study");
  const researchSessions = sessions.filter(s => s.sessionKind === "research");
  const studyStreaks = calcStreaks(studySessions);
  const researchStreaks = calcStreaks(researchSessions);

  res.json(GetStreaksResponse.parse({
    currentStudyStreak: studyStreaks.current,
    longestStudyStreak: studyStreaks.longest,
    currentResearchStreak: researchStreaks.current,
    longestResearchStreak: researchStreaks.longest,
  }));
});

router.get("/analytics/comparison", async (req, res): Promise<void> => {
  const query = GetComparisonQueryParams.safeParse(req.query);
  const period = (query.success && query.data.period) ? query.data.period : "week";

  const sessions = await db.select().from(studySessionsTable);
  const validSessions = sessions.filter(s => s.completionStatus !== "cancelled");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let currentStart: Date, previousStart: Date, previousEnd: Date;
  let currentLabel: string, previousLabel: string;

  if (period === "week") {
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    currentStart = monday;
    previousStart = new Date(monday);
    previousStart.setDate(monday.getDate() - 7);
    previousEnd = new Date(monday);
    previousEnd.setDate(monday.getDate() - 1);
    currentLabel = "This week";
    previousLabel = "Last week";
  } else if (period === "month") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    currentLabel = "This month";
    previousLabel = "Last month";
  } else {
    // semester (approx 4 months)
    currentStart = new Date(now);
    currentStart.setMonth(now.getMonth() - 4);
    previousStart = new Date(currentStart);
    previousStart.setMonth(currentStart.getMonth() - 4);
    previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);
    currentLabel = "Current semester";
    previousLabel = "Previous semester";
  }

  const toStr = (d: Date) => d.toISOString().split("T")[0];

  const currentMinutes = validSessions
    .filter(s => s.date >= toStr(currentStart) && s.date <= toStr(now))
    .reduce((a, s) => a + s.durationMinutes, 0);

  const previousMinutes = validSessions
    .filter(s => s.date >= toStr(previousStart) && s.date <= toStr(previousEnd))
    .reduce((a, s) => a + s.durationMinutes, 0);

  const pctChange = previousMinutes > 0
    ? Math.round(((currentMinutes - previousMinutes) / previousMinutes) * 1000) / 10
    : (currentMinutes > 0 ? 100 : 0);

  res.json(GetComparisonResponse.parse({
    currentPeriodMinutes: currentMinutes,
    previousPeriodMinutes: previousMinutes,
    percentageChange: pctChange,
    currentLabel,
    previousLabel,
  }));
});

export default router;
