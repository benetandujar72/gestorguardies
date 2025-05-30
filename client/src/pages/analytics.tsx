import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Clock, AlertTriangle, Download, RefreshCw } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { data: guardStats, isLoading: loadingGuardStats } = useQuery({
    queryKey: ["/api/analytics/guard-stats"],
  });

  const { data: professorWorkload, isLoading: loadingWorkload } = useQuery({
    queryKey: ["/api/analytics/professor-workload"],
  });

  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ["/api/analytics/predictions"],
  });

  if (loadingGuardStats || loadingWorkload || loadingPredictions) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mockGuardStats = {
    totalAssignments: 156,
    activeGuards: 24,
    pendingTasks: 12,
    completionRate: 87
  };

  const mockWorkloadData = [
    { professor: "Maria García", assignments: 8, hours: 16 },
    { professor: "Josep Martí", assignments: 6, hours: 12 },
    { professor: "Anna Soler", assignments: 7, hours: 14 },
    { professor: "Carles Vidal", assignments: 5, hours: 10 },
    { professor: "Laura Pérez", assignments: 9, hours: 18 }
  ];

  const mockMonthlyData = [
    { month: "Gen", assignments: 45, tasks: 38 },
    { month: "Feb", assignments: 52, tasks: 44 },
    { month: "Mar", assignments: 48, tasks: 41 },
    { month: "Abr", assignments: 56, tasks: 49 },
    { month: "Mai", assignments: 62, tasks: 53 }
  ];

  const mockTaskDistribution = [
    { name: "Vigilància pati", value: 35, color: "#0088FE" },
    { name: "Substitució", value: 28, color: "#00C49F" },
    { name: "Acompanyament", value: 20, color: "#FFBB28" },
    { name: "Altres", value: 17, color: "#FF8042" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Analítiques</h1>
          <p className="text-text-secondary mt-2">
            Estadístiques i mètriques del sistema de gestió de guàrdies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualitzar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignacions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuardStats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              +12% respecte al mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guàrdies Actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuardStats.activeGuards}</div>
            <p className="text-xs text-muted-foreground">
              Actualment en curs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasques Pendents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuardStats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              -3 respecte ahir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Finalització</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuardStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% respecte al mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribució de Càrrega de Treball</CardTitle>
            <CardDescription>
              Assignacions per professor els últims 30 dies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="professor" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assignments" fill="#0088FE" name="Assignacions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribució de Tipus de Tasques</CardTitle>
            <CardDescription>
              Percentatge per tipus de tasca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockTaskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockTaskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendència Mensual</CardTitle>
          <CardDescription>
            Evolució d'assignacions i tasques completades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="assignments" 
                stroke="#0088FE" 
                strokeWidth={2}
                name="Assignacions"
              />
              <Line 
                type="monotone" 
                dataKey="tasks" 
                stroke="#00C49F" 
                strokeWidth={2}
                name="Tasques completades"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Predictions */}
      {predictions && predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediccions IA</CardTitle>
            <CardDescription>
              Anàlisi predictiu del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{prediction.tipus}</h4>
                    <p className="text-sm text-text-secondary">{prediction.descripcio}</p>
                  </div>
                  <Badge variant={prediction.confianca > 0.8 ? "default" : "secondary"}>
                    {Math.round(prediction.confianca * 100)}% confiança
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}