import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetResearchTopic, 
  useUpdateResearchTopic,
  getGetResearchTopicQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Clock, FileText, FlaskConical, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ResearchTopicDetail() {
  const { id } = useParams();
  const topicId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: topic, isLoading } = useGetResearchTopic(topicId, {
    query: { enabled: !!topicId, queryKey: getGetResearchTopicQueryKey(topicId) }
  });
  
  const updateTopic = useUpdateResearchTopic();
  const mutateFnRef = useRef(updateTopic.mutate);
  mutateFnRef.current = updateTopic.mutate;

  const [editForm, setEditForm] = useState({
    title: "",
    status: "active" as any,
    nextAction: "",
    notes: "",
    papers: ""
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (topic && initializedForId.current !== topicId) {
      initializedForId.current = topicId;
      setEditForm({
        title: topic.title,
        status: topic.status,
        nextAction: topic.nextAction || "",
        notes: topic.notes || "",
        papers: topic.papers || ""
      });
    }
  }, [topic, topicId]);

  // Auto-save logic
  useEffect(() => {
    if (initializedForId.current !== topicId || !topic) return;
    
    const timer = setTimeout(() => {
      const hasChanges = 
        editForm.title !== topic.title ||
        editForm.status !== topic.status ||
        editForm.nextAction !== (topic.nextAction || "") ||
        editForm.notes !== (topic.notes || "") ||
        editForm.papers !== (topic.papers || "");

      if (hasChanges) {
        mutateFnRef.current(
          { id: topicId, data: editForm },
          {
            onSuccess: (updatedData) => {
              queryClient.setQueryData(getGetResearchTopicQueryKey(topicId), updatedData);
            }
          }
        );
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [editForm, topicId, topic, queryClient]);

  if (isLoading || !topic) {
    return <div className="p-8 text-center">Loading topic...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/research" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Research
        </Link>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FlaskConical className="w-8 h-8" />
          </div>
          <Input 
            value={editForm.title} 
            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            className="text-3xl font-bold h-auto py-2 border-transparent bg-transparent hover:bg-muted focus:bg-background shadow-none"
          />
        </div>
        
        <div className="flex items-center gap-4 ml-14">
          <Select 
            value={editForm.status} 
            onValueChange={(v: any) => setEditForm(prev => ({ ...prev, status: v }))}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center text-sm text-muted-foreground font-mono bg-card border px-2 py-1 rounded">
            <Clock className="w-4 h-4 mr-2" />
            {(topic.timeSpentMinutes / 60).toFixed(1)}h spent
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="py-3 bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                <ArrowLeft className="w-4 h-4 rotate-180" />
                Next Action
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Input 
                value={editForm.nextAction} 
                onChange={e => setEditForm(prev => ({ ...prev, nextAction: e.target.value }))}
                placeholder="What's the very next step to move this forward?"
                className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 px-4 rounded-none"
              />
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Research Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea 
                value={editForm.notes} 
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Write your findings, summaries, and thoughts here..."
                className="min-h-[400px] border-0 focus-visible:ring-0 shadow-none resize-none p-4 rounded-none bg-transparent"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Papers & References
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea 
                value={editForm.papers} 
                onChange={e => setEditForm(prev => ({ ...prev, papers: e.target.value }))}
                placeholder="Paste links, DOIs, or citations here..."
                className="min-h-[300px] border-0 focus-visible:ring-0 shadow-none resize-none p-4 rounded-none bg-transparent font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
