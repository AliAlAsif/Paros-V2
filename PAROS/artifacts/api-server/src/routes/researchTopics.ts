import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, researchTopicsTable } from "@workspace/db";
import {
  CreateResearchTopicBody,
  GetResearchTopicParams,
  UpdateResearchTopicParams,
  UpdateResearchTopicBody,
  DeleteResearchTopicParams,
  ListResearchTopicsResponse,
  CreateResearchTopicResponse,
  GetResearchTopicResponse,
  UpdateResearchTopicResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/research-topics", async (_req, res): Promise<void> => {
  const topics = await db.select().from(researchTopicsTable).orderBy(researchTopicsTable.createdAt);
  res.json(ListResearchTopicsResponse.parse(topics));
});

router.post("/research-topics", async (req, res): Promise<void> => {
  const parsed = CreateResearchTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [topic] = await db.insert(researchTopicsTable).values(parsed.data).returning();
  res.status(201).json(CreateResearchTopicResponse.parse(topic));
});

router.get("/research-topics/:id", async (req, res): Promise<void> => {
  const params = GetResearchTopicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [topic] = await db.select().from(researchTopicsTable).where(eq(researchTopicsTable.id, params.data.id));
  if (!topic) {
    res.status(404).json({ error: "Research topic not found" });
    return;
  }
  res.json(GetResearchTopicResponse.parse(topic));
});

router.patch("/research-topics/:id", async (req, res): Promise<void> => {
  const params = UpdateResearchTopicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateResearchTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [topic] = await db
    .update(researchTopicsTable)
    .set(parsed.data)
    .where(eq(researchTopicsTable.id, params.data.id))
    .returning();
  if (!topic) {
    res.status(404).json({ error: "Research topic not found" });
    return;
  }
  res.json(UpdateResearchTopicResponse.parse(topic));
});

router.delete("/research-topics/:id", async (req, res): Promise<void> => {
  const params = DeleteResearchTopicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(researchTopicsTable).where(eq(researchTopicsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
