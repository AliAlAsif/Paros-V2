import { Router, type IRouter } from "express";
import { eq, gte, lte, and } from "drizzle-orm";
import { db, prayerLogsTable, exerciseLogsTable } from "@workspace/db";
import {
  ListPrayerLogsQueryParams,
  UpsertPrayerLogBody,
  ListExerciseLogsQueryParams,
  UpsertExerciseLogBody,
  ListPrayerLogsResponse,
  UpsertPrayerLogResponse,
  ListExerciseLogsResponse,
  UpsertExerciseLogResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Prayer Logs ────────────────────────────────────────────────────────────
router.get("/prayer-logs", async (req, res): Promise<void> => {
  const query = ListPrayerLogsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success) {
    if (query.data.dateFrom) conditions.push(gte(prayerLogsTable.date, String(query.data.dateFrom)));
    if (query.data.dateTo) conditions.push(lte(prayerLogsTable.date, String(query.data.dateTo)));
  }
  const logs = await db.select().from(prayerLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(prayerLogsTable.date);
  res.json(ListPrayerLogsResponse.parse(logs));
});

router.post("/prayer-logs", async (req, res): Promise<void> => {
  const parsed = UpsertPrayerLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { date, ...rest } = parsed.data;
  const dateStr = String(date);
  const [existing] = await db.select().from(prayerLogsTable).where(eq(prayerLogsTable.date, dateStr));
  if (existing) {
    const [updated] = await db
      .update(prayerLogsTable)
      .set({ ...rest })
      .where(eq(prayerLogsTable.date, dateStr))
      .returning();
    res.json(UpsertPrayerLogResponse.parse(updated));
    return;
  }
  const [created] = await db.insert(prayerLogsTable).values({ ...rest, date: dateStr }).returning();
  res.json(UpsertPrayerLogResponse.parse(created));
});

// ── Exercise Logs ──────────────────────────────────────────────────────────
router.get("/exercise-logs", async (req, res): Promise<void> => {
  const query = ListExerciseLogsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success) {
    if (query.data.dateFrom) conditions.push(gte(exerciseLogsTable.date, String(query.data.dateFrom)));
    if (query.data.dateTo) conditions.push(lte(exerciseLogsTable.date, String(query.data.dateTo)));
  }
  const logs = await db.select().from(exerciseLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(exerciseLogsTable.date);
  res.json(ListExerciseLogsResponse.parse(logs));
});

router.post("/exercise-logs", async (req, res): Promise<void> => {
  const parsed = UpsertExerciseLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { date, ...rest } = parsed.data;
  const dateStr = String(date);
  const [existing] = await db.select().from(exerciseLogsTable).where(eq(exerciseLogsTable.date, dateStr));
  if (existing) {
    const [updated] = await db
      .update(exerciseLogsTable)
      .set({ ...rest })
      .where(eq(exerciseLogsTable.date, dateStr))
      .returning();
    res.json(UpsertExerciseLogResponse.parse(updated));
    return;
  }
  const [created] = await db.insert(exerciseLogsTable).values({ ...rest, date: dateStr }).returning();
  res.json(UpsertExerciseLogResponse.parse(created));
});

export default router;
