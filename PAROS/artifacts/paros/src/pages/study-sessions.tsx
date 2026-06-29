import { useState } from "react";
import { 
  useListStudySessions, 
  useListSubjects,
  useCreateStudySession,
  getListStudySessionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Timer, Plus, Calendar as CalendarIcon, Clock, 
  BookOpen, Target, CheckCircle2, ChevronDown, ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const sessionSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  sessionType: z.enum(["10min", "30min", "60min", "custom"]),
  sessionKind: z.enum(["study", "research"]),
  subjectId: z.coerce.number().optional(),
  topic: z.string().optional(),
  goal: z.string().optional(),
  focusRating: z.coerce.number().min(1).max(5),
  completionStatus: z.enum(["completed", "partial", "cancelled"]),
  notes: z.string().optional(),
});

export default function StudySessions() {
  const [filter, setFilter] = useState<"all" | "study" | "research">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: sessions, isLoading } = useListStudySessions({ 
    sessionKind: filter === "all" ? undefined : filter,
    limit: 50
  });

  const { data: subjects } = useListSubjects();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Sessions</h1>
          <p className="text-muted-foreground">Log and review your study & research activity.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <ListFilter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="study">Study Only</SelectItem>
              <SelectItem value="research">Research Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log New Session</DialogTitle>
              </DialogHeader>
              <LogSessionForm onSuccess={() => setIsDialogOpen(false)} subjects={subjects || []} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions?.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-xl bg-card/50">
              <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium">No sessions logged</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                Start tracking your focused work by logging your first session.
              </p>
            </div>
          ) : (
            sessions?.map(session => (
              <Card key={session.id} className="hover-elevate transition-all border-border/60">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg min-w-[80px]">
                    <span className="text-2xl font-bold font-mono">{session.durationMinutes}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Mins</span>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={session.sessionKind === "study" ? "default" : "secondary"}>
                            {session.sessionKind}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(session.date), "MMM do, yyyy")}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 ml-2" />
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold">
                          {session.topic || (session.subjectId ? subjects?.find(s => s.id === session.subjectId)?.name : "General Study")}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < session.focusRating ? "fill-current" : "fill-none stroke-current opacity-30"}`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {session.goal && (
                      <div className="text-sm bg-background border rounded px-3 py-2 flex items-start gap-2">
                        <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{session.goal}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function LogSessionForm({ onSuccess, subjects }: { onSuccess: () => void, subjects: any[] }) {
  const queryClient = useQueryClient();
  const createSession = useCreateStudySession();
  const { toast } = useToast();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: format(now, "yyyy-MM-dd"),
      startTime: format(oneHourAgo, "HH:mm"),
      endTime: format(now, "HH:mm"),
      durationMinutes: 60,
      sessionType: "60min",
      sessionKind: "study",
      topic: "",
      goal: "",
      focusRating: 3,
      completionStatus: "completed",
      notes: ""
    },
  });

  const onSubmit = (values: z.infer<typeof sessionSchema>) => {
    createSession.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStudySessionsQueryKey() });
        toast({ title: "Session logged", description: "Your study time has been recorded." });
        onSuccess();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to log session.", variant: "destructive" });
      }
    });
  };

  const kind = form.watch("sessionKind");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sessionKind" render={({ field }) => (
            <FormItem>
              <FormLabel>Kind</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="study">Coursework / Study</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="startTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="endTime" render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="durationMinutes" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (mins)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        {kind === "study" && (
          <FormField control={form.control} name="subjectId" render={({ field }) => (
            <FormItem>
              <FormLabel>Subject (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="topic" render={({ field }) => (
          <FormItem>
            <FormLabel>Topic / Focus Area</FormLabel>
            <FormControl><Input placeholder="What did you work on?" {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="goal" render={({ field }) => (
          <FormItem>
            <FormLabel>Session Goal</FormLabel>
            <FormControl><Input placeholder="What was the intended outcome?" {...field} /></FormControl>
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="focusRating" render={({ field }) => (
            <FormItem>
              <FormLabel>Focus Rating (1-5)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {[1,2,3,4,5].map(v => <SelectItem key={v} value={v.toString()}>{v} - {v===5?'Excellent':'Poor'}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="completionStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Completion</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="completed">Goal Completed</SelectItem>
                  <SelectItem value="partial">Partially Completed</SelectItem>
                  <SelectItem value="cancelled">Distracted / Aborted</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createSession.isPending}>
            {createSession.isPending ? "Saving..." : "Log Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
