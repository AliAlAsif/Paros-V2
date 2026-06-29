import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const researchTopicsTable = pgTable("research_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  folderId: integer("folder_id"),
  notes: text("notes"),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
  papers: text("papers"),
  status: text("status").notNull().default("active"), // active | paused | completed | archived
  nextAction: text("next_action"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResearchTopicSchema = createInsertSchema(researchTopicsTable).omit({ id: true, createdAt: true, timeSpentMinutes: true });
export type InsertResearchTopic = z.infer<typeof insertResearchTopicSchema>;
export type ResearchTopic = typeof researchTopicsTable.$inferSelect;
