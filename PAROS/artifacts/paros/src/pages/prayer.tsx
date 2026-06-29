import { useState } from "react";
import { useListPrayerLogs, useUpsertPrayerLog, getListPrayerLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Moon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PrayerTracker() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useListPrayerLogs();
  const upsertLog = useUpsertPrayerLog();

  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

  const togglePrayer = (dateStr: string, prayer: string, currentValue: boolean) => {
    const existing = logs?.find(l => l.date === dateStr);
    const data = {
      date: dateStr,
      fajr: existing?.fajr || false,
      dhuhr: existing?.dhuhr || false,
      asr: existing?.asr || false,
      maghrib: existing?.maghrib || false,
      isha: existing?.isha || false,
      [prayer]: !currentValue
    };

    upsertLog.mutate({ data }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPrayerLogsQueryKey() })
    });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  // Build last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs?.find(l => l.date === dateStr) || { date: dateStr, fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    return { date: d, dateStr, log };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Moon className="w-8 h-8 text-primary" /> Prayer Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Keep track of your daily prayers.</p>
      </div>

      <div className="grid gap-4">
        {last7Days.map(({ date, dateStr, log }, i) => {
          const isToday = i === 0;
          const completedCount = prayers.filter(p => log[p]).length;
          const percentage = (completedCount / 5) * 100;

          return (
            <Card key={dateStr} className={`${isToday ? 'border-primary/50 bg-primary/5' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="w-48 shrink-0 space-y-2">
                    <h3 className={`font-semibold text-lg ${isToday ? 'text-primary' : ''}`}>
                      {isToday ? "Today" : format(date, "EEEE")}
                    </h3>
                    <div className="text-sm text-muted-foreground">{format(date, "MMM do, yyyy")}</div>
                    <div className="flex items-center gap-2 text-sm pt-2">
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="font-mono">{completedCount}/5</span>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-5 gap-2 md:gap-4">
                    {prayers.map(prayer => (
                      <div key={prayer} className="flex flex-col items-center gap-3 bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium capitalize text-muted-foreground">{prayer}</span>
                        <Checkbox 
                          checked={log[prayer]} 
                          onCheckedChange={() => togglePrayer(dateStr, prayer, log[prayer])}
                          className="w-6 h-6 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    ))}
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
