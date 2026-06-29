import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetNote, useUpdateNote, useDeleteNote, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Trash2, Tag, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NoteDetail() {
  const { id } = useParams();
  const noteId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: note, isLoading } = useGetNote(noteId, {
    query: { enabled: !!noteId, queryKey: getGetNoteQueryKey(noteId) }
  });

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const mutateFnRef = useRef(updateNote.mutate);
  mutateFnRef.current = updateNote.mutate;

  const [editForm, setEditForm] = useState({ title: "", content: "", tags: "" });
  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (note && initializedForId.current !== noteId) {
      initializedForId.current = noteId;
      setEditForm({
        title: note.title,
        content: note.content || "",
        tags: note.tags || ""
      });
    }
  }, [note, noteId]);

  // Auto-save
  useEffect(() => {
    if (initializedForId.current !== noteId || !note) return;
    const timer = setTimeout(() => {
      const hasChanges = editForm.title !== note.title || editForm.content !== (note.content||"") || editForm.tags !== (note.tags||"");
      if (hasChanges) {
        mutateFnRef.current(
          { id: noteId, data: editForm },
          { onSuccess: (data) => queryClient.setQueryData(getGetNoteQueryKey(noteId), data) }
        );
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [editForm, noteId, note, queryClient]);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ id: noteId }, {
        onSuccess: () => window.location.href = "/notes"
      });
    }
  };

  if (isLoading || !note) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <Link href="/notes" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </Link>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        <div className="shrink-0 space-y-4 border-b pb-4">
          <Input 
            value={editForm.title} 
            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            className="text-4xl font-bold h-auto py-2 border-transparent bg-transparent hover:bg-muted focus:bg-background px-2 -ml-2 rounded-none"
            placeholder="Note Title"
          />
          <div className="flex items-center gap-6 px-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalIcon className="w-4 h-4" />
              {format(new Date(note.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Tag className="w-4 h-4" />
              <Input 
                value={editForm.tags} 
                onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                className="h-7 bg-transparent border-transparent hover:border-input focus:border-input px-1 w-full max-w-[300px]"
                placeholder="Add tags..."
              />
            </div>
          </div>
        </div>

        <Textarea 
          value={editForm.content} 
          onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
          className="flex-1 resize-none border-0 focus-visible:ring-0 shadow-none text-base p-2 bg-transparent"
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
