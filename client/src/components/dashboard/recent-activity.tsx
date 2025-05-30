import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CheckCircle, Route, CloudUpload, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ca } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: 'assignment' | 'task_completed' | 'outing_created' | 'file_uploaded';
  description: string;
  timestamp: string;
  details?: any;
}

export default function RecentActivity() {
  // This would fetch real activity data from metrics
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['/api/metrics'],
    select: (data: any[]) => {
      // Transform metrics into activity items
      return data.slice(0, 10).map((metric, index) => ({
        id: metric.id || index.toString(),
        type: getActivityType(metric.accio),
        description: getActivityDescription(metric),
        timestamp: metric.timestamp || new Date().toISOString(),
        details: metric.detalls,
      }));
    },
  });

  const getActivityType = (accio: string): ActivityItem['type'] => {
    switch (accio) {
      case 'assignar_guardia':
        return 'assignment';
      case 'completar_tasca':
        return 'task_completed';
      case 'crear_sortida':
        return 'outing_created';
      case 'pujar_fitxer':
        return 'file_uploaded';
      default:
        return 'assignment';
    }
  };

  const getActivityDescription = (metric: any): string => {
    switch (metric.accio) {
      case 'assignar_guardia':
        return `Professor assignat a la guàrdia`;
      case 'completar_tasca':
        return `Tasca completada`;
      case 'crear_sortida':
        return `Nova sortida registrada`;
      case 'pujar_fitxer':
        return `Adjunt pujat a tasca`;
      case 'crear_professor':
        return `Nou professor registrat`;
      case 'crear_tasca':
        return `Nova tasca creada`;
      default:
        return `Activitat del sistema`;
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'assignment':
        return UserPlus;
      case 'task_completed':
        return CheckCircle;
      case 'outing_created':
        return Route;
      case 'file_uploaded':
        return CloudUpload;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-primary';
      case 'task_completed':
        return 'bg-green-100 text-secondary';
      case 'outing_created':
        return 'bg-orange-100 text-accent';
      case 'file_uploaded':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activitat Recent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no metrics, show some default recent activities
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'assignment',
      description: 'Sistema inicialitzat correctament',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'task_completed',
      description: 'Configuració de base de dades completada',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'outing_created',
      description: 'Sistema preparat per gestionar sortides',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const activities = metrics.length > 0 ? metrics : defaultActivities;

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-text-primary">
          Activitat Recent
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
              addSuffix: true,
              locale: ca,
            });

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">
                    <strong>{activity.description}</strong>
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
          
          {activities.length === 0 && (
            <div className="text-center text-sm text-text-secondary py-8">
              No hi ha activitat recent per mostrar
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
