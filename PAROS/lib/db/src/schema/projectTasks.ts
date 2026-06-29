import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectTasksTable = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"), // todo | in_progress | done
  priority: text("priority").notNull().default("medium"), // low | medium | high
  dueDate: date("due_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectTaskSchema = createInsertSchema(projectTasksTable).omit({ id: true, createdAt: true });
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasksTable.$inferSelect;
