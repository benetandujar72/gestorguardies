import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Bell, BarChart3, Plus, ListTodo, Bot, MessageCircle } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsPanelProps {
  onCreateTask: () => void;
}

export default function QuickActionsPanel({ onCreateTask }: QuickActionsPanelProps) {
  // Fetch workload balance data
  const { data: workloadBalance = [] } = useQuery({
    queryKey: ['/api/analytics/workload-balance'],
    select: (data: any[]) => data.slice(0, 3), // Show top 3 professors
  });

  const quickActions = [
    {
      label: "Nova Guàrdia",
      icon: Plus,
      href: "/guardies",
      variant: "default" as const,
      className: "bg-primary hover:bg-blue-800 text-white",
    },
    {
      label: "Assignar Tasques",
      icon: ListTodo,
      onClick: onCreateTask,
      variant: "default" as const,
      className: "bg-secondary hover:bg-green-700 text-white",
    },
    {
      label: "Enviar Comunicació",
      icon: Bell,
      href: "/comunicacions",
      variant: "default" as const,
      className: "bg-accent hover:bg-orange-600 text-white",
    },
    {
      label: "Generar Informe",
      icon: BarChart3,
      href: "/analytics",
      variant: "outline" as const,
      className: "border-gray-300 text-text-primary hover:bg-gray-50",
    },
  ];

  return (
    <>
      {/* Quick Actions Card */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-text-primary">
            Accions Ràpides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            
            if (action.onClick) {
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant}
                  className={`w-full flex items-center space-x-3 p-3 ${action.className}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </Button>
              );
            }

            return (
              <Link key={index} href={action.href || "/"}>
                <Button
                  variant={action.variant}
                  className={`w-full flex items-center space-x-3 p-3 ${action.className}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Chat Bot Quick Access */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Assistent IA</h3>
              <p className="text-xs text-text-secondary">En línia</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Pregunta'm sobre prediccions d'assignacions, optimització de guardies o anàlisis de dades.
          </p>
          <Link href="/chat-bot">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              <MessageCircle className="mr-2 h-4 w-4" />
              Iniciar Conversa
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Weekly Balance Overview */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-text-primary">
            Equilibri Setmanal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {workloadBalance.length === 0 ? (
            <div className="text-center text-sm text-text-secondary">
              No hi ha dades d'equilibri disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {workloadBalance.map((professor: any, index: number) => {
                const percentage = Math.min((professor.guardCount / 10) * 100, 100);
                const getProgressColor = () => {
                  if (percentage < 60) return "bg-secondary";
                  if (percentage < 90) return "bg-accent";
                  return "bg-error";
                };

                return (
                  <div key={professor.professorId || index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">
                        Professor {professor.professorId || index + 1}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {professor.guardCount || 0}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
              
              <div className="pt-2 text-center">
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    Veure Detalls Complets
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
