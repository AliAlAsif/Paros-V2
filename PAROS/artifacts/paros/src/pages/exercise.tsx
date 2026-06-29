import { useState } from "react";
import { useListExerciseLogs, useUpsertExerciseLog, getListExerciseLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Dumbbell, Flame } from "lucide-react";

export default function ExerciseTracker() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useListExerciseLogs();
  const upsertLog = useUpsertExerciseLog();

  const toggleDay = (dateStr: string, currentValue: boolean) => {
    upsertLog.mutate(
      { data: { date: dateStr, completed: !currentValue } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListExerciseLogsQueryKey() }) }
    );
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate current streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = format(subDays(new Date(), i), "yyyy-MM-dd");
    const log = logs?.find(l => l.date === dStr);
    if (log?.completed) streak++;
    else if (i !== 0) break; // if today is missed, keep checking yesterday, but break on first miss
  }

  const thisMonthCount = logs?.filter(l => l.completed && isSameMonth(new Date(l.date), new Date())).length || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" /> Exercise Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Physical health is a prerequisite for mental stamina.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-primary/20 rounded-full text-primary">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Streak</div>
              <div className="text-4xl font-bold font-mono text-primary">{streak} Days</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-muted rounded-full text-muted-foreground">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Month</div>
              <div className="text-4xl font-bold font-mono">{thisMonthCount} Workouts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-xl font-bold mb-6">{format(new Date(), "MMMM yyyy")}</h2>
          
          <div className="grid grid-cols-7 gap-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground pb-2">
                {day}
              </div>
            ))}
            
            {/* Empty slots for start of month padding */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map(date => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isCompleted = logs?.find(l => l.date === dateStr)?.completed;
              const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
              const isFuture = date > new Date();

              return (
                <div 
                  key={dateStr}
                  onClick={() => !isFuture && toggleDay(dateStr, !!isCompleted)}
                  className={`
                    aspect-square rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                    ${isFuture ? 'opacity-30 cursor-not-allowed border-dashed' : 'hover:scale-105 hover:shadow-md'}
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-card border-border text-foreground'}
                    ${isToday && !isCompleted ? 'border-primary border-dashed' : ''}
                  `}
                >
                  <span className="font-bold text-lg">{format(date, "d")}</span>
                  {isCompleted && <Dumbbell className="w-4 h-4 mt-1 opacity-80" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
