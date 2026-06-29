import { pgTable, serial, text, real, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  folderId: integer("folder_id"),
  description: text("description"),
  progress: real("progress").notNull().default(0),
  status: text("status").notNull().default("planning"), // planning | active | on_hold | completed | cancelled
  priority: text("priority").notNull().default("medium"), // low | medium | high | critical
  deadline: date("deadline", { mode: "string" }),
  notes: text("notes"),
  tags: text("tags"),
  isPinned: boolean("is_pinned").notNull().default(false),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, timeSpentMinutes: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
