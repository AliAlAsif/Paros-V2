import { useState } from "react";
import { Link } from "wouter";
import { useListResearchTopics, useCreateResearchTopic, getListResearchTopicsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FlaskConical, Clock, ChevronRight, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const topicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["active", "paused", "completed", "archived"]),
  nextAction: z.string().optional(),
});

export default function ResearchTopics() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: topics, isLoading } = useListResearchTopics();
  
  const filteredTopics = topics?.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research</h1>
          <p className="text-muted-foreground">Manage active papers, topics, and literature reviews.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Research Topic</DialogTitle>
            </DialogHeader>
            <CreateTopicForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search topics..." 
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-card border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTopics?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card/50"
              >
                <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">No research topics found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                  Start tracking your reading and research.
                </p>
              </motion.div>
            ) : (
              filteredTopics?.map((topic, i) => (
                <TopicCard key={topic.id} topic={topic} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, index }: { topic: any, index: number }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'paused': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/research/${topic.id}`}>
        <Card className="h-full hover-elevate cursor-pointer border-border group transition-all">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="outline" className={`capitalize ${getStatusColor(topic.status)}`}>
                {topic.status}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(topic.timeSpentMinutes / 60)}h
              </div>
            </div>
            
            <h3 className="font-semibold text-lg line-clamp-2 mb-4 group-hover:text-primary transition-colors flex-1">
              {topic.title}
            </h3>

            {topic.nextAction && (
              <div className="text-sm bg-background border rounded p-2 text-muted-foreground flex items-start gap-2 mt-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="line-clamp-1">{topic.nextAction}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function CreateTopicForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createTopic = useCreateResearchTopic();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof topicSchema>>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: "",
      status: "active",
      nextAction: "",
    },
  });

  const onSubmit = (values: z.infer<typeof topicSchema>) => {
    createTopic.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResearchTopicsQueryKey() });
        toast({ title: "Topic created" });
        onSuccess();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create topic.", variant: "destructive" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Deep Learning in Thermodynamics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextAction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Action (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Read paper by Hinton et al." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createTopic.isPending}>
            {createTopic.isPending ? "Creating..." : "Create Topic"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
