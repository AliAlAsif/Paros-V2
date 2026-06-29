import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  name: text("name").notNull(),
  examDate: date("exam_date", { mode: "string" }).notNull(),
  priority: text("priority").notNull().default("medium"), // low | medium | high | critical
  preparationPct: integer("preparation_pct").notNull().default(0),
  remainingChapters: text("remaining_chapters"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;
