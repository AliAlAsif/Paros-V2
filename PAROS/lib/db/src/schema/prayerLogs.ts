import { pgTable, serial, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prayerLogsTable = pgTable("prayer_logs", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  fajr: boolean("fajr").notNull().default(false),
  dhuhr: boolean("dhuhr").notNull().default(false),
  asr: boolean("asr").notNull().default(false),
  maghrib: boolean("maghrib").notNull().default(false),
  isha: boolean("isha").notNull().default(false),
});

export const insertPrayerLogSchema = createInsertSchema(prayerLogsTable).omit({ id: true });
export type InsertPrayerLog = z.infer<typeof insertPrayerLogSchema>;
export type PrayerLog = typeof prayerLogsTable.$inferSelect;
