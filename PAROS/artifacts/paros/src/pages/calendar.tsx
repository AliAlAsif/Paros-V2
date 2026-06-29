import { useState } from "react";
import { useListStudySessions, useListExams } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Timer, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: sessions } = useListStudySessions();
  const { data: exams } = useListExams();

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View your study schedule and upcoming exams.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold w-40 text-center">{format(currentDate, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b shrink-0 bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            const daySessions = sessions?.filter(s => isSameDay(new Date(s.date), day)) || [];
            const dayExams = exams?.filter(e => isSameDay(new Date(e.examDate), day)) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div 
                key={day.toString()} 
                className={`border-r border-b p-2 flex flex-col gap-1 overflow-hidden transition-colors hover:bg-muted/10 ${
                  !isCurrentMonth ? "bg-muted/5 text-muted-foreground/50" : ""
                } ${isToday(day) ? "bg-primary/5" : ""}`}
              >
                <div className={`text-right text-sm font-medium p-1 ${isToday(day) ? "text-primary font-bold" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {dayExams.map(exam => (
                    <div key={`e-${exam.id}`} className="text-[10px] p-1 rounded bg-destructive/10 text-destructive border border-destructive/20 font-medium truncate flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3 shrink-0" />
                      {exam.name}
                    </div>
                  ))}
                  {daySessions.map(session => (
                    <div key={`s-${session.id}`} className={`text-[10px] p-1 rounded font-medium truncate flex items-center gap-1 ${session.sessionKind === 'study' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                      <Timer className="w-3 h-3 shrink-0" />
                      {session.durationMinutes}m {session.topic || session.sessionKind}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
