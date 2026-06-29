import { pgTable, serial, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exerciseLogsTable = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  completed: boolean("completed").notNull().default(false),
});

export const insertExerciseLogSchema = createInsertSchema(exerciseLogsTable).omit({ id: true });
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogsTable.$inferSelect;
