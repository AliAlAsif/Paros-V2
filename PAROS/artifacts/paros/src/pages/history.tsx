import { useGetActivityHeatmap, useListStudySessions } from "@workspace/api-client-react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity as ActivityIcon, Timer, Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function History() {
  const { data: heatmapData, isLoading: heatmapLoading } = useGetActivityHeatmap();
  const { data: sessions, isLoading: sessionsLoading } = useListStudySessions({ limit: 50 });

  if (heatmapLoading || sessionsLoading) return <div className="p-8">Loading history...</div>;

  // Build GitHub style heatmap grid (last ~365 days, 52 weeks x 7 days)
  const today = startOfDay(new Date());
  const grid = [];
  
  // Fill the grid going backwards from today
  for (let i = 364; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const entry = heatmapData?.find(h => h.date === dateStr);
    grid.push({
      date: d,
      count: entry?.count || 0
    });
  }

  // Helper to determine intensity color
  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30 border border-muted/50";
    if (count < 2) return "bg-primary/20 border border-primary/20";
    if (count < 4) return "bg-primary/40 border border-primary/30";
    if (count < 6) return "bg-primary/70 border border-primary/50";
    return "bg-primary border border-primary";
  };

  // Restructure to columns of 7 for CSS grid
  const columns = [];
  for (let i = 0; i < grid.length; i += 7) {
    columns.push(grid.slice(i, i + 7));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History & Activity</h1>
        <p className="text-muted-foreground">Your academic footprint over time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-primary" />
            Contribution Heatmap
          </CardTitle>
          <CardDescription>Sessions logged over the last year</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="min-w-[800px] flex gap-[3px]">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[3px]">
                {col.map((cell, rowIndex) => (
                  <Tooltip key={rowIndex}>
                    <TooltipTrigger asChild>
                      <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(cell.count)}`} />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-semibold">{cell.count} sessions</p>
                      <p className="text-xs text-muted-foreground">{format(cell.date, "MMM d, yyyy")}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end items-center mt-4 text-xs text-muted-foreground gap-2">
            Less
            <div className="flex gap-[3px]">
              <div className="w-[12px] h-[12px] rounded-[2px] bg-muted/30" />
              <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/20" />
              <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/40" />
              <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/70" />
              <div className="w-[12px] h-[12px] rounded-[2px] bg-primary" />
            </div>
            More
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Recent Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-8 relative">
          <div className="absolute left-6 top-6 bottom-6 w-px bg-border" />
          <div className="space-y-6 relative">
            {sessions?.map((session, i) => (
              <div key={session.id} className="relative">
                <div className="absolute -left-[30px] mt-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary ring-4 ring-background" />
                <div className="bg-card border rounded-lg p-4 shadow-sm hover-elevate">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-lg">{session.topic || "Study Session"}</div>
                    <div className="text-sm font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {session.durationMinutes}m
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-3">
                    <span className="capitalize">{session.sessionKind}</span>
                    <span>•</span>
                    <span>{format(new Date(session.date), "MMM d, yyyy")} {session.startTime}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500"/> Focus: {session.focusRating}/5</span>
                  </div>
                  {session.goal && (
                    <div className="text-sm bg-muted/50 p-2 rounded">
                      <span className="font-medium text-foreground">Goal:</span> {session.goal}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
