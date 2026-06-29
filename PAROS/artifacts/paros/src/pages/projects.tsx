import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, CheckSquare, Clock, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const projectSchema = z.object({
  name: z.string().min(1, "Name required"),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().optional()
});

export default function Projects() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: projects, isLoading } = useListProjects();

  const filtered = projects?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Group by status
  const active = filtered?.filter(p => p.status === 'active') || [];
  const planning = filtered?.filter(p => p.status === 'planning') || [];
  const other = filtered?.filter(p => !['active', 'planning'].includes(p.status)) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage long-term assignments and personal engineering builds.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <CreateProjectForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search projects..." 
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex-1 flex gap-6 overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 w-80 bg-muted/30 rounded-xl p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
          <ProjectColumn title="Active" projects={active} color="border-primary" />
          <ProjectColumn title="Planning" projects={planning} color="border-blue-500/50" />
          <ProjectColumn title="Backlog / Done" projects={other} color="border-border" />
        </div>
      )}
    </div>
  );
}

function ProjectColumn({ title, projects, color }: { title: string, projects: any[], color: string }) {
  return (
    <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col snap-center">
      <div className={`font-semibold mb-4 px-1 flex items-center justify-between border-b-2 pb-2 ${color}`}>
        <span>{title}</span>
        <Badge variant="secondary" className="font-mono">{projects.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        <AnimatePresence>
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/projects/${p.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors bg-card shadow-sm hover:shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium line-clamp-2 leading-tight pr-2">{p.name}</div>
                      {p.priority === 'critical' && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Critical</Badge>}
                      {p.priority === 'high' && <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-orange-500 hover:bg-orange-600">High</Badge>}
                    </div>
                    
                    {p.category && (
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                    )}

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {projects.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-card/30">
              Empty
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CreateProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", status: "planning", priority: "medium", category: "" }
  });

  const onSubmit = (v: z.infer<typeof projectSchema>) => {
    createProject.mutate({ data: v }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        onSuccess();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="name" render={({field}) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
        )}/>
        <FormField control={form.control} name="category" render={({field}) => (
          <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Senior Design" {...field}/></FormControl></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({field}) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
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
        <Button type="submit" className="w-full">Create</Button>
      </form>
    </Form>
  );
}
