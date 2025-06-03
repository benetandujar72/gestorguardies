import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DashboardGuardiesVisual from "@/pages/dashboard-guardies";
import Guards from "@/pages/guards";
import Assignments from "@/pages/assignments";
import AssignedGuards from "@/pages/assigned-guards";
import Communications from "@/pages/communications";
import AcademicYears from "@/pages/academic-years";
import GuardCalendarResponsive from "@/pages/guard-calendar-responsive";
import Schedules from "@/pages/schedules-new";
import OutingsEnhanced from "@/pages/outings-enhanced";
import Tasks from "@/pages/tasks";
import Professors from "@/pages/professors";
import Groups from "@/pages/groups";
import Classrooms from "@/pages/classrooms";
import Students from "@/pages/students";
import Subjects from "@/pages/subjects";
import Analytics from "@/pages/analytics-real";
import SimpleChat from "@/pages/simple-chat";
import ImportCSV from "@/pages/import-csv";
import SortidesSubstitucions from "@/pages/sortides-substitucions-new";
import GestioGuardies from "@/pages/gestio-guardies";
import GmailConfig from "@/pages/gmail-config";
import Setup from "@/pages/setup";
import NotFound from "@/pages/not-found";
import ResponsiveSidebar from "@/components/layout/sidebar-responsive";
import MobileHeader from "@/components/layout/mobile-header";
import TopNavigation from "@/components/layout/top-navigation";
import FloatingChatBot from "@/components/common/floating-chat-bot";
import { useState } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Header per mòbil */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Header per desktop (ocult en mòbil) */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      
      <div className="flex">
        <ResponsiveSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="flex-1 overflow-auto min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-64px)]">
          <div className="px-4 md:px-6 py-4 md:py-8">
            <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard-guardies" component={DashboardGuardiesVisual} />
            <Route path="/guardies" component={Guards} />
            <Route path="/calendari-guardies" component={GuardCalendarResponsive} />
            <Route path="/assignacions" component={Assignments} />
            <Route path="/guardies-assignades" component={AssignedGuards} />
            <Route path="/comunicacions" component={Communications} />
            <Route path="/anys-academics" component={AcademicYears} />
            <Route path="/horaris" component={Schedules} />
            <Route path="/sortides" component={OutingsEnhanced} />
            <Route path="/sortides-substitucions-new" component={SortidesSubstitucions} />
            <Route path="/gestio-guardies" component={GestioGuardies} />
            <Route path="/gmail-config" component={GmailConfig} />
            <Route path="/tasques" component={Tasks} />
            <Route path="/professors" component={Professors} />
            <Route path="/grups" component={Groups} />
            <Route path="/aules" component={Classrooms} />
            <Route path="/alumnes" component={Students} />
            <Route path="/materies" component={Subjects} />
            <Route path="/analytics-real" component={Analytics} />
            <Route path="/ai-chat" component={SimpleChat} />
            <Route path="/import-csv" component={ImportCSV} />
            <Route path="/guard-calendar" component={GuardCalendarResponsive} />
            <Route path="/schedules" component={Schedules} />
            <Route path="/students" component={Students} />
            <Route path="/subjects" component={Subjects} />
            <Route path="/groups" component={Groups} />
            <Route path="/classrooms" component={Classrooms} />
            <Route component={NotFound} />
            </Switch>
          </div>
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
