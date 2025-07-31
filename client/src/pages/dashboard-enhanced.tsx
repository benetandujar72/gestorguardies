import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Shield, Clock, AlertCircle, CheckCircle, ArrowRight, Sparkles, HelpCircle, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { Link } from "wouter";
import TutorialOverlaySimple from "@/components/common/tutorial-overlay-simple";
import { motion } from "framer-motion";

// DASHBOARD ENHANCED AMB TUTORIAL INTEGRAT I UX MILLORADA

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  badge?: string;
  tutorialStep?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Sistema de Guardies",
    description: "Gestió completa amb IA",
    href: "/sistema-guardies-unificat",
    icon: Shield,
    color: "bg-blue-500",
    badge: "Principal",
    tutorialStep: "guards-system"
  },
  {
    title: "Professors",
    description: "Gestionar professorat",
    href: "/professors",
    icon: Users,
    color: "bg-green-500",
    tutorialStep: "professors"
  },
  {
    title: "Calendari",
    description: "Vista de guardies",
    href: "/calendari-guardies",
    icon: Calendar,
    color: "bg-purple-500",
    tutorialStep: "calendar"
  },
  {
    title: "Analytics",
    description: "Estadístiques i informes",
    href: "/analytics-real",
    icon: TrendingUp,
    color: "bg-orange-500"
  }
];

export default function DashboardEnhanced() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState("welcome");

  // Queries per obtenir dades
  const { data: guardies = [], isLoading: guardiesLoading } = useQuery({
    queryKey: ['/api/guardies'],
  });

  const { data: assignacions = [], isLoading: assignacionsLoading } = useQuery({
    queryKey: ['/api/assignacions-guardia'],
  });

  const { data: professors = [], isLoading: professorsLoading } = useQuery({
    queryKey: ['/api/professors'],
  });

  // Comprovar si és la primera vegada
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 2000);
    }
  }, []);

  // Calcular estadístiques amb tipus segurs
  const guardiesArray = Array.isArray(guardies) ? guardies : [];
  const professorsArray = Array.isArray(professors) ? professors : [];
  
  const guardiesPendents = guardiesArray.filter((g: any) => g.estat === 'Pendent' || g.estat === 'pendent').length;
  const guardiesAssignades = guardiesArray.filter((g: any) => g.estat === 'assignada').length;
  const totalGuardies = guardiesArray.length;
  const percentatgeAssignat = totalGuardies > 0 ? Math.round((guardiesAssignades / totalGuardies) * 100) : 0;

  const handleTutorialStart = (stepId: string = "welcome") => {
    setTutorialStep(stepId);
    setShowTutorial(true);
  };

  const handleQuickActionClick = (action: QuickAction) => {
    if (action.tutorialStep) {
      handleTutorialStart(action.tutorialStep);
    }
  };

  return (
    <div className="space-y-8 p-6" id="dashboard">
      {/* Header amb benvinguda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Benvingut al Sistema de Guardies
        </h1>
        <p className="text-xl text-muted-foreground">
          Gestió intel·ligent i simplificada per al teu centre educatiu
        </p>
        
        {/* Botó de tutorial sempre visible */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => handleTutorialStart()}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Tutorial pas a pas</span>
          </Button>
          <Link href="/sistema-guardies-unificat">
            <Button className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Començar ara</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Estadístiques principals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Guardies Pendents</p>
                <p className="text-3xl font-bold">{guardiesPendents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Guardies Assignades</p>
                <p className="text-3xl font-bold">{guardiesAssignades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Professors</p>
                <p className="text-3xl font-bold">{professorsArray.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">% Assignat</p>
                <p className="text-3xl font-bold">{percentatgeAssignat}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Accions ràpides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Accions Ràpides</span>
            </CardTitle>
            <CardDescription>
              Accedeix directament a les funcionalitats principals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map((action, index) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={action.href}>
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
                      onClick={() => handleQuickActionClick(action)}
                    >
                      <CardContent className="p-6 text-center space-y-4">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${action.color} text-white`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                          {action.badge && (
                            <Badge variant="secondary" className="mt-2">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resum d'activitat recent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Guardies d'Avui</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guardiesArray.slice(0, 3).map((guardia: any) => (
                <div key={guardia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{guardia.tipusGuardia}</p>
                    <p className="text-sm text-muted-foreground">
                      {guardia.horaInici} - {guardia.horaFi}
                    </p>
                  </div>
                  <Badge variant={guardia.estat === 'assignada' ? 'default' : 'secondary'}>
                    {guardia.estat}
                  </Badge>
                </div>
              ))}
              {guardiesArray.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No hi ha guardies programades per avui
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Propers Passos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guardiesPendents > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800">Assignar Guardies Pendents</p>
                  <p className="text-sm text-yellow-600">
                    Tens {guardiesPendents} guardies pendents d'assignar
                  </p>
                  <Link href="/sistema-guardies-unificat">
                    <Button size="sm" className="mt-2">
                      Assignar ara
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">Explorar el Sistema</p>
                <p className="text-sm text-blue-600">
                  Descobreix totes les funcionalitats amb el tutorial
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => handleTutorialStart()}
                >
                  Començar tutorial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tutorial overlay */}
      <TutorialOverlaySimple
        isVisible={showTutorial}
        onClose={() => setShowTutorial(false)}
        currentStep={tutorialStep}
      />
    </div>
  );
}