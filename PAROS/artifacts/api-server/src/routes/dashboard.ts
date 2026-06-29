import { Router, type IRouter } from "express";
import { desc, gte, eq, and } from "drizzle-orm";
import {
  db,
  studySessionsTable,
  subjectsTable,
  examsTable,
  projectsTable,
  prayerLogsTable,
  exerciseLogsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function daysUntilExam(examDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(examDate);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const weekStart = new Date(now);
  const day = now.getDay();
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [allSessions, allSubjects, allExams, pinnedProjects, prayerToday, exerciseToday] = await Promise.all([
    db.select().from(studySessionsTable).orderBy(desc(studySessionsTable.createdAt)),
    db.select().from(subjectsTable).where(eq(subjectsTable.isArchived, false)).orderBy(desc(subjectsTable.createdAt)),
    db.select().from(examsTable).where(gte(examsTable.examDate, todayStr)).orderBy(examsTable.examDate),
    db.select().from(projectsTable).where(eq(projectsTable.isPinned, true)).orderBy(desc(projectsTable.createdAt)),
    db.select().from(prayerLogsTable).where(eq(prayerLogsTable.date, todayStr)),
    db.select().from(exerciseLogsTable).where(eq(exerciseLogsTable.date, todayStr)),
  ]);

  const validStudy = allSessions.filter(s => s.sessionKind === "study" && s.completionStatus !== "cancelled");
  const validResearch = allSessions.filter(s => s.sessionKind === "research" && s.completionStatus !== "cancelled");
  const sumMin = (arr: typeof allSessions) => arr.reduce((a, s) => a + s.durationMinutes, 0);

  const todayStudyMinutes = sumMin(validStudy.filter(s => s.date === todayStr));
  const weekStudyMinutes = sumMin(validStudy.filter(s => s.date >= weekStartStr));
  const monthStudyMinutes = sumMin(validStudy.filter(s => s.date >= monthStartStr));
  const todayResearchMinutes = sumMin(validResearch.filter(s => s.date === todayStr));

  function calcCurrentStreak(sessions: typeof allSessions): number {
    const dates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (d.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const recentSessions = allSessions.slice(0, 5);
  const recentSubjects = allSubjects.slice(0, 6);
  const upcomingExams = allExams.slice(0, 5).map(e => ({ ...e, daysUntilExam: daysUntilExam(e.examDate) }));

  // Build nullable-safe default objects so the schema always validates
  const prayerTodayData = prayerToday[0] ?? null;
  const exerciseTodayData = exerciseToday[0] ?? null;

  res.json(GetDashboardSummaryResponse.parse({
    date: todayStr,
    todayStudyMinutes,
    weekStudyMinutes,
    monthStudyMinutes,
    todayResearchMinutes,
    currentStudyStreak: calcCurrentStreak(validStudy),
    currentResearchStreak: calcCurrentStreak(validResearch),
    upcomingExams,
    recentSessions,
    recentSubjects,
    pinnedProjects,
    prayerToday: prayerTodayData,
    exerciseToday: exerciseTodayData,
  }));
});

export default router;
