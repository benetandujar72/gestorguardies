import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Clock, AlertTriangle, Download, RefreshCw, Calendar, CheckCircle, Shield, Loader2 } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Dades reals de l'any acadèmic actiu amb gestió d'errors
  const { data: guardies = [], isLoading: guardiesLoading, error: guardiesError } = useQuery({
    queryKey: ["/api/guardies"],
    enabled: isAuthenticated,
    retry: false
  });

  const { data: assignacions = [], isLoading: assignacionsLoading, error: assignacionsError } = useQuery({
    queryKey: ["/api/assignacions-guardia"],
    enabled: isAuthenticated,
    retry: false
  });

  const { data: tasques = [], isLoading: tasquesLoading, error: tasquesError } = useQuery({
    queryKey: ["/api/tasques"],
    enabled: isAuthenticated,
    retry: false
  });

  const { data: professors = [], isLoading: professorsLoading, error: professorsError } = useQuery({
    queryKey: ["/api/professors"],
    enabled: isAuthenticated,
    retry: false
  });

  const { data: sortides = [], isLoading: sortidesLoading, error: sortidesError } = useQuery({
    queryKey: ["/api/sortides"],
    enabled: isAuthenticated,
    retry: false
  });

  const { data: comunicacions = [], isLoading: comunicacionsLoading, error: comunicacionsError } = useQuery({
    queryKey: ["/api/comunicacions"],
    enabled: isAuthenticated,
    retry: false
  });

  // Handle authentication errors
  const errors = [guardiesError, assignacionsError, tasquesError, professorsError, sortidesError, comunicacionsError];
  useEffect(() => {
    const authError = errors.find(error => error && isUnauthorizedError(error as Error));
    if (authError) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [errors, toast]);

  // Loading state
  if (authLoading || guardiesLoading || assignacionsLoading || tasquesLoading || professorsLoading || sortidesLoading || comunicacionsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Carregant estadístiques...</p>
        </div>
      </div>
    );
  }

  // Calcular estadístiques reals
  const statsData = {
    totalAssignments: Array.isArray(assignacions) ? assignacions.length : 0,
    activeGuards: Array.isArray(guardies) ? guardies.filter(g => g.estat === 'activa').length : 0,
    pendingTasks: Array.isArray(tasques) ? tasques.filter(t => t.estat === 'pendent').length : 0,
    completedTasks: Array.isArray(tasques) ? tasques.filter(t => t.estat === 'completada').length : 0,
    totalTasks: Array.isArray(tasques) ? tasques.length : 0,
    activeProfessors: Array.isArray(professors) ? professors.length : 0,
    totalSortides: Array.isArray(sortides) ? sortides.length : 0,
    substitutions: Array.isArray(assignacions) ? assignacions.filter(a => a.motiu === 'substitucio').length : 0
  };

  const completionRate = statsData.totalTasks > 0 
    ? Math.round((statsData.completedTasks / statsData.totalTasks) * 100)
    : 0;

  // Càrrega de treball per professor
  const professorWorkload = Array.isArray(professors) && Array.isArray(assignacions) 
    ? professors
        .map(professor => {
          const professorAssignments = assignacions.filter(a => a.professorId === professor.id);
          return {
            professor: `${professor.nom} ${professor.cognoms}`,
            assignments: professorAssignments.length,
            hours: professorAssignments.length * 2
          };
        })
        .filter(p => p.assignments > 0)
        .sort((a, b) => b.assignments - a.assignments)
        .slice(0, 8)
    : [];

  // Distribució de tipus de tasques
  const taskDistribution = Array.isArray(tasques) && tasques.length > 0
    ? [
        { 
          name: "Substitució", 
          value: tasques.filter(t => t.titol?.toLowerCase().includes('substitució') || t.descripcio?.toLowerCase().includes('substitució')).length,
          color: "#00C49F" 
        },
        { 
          name: "Guàrdia", 
          value: tasques.filter(t => t.titol?.toLowerCase().includes('guàrdia') || t.descripcio?.toLowerCase().includes('guàrdia')).length,
          color: "#0088FE" 
        },
        { 
          name: "Sortides", 
          value: tasques.filter(t => t.titol?.toLowerCase().includes('sortida') || t.descripcio?.toLowerCase().includes('sortida')).length,
          color: "#FFBB28" 
        },
        { 
          name: "Altres", 
          value: tasques.filter(t => {
            const text = (t.titol + ' ' + t.descripcio).toLowerCase();
            return !text.includes('substitució') && !text.includes('guàrdia') && !text.includes('sortida');
          }).length,
          color: "#FF8042" 
        }
      ].filter(item => item.value > 0)
    : [{ name: "Sense dades", value: 1, color: "#ccc" }];

  // Evolució mensual de tasques
  const monthlyData = Array.isArray(tasques) && tasques.length > 0
    ? tasques.reduce((acc: any[], tasca) => {
        const date = new Date(tasca.dataCreacio || Date.now());
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('ca-ES', { month: 'short' });
        
        const existing = acc.find(item => item.monthKey === monthKey);
        if (existing) {
          existing.tasks += 1;
          if (tasca.estat === 'completada') existing.completed += 1;
        } else {
          acc.push({ 
            monthKey, 
            month: monthName, 
            tasks: 1, 
            completed: tasca.estat === 'completada' ? 1 : 0,
            assignments: 0
          });
        }
        return acc;
      }, [])
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .slice(-6)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Analítiques de l'Any Acadèmic</h1>
          <p className="text-text-secondary mt-2">
            Estadístiques reals del sistema de gestió de guàrdies
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

      {/* Mètriques Principals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignacions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.substitutions} substitucions incloses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guardies Actives</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.activeGuards}</div>
            <p className="text-xs text-muted-foreground">
              Guardies planificades avui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasques Pendents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.completedTasks} completades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Completesa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Basada en {statsData.totalTasks} tasques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gràfics d'Anàlisi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Càrrega de Treball per Professor */}
        <Card>
          <CardHeader>
            <CardTitle>Càrrega de Treball per Professor</CardTitle>
            <CardDescription>
              Distribució d'assignacions entre el professorat actiu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={professorWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="professor" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assignments" fill="#0088FE" name="Assignacions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribució de Tipus de Tasques */}
        <Card>
          <CardHeader>
            <CardTitle>Distribució de Tipus de Tasques</CardTitle>
            <CardDescription>
              Tipus de tasques creades en l'any actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolució Temporal */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolució de Tasques</CardTitle>
            <CardDescription>
              Creació i completesa de tasques per mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Tasques Creades"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Tasques Completades"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Resum del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Resum del Sistema</CardTitle>
          <CardDescription>
            Estat general del sistema de gestió de guàrdies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statsData.activeProfessors}</div>
              <div className="text-sm text-muted-foreground">Professors Actius</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statsData.totalSortides}</div>
              <div className="text-sm text-muted-foreground">Sortides Planificades</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{statsData.substitutions}</div>
              <div className="text-sm text-muted-foreground">Substitucions Realitzades</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}