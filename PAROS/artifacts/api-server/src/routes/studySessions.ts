import { Router, type IRouter } from "express";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { db, studySessionsTable } from "@workspace/db";
import {
  ListStudySessionsQueryParams,
  CreateStudySessionBody,
  GetStudySessionParams,
  UpdateStudySessionParams,
  UpdateStudySessionBody,
  DeleteStudySessionParams,
  ListStudySessionsResponse,
  CreateStudySessionResponse,
  GetStudySessionResponse,
  UpdateStudySessionResponse,
  GetStudyStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/study-sessions", async (req, res): Promise<void> => {
  const query = ListStudySessionsQueryParams.safeParse(req.query);
  const conditions: ReturnType<typeof eq>[] = [];

  if (query.success) {
    const q = query.data;
    if (q.subjectId) conditions.push(eq(studySessionsTable.subjectId, q.subjectId));
    if (q.sessionKind) conditions.push(eq(studySessionsTable.sessionKind, q.sessionKind));
    if (q.dateFrom) conditions.push(gte(studySessionsTable.date, String(q.dateFrom)));
    if (q.dateTo) conditions.push(lte(studySessionsTable.date, String(q.dateTo)));
  }

  let dbQuery = db.select().from(studySessionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(studySessionsTable.date));

  const sessions = await (query.success && query.data.limit
    ? dbQuery.limit(query.data.limit)
    : dbQuery);

  res.json(ListStudySessionsResponse.parse(sessions));
});

router.post("/study-sessions", async (req, res): Promise<void> => {
  const parsed = CreateStudySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(studySessionsTable).values({ ...parsed.data, date: String(parsed.data.date) }).returning();
  res.status(201).json(CreateStudySessionResponse.parse(session));
});

router.get("/study-sessions/stats/summary", async (_req, res): Promise<void> => {
  const allSessions = await db.select().from(studySessionsTable).orderBy(desc(studySessionsTable.date));

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Week bounds (Mon-Sun)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Month bounds
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const studySessions = allSessions.filter(s => s.sessionKind === "study" && s.completionStatus !== "cancelled");
  const researchSessions = allSessions.filter(s => s.sessionKind === "research" && s.completionStatus !== "cancelled");

  const todayStudy = studySessions.filter(s => s.date === todayStr);
  const todayResearch = researchSessions.filter(s => s.date === todayStr);
  const weekStudy = studySessions.filter(s => s.date >= weekStartStr);
  const monthStudy = studySessions.filter(s => s.date >= monthStartStr);

  const sum = (arr: typeof studySessions) => arr.reduce((a, s) => a + s.durationMinutes, 0);

  // Streak calculation helper
  function calcStreak(sessions: typeof studySessions): { current: number; longest: number } {
    const dates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
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
        if (i === 0 || i < streak) current = streak;
        longest = Math.max(longest, streak);
      } else {
        if (i === 0) current = 0;
        break;
      }
    }
    return { current, longest };
  }

  const studyStreaks = calcStreak(studySessions);
  const researchStreaks = calcStreak(researchSessions);
  const totalSessions = allSessions.length;
  const avgSessionMinutes = totalSessions > 0 ? sum(allSessions) / totalSessions : 0;
  const totalFocusRatingSum = allSessions.reduce((a, s) => a + s.focusRating, 0);
  const avgFocusRating = totalSessions > 0 ? totalFocusRatingSum / totalSessions : 0;

  res.json(GetStudyStatsResponse.parse({
    todayMinutes: sum(todayStudy),
    weekMinutes: sum(weekStudy),
    monthMinutes: sum(monthStudy),
    totalMinutes: sum(studySessions),
    currentStudyStreak: studyStreaks.current,
    longestStudyStreak: studyStreaks.longest,
    currentResearchStreak: researchStreaks.current,
    longestResearchStreak: researchStreaks.longest,
    totalSessions,
    averageSessionMinutes: Math.round(avgSessionMinutes * 10) / 10,
    averageFocusRating: Math.round(avgFocusRating * 10) / 10,
  }));
});

router.get("/study-sessions/:id", async (req, res): Promise<void> => {
  const params = GetStudySessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [session] = await db.select().from(studySessionsTable).where(eq(studySessionsTable.id, params.data.id));
  if (!session) {
    res.status(404).json({ error: "Study session not found" });
    return;
  }
  res.json(GetStudySessionResponse.parse(session));
});

router.patch("/study-sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateStudySessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .update(studySessionsTable)
    .set(parsed.data)
    .where(eq(studySessionsTable.id, params.data.id))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(UpdateStudySessionResponse.parse(session));
});

router.delete("/study-sessions/:id", async (req, res): Promise<void> => {
  const params = DeleteStudySessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(studySessionsTable).where(eq(studySessionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
