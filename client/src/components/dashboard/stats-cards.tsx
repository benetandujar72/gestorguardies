import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, UserCheck, AlertTriangle, Route } from "lucide-react";

interface StatsData {
  guardiesAvui: number;
  assignacionsActives: number;
  tasquesPendents: number;
  sortidesSetmana: number;
}

export default function StatsCards() {
  // Fetch today's guards
  const { data: guardiesAvui = [] } = useQuery({
    queryKey: ['/api/guardies', { today: true }],
  });

  // Fetch active assignments
  const { data: assignacionsActives = [] } = useQuery({
    queryKey: ['/api/assignacions-guardia'],
  });

  // Fetch pending tasks
  const { data: tasquesPendents = [] } = useQuery({
    queryKey: ['/api/tasques', { pendent: true }],
  });

  // Fetch this week's outings
  const { data: sortidesSetmana = [] } = useQuery({
    queryKey: ['/api/sortides', { thisWeek: true }],
  });

  const stats = [
    {
      title: "Guardies d'Avui",
      value: guardiesAvui.length,
      icon: Shield,
      change: "+2 respecte ahir",
      color: "blue",
    },
    {
      title: "Assignacions Actives",
      value: assignacionsActives.length,
      icon: UserCheck,
      change: "Equilibri: 92%",
      color: "green",
    },
    {
      title: "Tasques Pendents",
      value: tasquesPendents.length,
      icon: AlertTriangle,
      change: tasquesPendents.filter((t: any) => t.prioritat === 'alta' || t.prioritat === 'urgent').length + " prioritàries",
      color: "orange",
    },
    {
      title: "Sortides aquesta Setmana",
      value: sortidesSetmana.length,
      icon: Route,
      change: sortidesSetmana.reduce((acc: number, sortida: any) => {
        return acc + (sortida.grupId ? 1 : 0);
      }, 0) + " grups afectats",
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-primary";
      case "green":
        return "bg-green-100 text-secondary";
      case "orange":
        return "bg-orange-100 text-accent";
      case "purple":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getChangeColor = (color: string) => {
    switch (color) {
      case "blue":
      case "green":
        return "text-secondary";
      case "orange":
        return "text-accent";
      case "purple":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="text-xl h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-text-primary">
                  {stat.value}
                </span>
              </div>
              <h3 className="text-sm font-medium text-text-secondary mb-1">
                {stat.title}
              </h3>
              <p className={`text-xs ${getChangeColor(stat.color)}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
