import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useUpdateProject,
  useListProjectTasks,
  useCreateProjectTask,
  useUpdateProjectTask,
  useDeleteProjectTask,
  getGetProjectQueryKey,
  getListProjectTasksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckSquare, Plus, Trash2, Tag, Calendar as CalendarIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });
  
  const { data: tasks } = useListProjectTasks(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectTasksQueryKey(projectId) }
  });

  const updateProject = useUpdateProject();
  const createTask = useCreateProjectTask();
  const updateTask = useUpdateProjectTask();
  const deleteTask = useDeleteProjectTask();
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "", notes: "", progress: 0 });
  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (project && initializedForId.current !== projectId) {
      initializedForId.current = projectId;
      setEditForm({
        name: project.name,
        description: project.description || "",
        notes: project.notes || "",
        progress: project.progress
      });
    }
  }, [project, projectId]);

  const saveProject = () => {
    updateProject.mutate(
      { id: projectId, data: editForm },
      { onSuccess: (data) => queryClient.setQueryData(getGetProjectQueryKey(projectId), data) }
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask.mutate({ projectId, data: { title: newTaskTitle, status: 'todo', priority: 'medium' } }, {
      onSuccess: () => {
        setNewTaskTitle("");
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
      }
    });
  };

  const toggleTask = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTask.mutate({ projectId, taskId, data: { status: newStatus as any } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) })
    });
  };

  const removeTask = (taskId: number) => {
    deleteTask.mutate({ projectId, taskId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) })
    });
  };

  if (isLoading || !project) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between shrink-0">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <Button size="sm" onClick={saveProject} disabled={updateProject.isPending} className="gap-2">
          <Save className="w-4 h-4" /> Save Details
        </Button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto space-y-6 pr-2">
          <div className="space-y-4">
            <Input 
              value={editForm.name} 
              onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="text-4xl font-bold h-auto py-2 border-transparent bg-transparent hover:bg-muted focus:bg-background px-2 -ml-2"
            />
            <div className="flex items-center gap-3">
              <Badge variant="outline">{project.status}</Badge>
              <Badge variant="secondary">{project.priority}</Badge>
              {project.category && <Badge variant="outline"><Tag className="w-3 h-3 mr-1"/> {project.category}</Badge>}
            </div>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Overall Progress</span>
                <span>{editForm.progress}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={editForm.progress} 
                onChange={e => setEditForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-muted-foreground">Description</div>
              <Textarea 
                value={editForm.description} 
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="flex-1 resize-none bg-card"
                placeholder="Project summary..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-muted-foreground">Notes</div>
              <Textarea 
                value={editForm.notes} 
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                className="flex-1 resize-none bg-card font-mono text-sm"
                placeholder="Technical notes, links..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar Tasks */}
        <div className="w-[350px] shrink-0 flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/30 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary"/> Tasks</span>
            <Badge variant="secondary">{tasks?.filter(t=>t.status==='done').length} / {tasks?.length}</Badge>
          </div>
          
          <div className="p-4 border-b">
            <form onSubmit={handleAddTask} className="flex gap-2">
              <Input 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                placeholder="Add a task..." 
                className="h-8 text-sm"
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0"><Plus className="w-4 h-4"/></Button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tasks?.map(task => (
              <div key={task.id} className="group flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <Checkbox 
                  checked={task.status === 'done'}
                  onCheckedChange={() => toggleTask(task.id, task.status)}
                  className="mt-1 transition-all"
                />
                <span className={`text-sm flex-1 pt-0.5 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                <Button 
                  variant="ghost" size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeTask(task.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {tasks?.length === 0 && (
              <div className="text-center text-muted-foreground text-sm pt-8">No tasks yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
