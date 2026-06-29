import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, projectTasksTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  ListProjectTasksParams,
  CreateProjectTaskParams,
  CreateProjectTaskBody,
  UpdateProjectTaskParams,
  UpdateProjectTaskBody,
  DeleteProjectTaskParams,
  ListProjectsResponse,
  CreateProjectResponse,
  GetProjectResponse,
  UpdateProjectResponse,
  ListProjectTasksResponse,
  CreateProjectTaskResponse,
  UpdateProjectTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Projects ───────────────────────────────────────────────────────────────
router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  res.json(ListProjectsResponse.parse(projects));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const vals: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.deadline) vals.deadline = String(parsed.data.deadline);
  const [project] = await db.insert(projectsTable).values(vals as any).returning();
  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const vals: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.deadline) vals.deadline = String(parsed.data.deadline);
  const [project] = await db
    .update(projectsTable)
    .set(vals as any)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
  res.sendStatus(204);
});

// ── Project Tasks ──────────────────────────────────────────────────────────
router.get("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = ListProjectTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tasks = await db
    .select()
    .from(projectTasksTable)
    .where(eq(projectTasksTable.projectId, params.data.projectId))
    .orderBy(projectTasksTable.createdAt);
  res.json(ListProjectTasksResponse.parse(tasks));
});

router.post("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = CreateProjectTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateProjectTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const vals: Record<string, unknown> = { ...parsed.data, projectId: params.data.projectId };
  if (parsed.data.dueDate) vals.dueDate = String(parsed.data.dueDate);
  const [task] = await db
    .insert(projectTasksTable)
    .values(vals as any)
    .returning();
  res.status(201).json(CreateProjectTaskResponse.parse(task));
});

router.patch("/projects/:projectId/tasks/:taskId", async (req, res): Promise<void> => {
  const params = UpdateProjectTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const vals: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dueDate) vals.dueDate = String(parsed.data.dueDate);
  const [task] = await db
    .update(projectTasksTable)
    .set(vals as any)
    .where(eq(projectTasksTable.id, params.data.taskId) && eq(projectTasksTable.projectId, params.data.projectId))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateProjectTaskResponse.parse(task));
});

router.delete("/projects/:projectId/tasks/:taskId", async (req, res): Promise<void> => {
  const params = DeleteProjectTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectTasksTable).where(eq(projectTasksTable.id, params.data.taskId) && eq(projectTasksTable.projectId, params.data.projectId));
  res.sendStatus(204);
});

export default router;
