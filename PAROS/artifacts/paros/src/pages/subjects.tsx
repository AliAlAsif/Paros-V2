import { useState } from "react";
import { Link } from "wouter";
import { useListSubjects, useCreateSubject, getListSubjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, BookOpen, Clock, AlertCircle, ChevronRight, Archive, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  semester: z.string().min(1, "Semester is required"),
  instructorName: z.string().optional(),
  credits: z.coerce.number().optional(),
  color: z.string(),
});

const presetColors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
  "#8b5cf6", "#6366f1", "#ec4899", "#f43f5e"
];

export default function Subjects() {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: subjects, isLoading } = useListSubjects({ includeArchived: true });
  
  const filteredSubjects = subjects?.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.instructorName && s.instructorName.toLowerCase().includes(search.toLowerCase()));
    const matchesArchive = showArchived ? s.isArchived : !s.isArchived;
    return matchesSearch && matchesArchive;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage your coursework and track progress.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowArchived(!showArchived)}
            className="w-full sm:w-auto"
          >
            {showArchived ? <Inbox className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
            {showArchived ? "Active" : "Archived"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <CreateSubjectForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search subjects or instructors..." 
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-xl bg-card border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredSubjects?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card/50"
              >
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">No subjects found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                  {search ? "No subjects match your search." : "You haven't added any subjects yet."}
                </p>
              </motion.div>
            ) : (
              filteredSubjects?.map((subject, i) => (
                <SubjectCard key={subject.id} subject={subject} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subject, index }: { subject: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/subjects/${subject.id}`}>
        <Card className="h-full overflow-hidden hover-elevate cursor-pointer border-border group transition-all duration-300">
          <div className="h-2 w-full" style={{ backgroundColor: subject.color }} />
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {subject.name}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {subject.semester} • {subject.credits ? `${subject.credits} CR` : 'No CR'}
                </p>
              </div>
              {subject.isArchived && (
                <Archive className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Course Progress</span>
                  <span>{subject.progress}%</span>
                </div>
                <Progress value={subject.progress} className="h-1.5" />
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  <span className="font-mono">{(subject.totalStudyHours / 60).toFixed(1)}h</span>
                </div>
                {subject.instructorName && (
                  <div className="flex items-center text-muted-foreground max-w-[120px]">
                    <span className="truncate">{subject.instructorName}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function CreateSubjectForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createSubject = useCreateSubject();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      semester: "Fall 2024",
      instructorName: "",
      credits: 3,
      color: presetColors[0],
    },
  });

  const onSubmit = (values: z.infer<typeof subjectSchema>) => {
    createSubject.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        toast({ title: "Subject created", description: "Your new subject has been added." });
        form.reset();
        onSuccess();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create subject.", variant: "destructive" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Advanced Thermodynamics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="credits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credits</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="instructorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dr. Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Accent</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map(color => (
                    <div
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${field.value === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => field.onChange(color)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createSubject.isPending}>
            {createSubject.isPending ? "Creating..." : "Create Subject"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
