import { useState } from "react";
import { useListExams, useCreateExam, useListSubjects, getListExamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, addDays } from "date-fns";
import { BrainCircuit, Calendar as CalIcon, Plus, AlertTriangle, CheckCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const examSchema = z.object({
  subjectId: z.coerce.number().min(1, "Select a subject"),
  name: z.string().min(1, "Name required"),
  examDate: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export default function Exams() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: exams, isLoading } = useListExams();
  const { data: subjects } = useListSubjects();

  if (isLoading) return <div className="p-8">Loading...</div>;

  const upcoming = exams?.filter(e => new Date(e.examDate) >= new Date()).sort((a,b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()) || [];
  const past = exams?.filter(e => new Date(e.examDate) < new Date()).sort((a,b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Planner</h1>
          <p className="text-muted-foreground">Track upcoming midterms and finals.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Exam</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
            <CreateExamForm subjects={subjects||[]} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
          <Flame className="w-5 h-5 text-orange-500" /> Upcoming
        </h2>
        
        {upcoming.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground">
            No upcoming exams. Enjoy the peace!
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map(exam => <ExamCard key={exam.id} exam={exam} subjects={subjects||[]} />)}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-6 opacity-60">
          <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
            <CheckCircle className="w-5 h-5" /> Past
          </h2>
          <div className="grid gap-4">
            {past.map(exam => <ExamCard key={exam.id} exam={exam} subjects={subjects||[]} past />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, subjects, past = false }: { exam: any, subjects: any[], past?: boolean }) {
  const subject = subjects.find(s => s.id === exam.subjectId);
  const date = new Date(exam.examDate);
  const days = differenceInDays(date, new Date());
  
  let statusColor = "bg-muted text-muted-foreground";
  if (!past) {
    if (days < 3) statusColor = "bg-destructive/10 text-destructive border-destructive/20";
    else if (days < 7) statusColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
    else statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
  }

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Date Box */}
        <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-muted rounded-xl border">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(date, "MMM")}</span>
          <span className="text-2xl font-bold">{format(date, "dd")}</span>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: subject?.color || '#ccc'}} />
                {subject?.name || 'Unknown'}
              </div>
              <h3 className="text-lg font-bold">{exam.name}</h3>
            </div>
            {!past && (
              <Badge variant="outline" className={statusColor}>
                {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 max-w-[200px] space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Prep</span>
                <span>{exam.preparationPct}%</span>
              </div>
              <Progress value={exam.preparationPct} className="h-1.5" />
            </div>
            {exam.priority === 'critical' && <AlertTriangle className="w-4 h-4 text-destructive" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateExamForm({ subjects, onSuccess }: { subjects: any[], onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createExam = useCreateExam();

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { subjectId: 0, name: "", examDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), priority: "medium" }
  });

  const onSubmit = (v: z.infer<typeof examSchema>) => {
    createExam.mutate({ data: v }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
        onSuccess();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="subjectId" render={({field}) => (
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )}/>
        <FormField control={form.control} name="name" render={({field}) => (
          <FormItem><FormLabel>Exam Name</FormLabel><FormControl><Input placeholder="e.g. Midterm 1" {...field}/></FormControl></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="examDate" render={({field}) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field}/></FormControl></FormItem>
          )}/>
          <FormField control={form.control} name="priority" render={({field}) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}/>
        </div>
        <Button type="submit" className="w-full mt-4">Save Exam</Button>
      </form>
    </Form>
  );
}
