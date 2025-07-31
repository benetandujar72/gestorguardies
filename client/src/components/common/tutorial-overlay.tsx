import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Check, Play, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: string;
  image?: string;
  nextStep?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Benvingut al Sistema de Guardies",
    description: "T'ensenyarem com utilitzar l'aplicació pas a pas. No necessites experiència prèvia!",
    action: "Començar tutorial"
  },
  {
    id: "navigation",
    title: "Navegació Principal",
    description: "Utilitza el menú lateral per accedir a les diferents seccions. Tot està organitzat de forma lògica.",
    target: "sidebar",
    nextStep: "dashboard"
  },
  {
    id: "dashboard",
    title: "Tauler Principal",
    description: "Aquí veuràs un resum de tota l'activitat: guardies pendents, assignacions recents i estadístiques.",
    target: "dashboard",
    nextStep: "guards-system"
  },
  {
    id: "guards-system",
    title: "Sistema de Guardies",
    description: "La funcionalitat principal. Pots veure, assignar i gestionar totes les guardies des d'aquí.",
    target: "guards-link",
    nextStep: "auto-assign"
  },
  {
    id: "auto-assign",
    title: "Assignació Automàtica",
    description: "Fes clic a 'Assignar amb IA' per que el sistema assigni automàticament el millor professor disponible.",
    target: "auto-assign-btn",
    nextStep: "manual-assign"
  },
  {
    id: "manual-assign",
    title: "Assignació Manual",
    description: "Si prefereixes triar tu mateix, utilitza 'Assignar Manual' per seleccionar un professor específic.",
    target: "manual-assign-btn",
    nextStep: "calendar"
  },
  {
    id: "calendar",
    title: "Calendari de Guardies",
    description: "Canvia la data per veure les guardies de diferents dies. Tot està organitzat cronològicament.",
    target: "date-picker",
    nextStep: "professors"
  },
  {
    id: "professors",
    title: "Gestió de Professors",
    description: "Aquí pots veure i gestionar la informació de tots els professors del centre.",
    target: "professors-link",
    nextStep: "completed"
  },
  {
    id: "completed",
    title: "Tutorial Completat!",
    description: "Ja estàs llest per utilitzar l'aplicació. Recorda que sempre pots tornar a veure aquest tutorial.",
    action: "Finalitzar"
  }
];

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  currentStep?: string;
  onStepChange?: (stepId: string) => void;
}

export default function TutorialOverlay({ 
  isVisible, 
  onClose, 
  currentStep = "welcome",
  onStepChange 
}: TutorialOverlayProps) {
  const [step, setStep] = useState(currentStep);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Comprovar si és la primera vegada que l'usuari utilitza l'app
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setIsFirstTime(true);
    }
  }, []);

  const currentStepData = TUTORIAL_STEPS.find(s => s.id === step);
  const currentStepIndex = TUTORIAL_STEPS.findIndex(s => s.id === step);
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    if (currentStepData?.nextStep) {
      const nextStep = currentStepData.nextStep;
      setStep(nextStep);
      onStepChange?.(nextStep);
    } else if (isLastStep) {
      localStorage.setItem('hasSeenTutorial', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = TUTORIAL_STEPS[currentStepIndex - 1].id;
      setStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    onClose();
  };

  if (!isVisible || !currentStepData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Tutorial card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md mx-4"
          >
            <Card className="border-2 border-primary shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      Pas {currentStepIndex + 1} de {TUTORIAL_STEPS.length}
                    </Badge>
                    {isFirstTime && (
                      <Badge variant="outline" className="text-xs">
                        Primera vegada
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription className="text-base">
                  {currentStepData.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-primary h-2 rounded-full"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </Button>

                  <div className="flex space-x-2">
                    {!isLastStep && (
                      <Button variant="ghost" onClick={handleSkip} size="sm">
                        Saltar tutorial
                      </Button>
                    )}
                    
                    <Button onClick={handleNext} className="flex items-center space-x-1">
                      {isLastStep ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Finalitzar</span>
                        </>
                      ) : currentStepData.action ? (
                        <>
                          <Play className="h-4 w-4" />
                          <span>{currentStepData.action}</span>
                        </>
                      ) : (
                        <>
                          <span>Següent</span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Additional actions */}
                {currentStepData.target && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Busca l'element destacat a la pantalla
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}