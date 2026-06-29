import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studySessionsTable = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type").notNull().default("custom"), // 10min | 30min | 60min | custom
  sessionKind: text("session_kind").notNull().default("study"), // study | research
  subjectId: integer("subject_id"),
  researchTopicId: integer("research_topic_id"),
  topic: text("topic"),
  goal: text("goal"),
  focusRating: integer("focus_rating").notNull().default(3),
  completionStatus: text("completion_status").notNull().default("completed"), // completed | partial | cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudySessionSchema = createInsertSchema(studySessionsTable).omit({ id: true, createdAt: true });
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessionsTable.$inferSelect;
