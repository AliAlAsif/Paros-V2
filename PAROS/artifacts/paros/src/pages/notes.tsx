import { useState } from "react";
import { Link } from "wouter";
import { useListNotes, useCreateNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Plus, FileText, Tag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  tags: z.string().optional(),
});

export default function Notes() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: notes, isLoading } = useListNotes({ search, tag: tagFilter });

  // Get unique tags
  const allTags = Array.from(new Set(
    notes?.flatMap(n => n.tags ? n.tags.split(',').map(t => t.trim()) : []) || []
  )).filter(Boolean);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Your knowledge base and quick captures.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Note</DialogTitle></DialogHeader>
            <CreateNoteForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search notes..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-none">
        <Button 
          variant={tagFilter === "" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setTagFilter("")}
          className="rounded-full"
        >
          All
        </Button>
        {allTags.map(tag => (
          <Button 
            key={tag}
            variant={tagFilter === tag ? "default" : "outline"} 
            size="sm"
            onClick={() => setTagFilter(tag)}
            className="rounded-full"
          >
            #{tag}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {notes?.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/notes/${note.id}`}>
                    <Card className="h-full hover-elevate cursor-pointer border-border group">
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                          {note.content || "Empty note"}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t">
                          <div className="flex gap-1 overflow-hidden">
                            {note.tags?.split(',').map((t, i) => (
                              <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 bg-muted text-muted-foreground rounded truncate max-w-[80px]">
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap pl-2">
                            {format(new Date(note.updatedAt), "MMM d, yy")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              {notes?.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card/50">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">No notes found</h3>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateNoteForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createNote = useCreateNote();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", tags: "" }
  });

  const onSubmit = (v: z.infer<typeof noteSchema>) => {
    createNote.mutate({ data: v }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        onSuccess();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="title" render={({field}) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
        )}/>
        <FormField control={form.control} name="tags" render={({field}) => (
          <FormItem><FormLabel>Tags (comma separated)</FormLabel><FormControl><Input placeholder="physics, exam prep" {...field}/></FormControl></FormItem>
        )}/>
        <Button type="submit" className="w-full mt-4">Create Note</Button>
      </form>
    </Form>
  );
}
