import { useGetDashboardSummary } from "@workspace/api-client-react";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { 
  BookOpen, Timer, FlaskConical, TrendingUp, Flame, 
  BrainCircuit, CheckSquare, Calendar, ChevronRight,
  CheckCircle2, Circle
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 text-center border rounded-lg bg-destructive/10 text-destructive">
        Failed to load dashboard data.
      </div>
    );
  }

  const formatHours = (mins: number) => (mins / 60).toFixed(1) + "h";

  const getExamColor = (days: number) => {
    if (days < 3) return "text-destructive border-destructive bg-destructive/10";
    if (days < 7) return "text-orange-500 border-orange-500 bg-orange-500/10";
    return "text-green-500 border-green-500 bg-green-500/10";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            {format(new Date(), "EEEE, MMMM do")}
          </h1>
          <p className="text-muted-foreground font-medium">Fall Semester 2024</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg shadow-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-semibold">{summary.currentStudyStreak} day streak</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Study Today" 
          value={formatHours(summary.todayStudyMinutes)}
          icon={Timer}
          trend={`${formatHours(summary.weekStudyMinutes)} this week`}
          delay={0.1}
        />
        <StatsCard 
          title="Research Today" 
          value={formatHours(summary.todayResearchMinutes)}
          icon={FlaskConical}
          trend={`${summary.currentResearchStreak} day streak`}
          delay={0.2}
        />
        <StatsCard 
          title="Month Total" 
          value={formatHours(summary.monthStudyMinutes)}
          icon={TrendingUp}
          trend="Study & Research"
          delay={0.3}
        />
        <Card className="bg-primary text-primary-foreground border-primary-border shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-medium opacity-90">Daily Habits</div>
              <Activity className="w-5 h-5 opacity-80" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">Prayers</span>
                <div className="flex gap-1">
                  {[
                    summary.prayerToday?.fajr,
                    summary.prayerToday?.dhuhr,
                    summary.prayerToday?.asr,
                    summary.prayerToday?.maghrib,
                    summary.prayerToday?.isha
                  ].map((done, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${done ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">Exercise</span>
                {summary.exerciseToday?.completed ? 
                  <CheckCircle2 className="w-4 h-4 text-white" /> : 
                  <Circle className="w-4 h-4 text-white/30" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                Upcoming Exams
              </CardTitle>
              <Link href="/exams" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {summary.upcomingExams?.length > 0 ? (
                summary.upcomingExams.map(exam => {
                  const examDate = new Date(exam.examDate);
                  const days = differenceInDays(examDate, new Date());
                  
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate transition-all">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {exam.name}
                          {exam.priority === 'critical' && <Badge variant="destructive" className="h-5 text-[10px]">Critical</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(examDate, "MMM do")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:block w-24 space-y-1 text-right">
                          <div className="text-xs text-muted-foreground">{exam.preparationPct}% ready</div>
                          <Progress value={exam.preparationPct} className="h-1.5" />
                        </div>
                        <Badge variant="outline" className={`w-20 justify-center ${getExamColor(days)}`}>
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  No upcoming exams. You're clear!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Subjects */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Active Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.recentSubjects?.map(subject => (
                <Link key={subject.id} href={`/subjects/${subject.id}`}>
                  <div className="group border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer bg-card hover-elevate">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-10 rounded-full" 
                        style={{ backgroundColor: subject.color }} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{subject.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatHours(subject.totalStudyHours)} hours total
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Pinned Projects */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Pinned Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {summary.pinnedProjects?.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="border rounded-lg p-3 cursor-pointer hover:border-primary/50 bg-card hover-elevate transition-all">
                    <div className="font-medium text-sm mb-2 truncate">{project.name}</div>
                    <div className="flex items-center justify-between">
                      <Progress value={project.progress} className="h-1.5 w-full mr-3" />
                      <span className="text-xs text-muted-foreground font-medium">{project.progress}%</span>
                    </div>
                  </div>
                </Link>
              ))}
              {(!summary.pinnedProjects || summary.pinnedProjects.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No pinned projects
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader className="py-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <Link href="/history" className="text-xs text-muted-foreground hover:text-primary">
                History
              </Link>
            </CardHeader>
            <CardContent className="pt-0 space-y-0">
              {summary.recentSessions?.slice(0, 5).map((session, i) => (
                <div key={session.id} className={`flex items-start gap-3 py-3 ${i !== 0 ? 'border-t border-border/50' : ''}`}>
                  <div className="mt-0.5 bg-muted p-1.5 rounded-md">
                    {session.sessionKind === 'study' ? <BookOpen className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="text-sm font-medium leading-none flex items-center justify-between">
                      <span className="truncate pr-2">{session.topic || (session.sessionKind === 'study' ? 'Study Session' : 'Research')}</span>
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{session.durationMinutes}m</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {session.goal || (session.sessionKind === 'study' ? 'No goal set' : 'Exploring topic')}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight font-mono">{value}</div>
          <div className="text-xs text-muted-foreground mt-2 font-medium">{trend}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Simple Activity icon replacement
function Activity({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
