import { pgTable, serial, text, real, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  semester: text("semester").notNull(),
  instructorName: text("instructor_name"),
  credits: real("credits"),
  color: text("color").notNull().default("#3B82F6"),
  notes: text("notes"),
  progress: real("progress").notNull().default(0),
  totalStudyHours: real("total_study_hours").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  folderId: integer("folder_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true, totalStudyHours: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
