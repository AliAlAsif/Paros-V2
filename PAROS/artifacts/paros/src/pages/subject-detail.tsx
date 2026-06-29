import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetSubject, 
  useUpdateSubject, 
  useListStudySessions,
  useListExams,
  getGetSubjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ArrowLeft, Edit3, Save, Clock, BookOpen, Target, 
  Calendar, CheckCircle2, ChevronRight, Activity 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function SubjectDetail() {
  const { id } = useParams();
  const subjectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: subject, isLoading: isSubjectLoading } = useGetSubject(subjectId, {
    query: { enabled: !!subjectId, queryKey: getGetSubjectQueryKey(subjectId) }
  });
  
  const { data: sessions } = useListStudySessions({ subjectId, limit: 5 });
  const { data: exams } = useListExams({ upcoming: true });
  
  const updateSubject = useUpdateSubject();
  const mutateFnRef = useRef(updateSubject.mutate);
  mutateFnRef.current = updateSubject.mutate;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    instructorName: "",
    progress: 0,
    notes: ""
  });

  useEffect(() => {
    if (subject && !isEditing) {
      setEditForm({
        name: subject.name,
        instructorName: subject.instructorName || "",
        progress: subject.progress,
        notes: subject.notes || ""
      });
    }
  }, [subject, isEditing]);

  const handleSave = () => {
    mutateFnRef.current(
      { 
        id: subjectId, 
        data: {
          name: editForm.name,
          instructorName: editForm.instructorName,
          progress: editForm.progress,
          notes: editForm.notes
        }
      },
      {
        onSuccess: (updatedData) => {
          queryClient.setQueryData(getGetSubjectQueryKey(subjectId), updatedData);
          setIsEditing(false);
        }
      }
    );
  };

  if (isSubjectLoading || !subject) {
    return <div className="p-8 text-center">Loading subject...</div>;
  }

  const subjectExams = exams?.filter(e => e.subjectId === subjectId) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/subjects" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-12 rounded-full" style={{ backgroundColor: subject.color }} />
            {isEditing ? (
              <Input 
                value={editForm.name} 
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="text-3xl font-bold h-auto py-1"
              />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground font-medium">
            <Badge variant="outline">{subject.semester}</Badge>
            {subject.credits && <Badge variant="secondary">{subject.credits} Credits</Badge>}
            {isEditing ? (
              <Input 
                value={editForm.instructorName} 
                onChange={e => setEditForm(prev => ({ ...prev, instructorName: e.target.value }))}
                placeholder="Instructor"
                className="h-7 text-sm max-w-[200px]"
              />
            ) : (
              subject.instructorName && <span>Prof. {subject.instructorName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit3 className="w-4 h-4" /> Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Overall Completion</span>
                  <span>{isEditing ? editForm.progress : subject.progress}%</span>
                </div>
                {isEditing ? (
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={editForm.progress} 
                    onChange={e => setEditForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                ) : (
                  <Progress value={subject.progress} className="h-2" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Time Invested</div>
                  <div className="text-2xl font-bold font-mono">{(subject.totalStudyHours / 60).toFixed(1)}h</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Study Sessions</div>
                  <div className="text-2xl font-bold">{sessions?.length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Syllabus & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              {isEditing ? (
                <Textarea 
                  value={editForm.notes} 
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add syllabus details, chapters, or general notes..."
                  className="min-h-[200px]"
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {subject.notes ? subject.notes : <span className="text-muted-foreground italic">No notes added. Click Edit to add syllabus details.</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {subjectExams.length > 0 ? (
                <div className="divide-y">
                  {subjectExams.map(exam => (
                    <div key={exam.id} className="p-4 space-y-2">
                      <div className="font-medium flex justify-between">
                        {exam.name}
                        <Badge variant="outline">{format(new Date(exam.examDate), "MMM d")}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Prep: {exam.preparationPct}%
                      </div>
                      <Progress value={exam.preparationPct} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No upcoming exams.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessions && sessions.length > 0 ? (
                <div className="divide-y">
                  {sessions.map(session => (
                    <div key={session.id} className="p-4 flex gap-3">
                      <div className="bg-muted rounded p-2 h-fit">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{session.topic || "General Study"}</div>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                          <span>{format(new Date(session.date), "MMM d")}</span>
                          <span>•</span>
                          <span>{session.durationMinutes}m</span>
                          <span>•</span>
                          <span>Rating: {session.focusRating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No sessions logged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
