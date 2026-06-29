import { Router, type IRouter } from "express";
import { eq, gte, asc } from "drizzle-orm";
import { db, examsTable } from "@workspace/db";
import {
  ListExamsQueryParams,
  CreateExamBody,
  UpdateExamParams,
  UpdateExamBody,
  DeleteExamParams,
  ListExamsResponse,
  CreateExamResponse,
  UpdateExamResponse,
} from "@workspace/api-zod";

function withDaysUntil(exam: typeof examsTable.$inferSelect) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(exam.examDate);
  const diff = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { ...exam, daysUntilExam: diff };
}

const router: IRouter = Router();

router.get("/exams", async (req, res): Promise<void> => {
  const query = ListExamsQueryParams.safeParse(req.query);
  const today = new Date().toISOString().split("T")[0];
  let result;
  if (query.success && query.data.upcoming) {
    result = await db.select().from(examsTable)
      .where(gte(examsTable.examDate, today))
      .orderBy(asc(examsTable.examDate));
  } else {
    result = await db.select().from(examsTable).orderBy(asc(examsTable.examDate));
  }
  res.json(ListExamsResponse.parse(result.map(withDaysUntil)));
});

router.post("/exams", async (req, res): Promise<void> => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values = {
    ...parsed.data,
    examDate: String(parsed.data.examDate),
  };
  const [exam] = await db.insert(examsTable).values(values).returning();
  res.status(201).json(CreateExamResponse.parse(withDaysUntil(exam)));
});

router.patch("/exams/:id", async (req, res): Promise<void> => {
  const params = UpdateExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.examDate) values.examDate = String(parsed.data.examDate);
  const [exam] = await db
    .update(examsTable)
    .set(values)
    .where(eq(examsTable.id, params.data.id))
    .returning();
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  res.json(UpdateExamResponse.parse(withDaysUntil(exam)));
});

router.delete("/exams/:id", async (req, res): Promise<void> => {
  const params = DeleteExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(examsTable).where(eq(examsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
