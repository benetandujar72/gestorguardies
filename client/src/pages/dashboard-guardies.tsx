import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Plus,
  Zap,
  Star,
  Target,
  Activity
} from "lucide-react";
import { Link } from "wouter";

export default function DashboardGuardiesVisual() {
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

  // Calcular estadístiques amb tipus segurs
  const guardiesArray = Array.isArray(guardies) ? guardies : [];
  const sortidesArray = Array.isArray(sortides) ? sortides : [];
  const workloadArray = Array.isArray(workloadBalance) ? workloadBalance : [];

  const guardiesPendents = guardiesArray.filter((g: any) => g.estat === 'pendent').length;
  const guardiesAssignades = guardiesArray.filter((g: any) => g.estat === 'assignada').length;
  const guardiesCompletades = guardiesArray.filter((g: any) => g.estat === 'completada').length;
  const totalGuardies = guardiesArray.length;

  const sortidesPlanificades = sortidesArray.filter((s: any) => new Date(s.dataInici) > new Date()).length;
  const sortidesAvui = sortidesArray.filter((s: any) => {
    const avui = new Date().toISOString().split('T')[0];
    const sortidaData = new Date(s.dataInici).toISOString().split('T')[0];
    return sortidaData === avui;
  }).length;

  // Mètriques principals amb colors atractius
  const metriques = [
    {
      title: "Guardies Pendents",
      value: guardiesPendents,
      description: "Guardies sense assignar",
      icon: AlertTriangle,
      colorClass: "text-amber-600",
      bgGradient: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-100",
      trend: guardiesPendents > 0 ? "Requereix atenció" : "Tot assignat"
    },
    {
      title: "Guardies Assignades",
      value: guardiesAssignades,
      description: "Guardies amb professor assignat",
      icon: CheckCircle,
      colorClass: "text-emerald-600",
      bgGradient: "from-emerald-400 to-green-500",
      iconBg: "bg-emerald-100",
      trend: `${totalGuardies > 0 ? Math.round((guardiesAssignades / totalGuardies) * 100) : 0}% del total`
    },
    {
      title: "Sortides Avui",
      value: sortidesAvui,
      description: "Sortides planificades per avui",
      icon: Calendar,
      colorClass: "text-blue-600",
      bgGradient: "from-blue-400 to-cyan-500",
      iconBg: "bg-blue-100",
      trend: sortidesPlanificades > 0 ? `${sortidesPlanificades} més planificades` : "Cap sortida planificada"
    },
    {
      title: "Professors Actius",
      value: workloadArray.length,
      description: "Professors amb assignacions",
      icon: Users,
      colorClass: "text-violet-600",
      bgGradient: "from-violet-400 to-purple-500",
      iconBg: "bg-violet-100",
      trend: "Sistema equilibrat"
    }
  ];

  // Calcular equilibri de càrrega
  const equilibriCarrega = workloadArray.length > 0 
    ? workloadArray.reduce((acc: number, p: any) => acc + (p.guardCount || 0), 0) / workloadArray.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header amb gradient atractiu */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
          </div>
          <div className="relative flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Centre de Control</h1>
                  <p className="text-blue-100 text-lg">
                    Gestió intel·ligent de guardies i substitucions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Link href="/guardies">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Guardia
                </Link>
              </Button>
              <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                <Link href="/sortides-substitucions">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Gestionar Substitucions
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mètriques principals amb disseny colorit */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metriques.map((metrica, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`absolute inset-0 bg-gradient-to-br ${metrica.bgGradient} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {metrica.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metrica.iconBg}`}>
                  <metrica.icon className={`h-5 w-5 ${metrica.colorClass}`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gray-800 mb-1">{metrica.value}</div>
                <p className="text-xs text-gray-600 mb-2">
                  {metrica.description}
                </p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${Number(metrica.value) > 0 ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
                  <p className="text-xs text-gray-500 font-medium">
                    {metrica.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contingut principal amb pestanyes colorides */}
        <Tabs defaultValue="assignacions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="assignacions" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium">
              <Shield className="h-4 w-4 mr-2" />
              Assignacions
            </TabsTrigger>
            <TabsTrigger value="substitucions" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white font-medium">
              <UserCheck className="h-4 w-4 mr-2" />
              Substitucions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-medium">
              <BarChart3 className="h-4 w-4 mr-2" />
              Anàlisi
            </TabsTrigger>
            <TabsTrigger value="gestio" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white font-medium">
              <Settings className="h-4 w-4 mr-2" />
              Gestió
            </TabsTrigger>
          </TabsList>

          {/* Pestanya Assignacions amb targetes colorides */}
          <TabsContent value="assignacions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Guardies Pendents d'Assignació
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Guardies que necessiten professor assignat
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {guardiesPendents > 0 ? (
                    <div className="space-y-3">
                      {guardiesArray
                        .filter((g: any) => g.estat === 'pendent')
                        .slice(0, 5)
                        .map((guardia: any) => (
                          <div key={guardia.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                            <div>
                              <p className="font-medium text-gray-800">{guardia.data} - {guardia.horaInici}</p>
                              <p className="text-sm text-gray-600">{guardia.tipusGuardia} - {guardia.lloc}</p>
                            </div>
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" asChild>
                              <Link href={`/assignacions?guardia=${guardia.id}`}>
                                Assignar
                              </Link>
                            </Button>
                          </div>
                        ))}
                      {guardiesPendents > 5 && (
                        <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50" asChild>
                          <Link href="/assignacions">
                            Veure totes ({guardiesPendents})
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Totes les guardies estan assignades</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendari Setmanal
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    Vista ràpida de guardies assignades
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {[
                      { dia: "Dilluns", dia_num: 1, color: "bg-blue-100 text-blue-800" },
                      { dia: "Dimarts", dia_num: 2, color: "bg-purple-100 text-purple-800" },
                      { dia: "Dimecres", dia_num: 3, color: "bg-emerald-100 text-emerald-800" },
                      { dia: "Dijous", dia_num: 4, color: "bg-amber-100 text-amber-800" },
                      { dia: "Divendres", dia_num: 5, color: "bg-pink-100 text-pink-800" }
                    ].map((diaInfo) => (
                      <div key={diaInfo.dia} className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{diaInfo.dia}</span>
                        <Badge className={diaInfo.color}>
                          {guardiesArray.filter((g: any) => new Date(g.data).getDay() === diaInfo.dia_num).length} guardies
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-emerald-300 text-emerald-600 hover:bg-emerald-50" asChild>
                    <Link href="/calendari-guardies">
                      Veure calendari complet
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Altres pestanyes amb disseny similar... */}
          <TabsContent value="substitucions" className="space-y-6">
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Gestió de Substitucions</h3>
              <p className="text-gray-600 mb-6">Planifica substitucions per sortides de manera intel·ligent</p>
              <Button asChild className="bg-purple-500 hover:bg-purple-600">
                <Link href="/sortides-substitucions">
                  Accedir a Substitucions
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Anàlisi de Rendiment</h3>
              <p className="text-gray-600 mb-6">Visualitza mètriques i estadístiques del sistema</p>
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
                <Link href="/analytics">
                  Veure Anàlisi Complet
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gestio" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Gestió Bàsica", items: [
                  { href: "/professors", label: "Professors", icon: Users },
                  { href: "/grups", label: "Grups", icon: Users },
                  { href: "/aules", label: "Aules", icon: Settings }
                ]},
                { title: "Horaris i Planificació", items: [
                  { href: "/horaris", label: "Horaris", icon: Calendar },
                  { href: "/guardies", label: "Guardies", icon: Shield },
                  { href: "/sortides", label: "Sortides", icon: Calendar }
                ]},
                { title: "Eines i Configuració", items: [
                  { href: "/comunicacions", label: "Comunicacions", icon: Users },
                  { href: "/tasques", label: "Tasques", icon: Settings },
                  { href: "/import-csv", label: "Importar Dades", icon: Settings }
                ]}
              ].map((seccion, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-amber-700">{seccion.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {seccion.items.map((item) => (
                      <Button key={item.href} variant="outline" className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200 shadow-sm hover:shadow-md" asChild>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}