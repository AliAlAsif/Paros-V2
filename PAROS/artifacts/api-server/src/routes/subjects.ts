import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subjectsTable } from "@workspace/db";
import {
  ListSubjectsQueryParams,
  CreateSubjectBody,
  GetSubjectParams,
  UpdateSubjectParams,
  UpdateSubjectBody,
  DeleteSubjectParams,
  ListSubjectsResponse,
  CreateSubjectResponse,
  GetSubjectResponse,
  UpdateSubjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (req, res): Promise<void> => {
  const query = ListSubjectsQueryParams.safeParse(req.query);
  const includeArchived = query.success ? query.data.includeArchived : false;

  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.name);
  const filtered = includeArchived ? subjects : subjects.filter(s => !s.isArchived);
  res.json(ListSubjectsResponse.parse(filtered));
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json(CreateSubjectResponse.parse(subject));
});

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(GetSubjectResponse.parse(subject));
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(UpdateSubjectResponse.parse(subject));
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
