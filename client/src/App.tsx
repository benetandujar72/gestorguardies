import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Guards from "@/pages/guards";
import Assignments from "@/pages/assignments";
import AssignedGuards from "@/pages/assigned-guards";
import Communications from "@/pages/communications";
import AcademicYears from "@/pages/academic-years";
import GuardCalendarResponsive from "@/pages/guard-calendar-responsive";
import Schedules from "@/pages/schedules";
import Outings from "@/pages/outings";
import Tasks from "@/pages/tasks";
import Professors from "@/pages/professors";
import Groups from "@/pages/groups";
import Classrooms from "@/pages/classrooms";
import Analytics from "@/pages/analytics";
import SimpleChat from "@/pages/simple-chat";
import ImportCSV from "@/pages/import-csv";
import Setup from "@/pages/setup";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import TopNavigation from "@/components/layout/top-navigation";
import FloatingChatBot from "@/components/common/floating-chat-bot";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Carregant...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/guardies" component={Guards} />
            <Route path="/calendari-guardies" component={GuardCalendarResponsive} />
            <Route path="/assignacions" component={Assignments} />
            <Route path="/guardies-assignades" component={AssignedGuards} />
            <Route path="/comunicacions" component={Communications} />
            <Route path="/anys-academics" component={AcademicYears} />
            <Route path="/horaris" component={Schedules} />
            <Route path="/sortides" component={Outings} />
            <Route path="/tasques" component={Tasks} />
            <Route path="/professors" component={Professors} />
            <Route path="/grups" component={Groups} />
            <Route path="/aules" component={Classrooms} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/chat-bot" component={SimpleChat} />
            <Route path="/import" component={ImportCSV} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <FloatingChatBot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
