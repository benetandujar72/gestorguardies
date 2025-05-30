import { useState } from "react";
import StatsCards from "@/components/dashboard/stats-cards";
import GuardScheduleWidget from "@/components/dashboard/guard-schedule-widget";
import QuickActionsPanel from "@/components/dashboard/quick-actions-panel";
import RecentActivity from "@/components/dashboard/recent-activity";
import TaskModal from "@/components/forms/task-modal";

export default function Dashboard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Tauler de Control</h1>
        <p className="text-text-secondary">
          Visió general del sistema de gestió de guardies - {new Date().toLocaleDateString('ca-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Guard Schedule Widget */}
        <div className="lg:col-span-2">
          <GuardScheduleWidget />
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-6">
          <QuickActionsPanel onCreateTask={() => setIsTaskModalOpen(true)} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <RecentActivity />
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
