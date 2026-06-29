import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout';

// Pages
import Dashboard from '@/pages/dashboard';
import Subjects from '@/pages/subjects';
import SubjectDetail from '@/pages/subject-detail';
import StudySessions from '@/pages/study-sessions';
import ResearchTopics from '@/pages/research-topics';
import ResearchTopicDetail from '@/pages/research-topic-detail';
import Projects from '@/pages/projects';
import ProjectDetail from '@/pages/project-detail';
import Exams from '@/pages/exams';
import Calendar from '@/pages/calendar';
import Notes from '@/pages/notes';
import NoteDetail from '@/pages/note-detail';
import Analytics from '@/pages/analytics';
import History from '@/pages/history';
import PrayerTracker from '@/pages/prayer';
import ExerciseTracker from '@/pages/exercise';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/subjects/:id" component={SubjectDetail} />
        <Route path="/study" component={StudySessions} />
        <Route path="/research" component={ResearchTopics} />
        <Route path="/research/:id" component={ResearchTopicDetail} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/exams" component={Exams} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/notes" component={Notes} />
        <Route path="/notes/:id" component={NoteDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/history" component={History} />
        <Route path="/prayer" component={PrayerTracker} />
        <Route path="/exercise" component={ExerciseTracker} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="paros-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
