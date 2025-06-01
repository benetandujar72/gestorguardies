import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  UserCheck,
  BarChart3,
  Settings,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface MetricCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

export default function DashboardGuardies() {
  const [selectedPeriod, setSelectedPeriod] = useState("setmana");

  // Consultes per obtenir dades del dashboard
  const { data: guardies = [] } = useQuery({
    queryKey: ['/api/guardies']
  });

  const { data: sortides = [] } = useQuery({
    queryKey: ['/api/sortides']
  });

  const { data: workloadBalance = [] } = useQuery({
    queryKey: ['/api/analytics/workload-balance']
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics']
  });

  // Calcular estadístiques
  const guardiesPendents = guardies.filter((g: any) => g.estat === 'pendent').length;
  const guardiesAssignades = guardies.filter((g: any) => g.estat === 'assignada').length;
  const guardiesCompletades = guardies.filter((g: any) => g.estat === 'completada').length;
  const totalGuardies = guardies.length;

  const sortidesPlanificades = sortides.filter((s: any) => new Date(s.dataInici) > new Date()).length;
  const sortidesAvui = sortides.filter((s: any) => {
    const avui = new Date().toISOString().split('T')[0];
    const sortidaData = new Date(s.dataInici).toISOString().split('T')[0];
    return sortidaData === avui;
  }).length;

  // Mètriques principals
  const metriques: MetricCard[] = [
    {
      title: "Guardies Pendents",
      value: guardiesPendents,
      description: "Guardies sense assignar",
      icon: AlertTriangle,
      color: "text-orange-600",
      trend: guardiesPendents > 0 ? "Requereix atenció" : "Tot assignat"
    },
    {
      title: "Guardies Assignades",
      value: guardiesAssignades,
      description: "Guardies amb professor assignat",
      icon: CheckCircle,
      color: "text-green-600",
      trend: `${totalGuardies > 0 ? Math.round((guardiesAssignades / totalGuardies) * 100) : 0}% del total`
    },
    {
      title: "Sortides Avui",
      value: sortidesAvui,
      description: "Sortides planificades per avui",
      icon: Calendar,
      color: "text-blue-600",
      trend: sortidesPlanificades > 0 ? `${sortidesPlanificades} més planificades` : "Cap sortida planificada"
    },
    {
      title: "Professors Actius",
      value: workloadBalance.length,
      description: "Professors amb assignacions",
      icon: Users,
      color: "text-purple-600",
      trend: "Sistema equilibrat"
    }
  ];

  // Calcular equilibri de càrrega
  const equilibriCarrega = workloadBalance.length > 0 
    ? workloadBalance.reduce((acc: number, p: any) => acc + (p.guardCount || 0), 0) / workloadBalance.length 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centre de Control de Guardies</h1>
          <p className="text-muted-foreground">
            Gestió integral d'assignacions, substitucions i anàlisi de rendiment
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/guardies">
              <Plus className="h-4 w-4 mr-2" />
              Nova Guardia
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sortides-substitucions">
              <UserCheck className="h-4 w-4 mr-2" />
              Gestionar Substitucions
            </Link>
          </Button>
        </div>
      </div>

      {/* Mètriques principals */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metriques.map((metrica, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metrica.title}
              </CardTitle>
              <metrica.icon className={`h-4 w-4 ${metrica.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrica.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrica.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {metrica.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contingut principal amb pestanyes */}
      <Tabs defaultValue="assignacions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignacions">Assignacions</TabsTrigger>
          <TabsTrigger value="substitucions">Substitucions</TabsTrigger>
          <TabsTrigger value="analytics">Anàlisi</TabsTrigger>
          <TabsTrigger value="gestio">Gestió</TabsTrigger>
        </TabsList>

        {/* Pestanya Assignacions */}
        <TabsContent value="assignacions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Guardies Pendents d'Assignació
                </CardTitle>
                <CardDescription>
                  Guardies que necessiten professor assignat
                </CardDescription>
              </CardHeader>
              <CardContent>
                {guardiesPendents > 0 ? (
                  <div className="space-y-2">
                    {guardies
                      .filter((g: any) => g.estat === 'pendent')
                      .slice(0, 5)
                      .map((guardia: any) => (
                        <div key={guardia.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium">{guardia.data} - {guardia.horaInici}</p>
                            <p className="text-sm text-muted-foreground">{guardia.tipusGuardia} - {guardia.lloc}</p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/assignacions?guardia=${guardia.id}`}>
                              Assignar
                            </Link>
                          </Button>
                        </div>
                      ))}
                    {guardiesPendents > 5 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/assignacions">
                          Veure totes ({guardiesPendents})
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Totes les guardies estan assignades</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendari Setmanal
                </CardTitle>
                <CardDescription>
                  Vista ràpida de guardies assignades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dilluns</span>
                    <Badge variant="outline">
                      {guardies.filter((g: any) => new Date(g.data).getDay() === 1).length} guardies
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dimarts</span>
                    <Badge variant="outline">
                      {guardies.filter((g: any) => new Date(g.data).getDay() === 2).length} guardies
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dimecres</span>
                    <Badge variant="outline">
                      {guardies.filter((g: any) => new Date(g.data).getDay() === 3).length} guardies
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dijous</span>
                    <Badge variant="outline">
                      {guardies.filter((g: any) => new Date(g.data).getDay() === 4).length} guardies
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Divendres</span>
                    <Badge variant="outline">
                      {guardies.filter((g: any) => new Date(g.data).getDay() === 5).length} guardies
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/calendari-guardies">
                    Veure calendari complet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestanya Substitucions */}
        <TabsContent value="substitucions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Sortides amb Substitucions
                </CardTitle>
                <CardDescription>
                  Gestió de substitucions per sortides planificades
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortidesPlanificades > 0 ? (
                  <div className="space-y-2">
                    {sortides
                      .filter((s: any) => new Date(s.dataInici) > new Date())
                      .slice(0, 3)
                      .map((sortida: any) => (
                        <div key={sortida.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium">{sortida.nomSortida}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sortida.dataInici).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/sortides-substitucions?sortida=${sortida.id}`}>
                              Gestionar
                            </Link>
                          </Button>
                        </div>
                      ))}
                    <Button variant="outline" className="w-full mt-2" asChild>
                      <Link href="/sortides-substitucions">
                        Veure totes les sortides
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No hi ha sortides planificades</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Substitucions Recents
                </CardTitle>
                <CardDescription>
                  Últimes substitucions generades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hi ha substitucions recents</p>
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href="/sortides-substitucions">
                      Crear substitucions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestanya Anàlisi */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Equilibri de Càrrega
                </CardTitle>
                <CardDescription>
                  Distribució de guardies entre professors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Mitjana de guardies per professor</span>
                      <span>{equilibriCarrega.toFixed(1)}</span>
                    </div>
                    <Progress value={Math.min(equilibriCarrega * 10, 100)} className="mt-2" />
                  </div>
                  {workloadBalance.slice(0, 5).map((professor: any) => (
                    <div key={professor.professorId} className="flex justify-between items-center">
                      <span className="text-sm">{professor.professorName || `Professor ${professor.professorId}`}</span>
                      <Badge variant="outline">{professor.guardCount || 0} guardies</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/analytics/workload-balance">
                      Anàlisi detallat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rendiment del Sistema
                </CardTitle>
                <CardDescription>
                  Mètriques de productivitat i eficiència
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa d'assignació</span>
                    <span className="font-medium">
                      {totalGuardies > 0 ? Math.round(((totalGuardies - guardiesPendents) / totalGuardies) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Guardies completades</span>
                    <span className="font-medium">{guardiesCompletades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sortides planificades</span>
                    <span className="font-medium">{sortidesPlanificades}</span>
                  </div>
                  <Progress 
                    value={totalGuardies > 0 ? ((totalGuardies - guardiesPendents) / totalGuardies) * 100 : 0} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestanya Gestió */}
        <TabsContent value="gestio" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gestió Bàsica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/professors">
                    <Users className="h-4 w-4 mr-2" />
                    Gestionar Professors
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/grups">
                    <Users className="h-4 w-4 mr-2" />
                    Gestionar Grups
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/aules">
                    <Settings className="h-4 w-4 mr-2" />
                    Gestionar Aules
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/materies">
                    <Settings className="h-4 w-4 mr-2" />
                    Gestionar Matèries
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Horaris i Planificació
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/horaris">
                    <Calendar className="h-4 w-4 mr-2" />
                    Gestionar Horaris
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/guardies">
                    <Shield className="h-4 w-4 mr-2" />
                    Gestionar Guardies
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/sortides">
                    <Calendar className="h-4 w-4 mr-2" />
                    Gestionar Sortides
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/calendari-guardies">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendari General
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Anàlisi i Informes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/comunicacions">
                    <Users className="h-4 w-4 mr-2" />
                    Comunicacions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/tasques">
                    <Settings className="h-4 w-4 mr-2" />
                    Gestionar Tasques
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/import-csv">
                    <Settings className="h-4 w-4 mr-2" />
                    Importar Dades
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/anys-academics">
                    <Calendar className="h-4 w-4 mr-2" />
                    Anys Acadèmics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}