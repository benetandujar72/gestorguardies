import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Benvingut al Sistema de Guardies",
    description: "T'ensenyarem com utilitzar l'aplicació pas a pas."
  },
  {
    id: "navigation",
    title: "Navegació",
    description: "Utilitza el menú lateral per accedir a les diferents seccions."
  },
  {
    id: "guards",
    title: "Sistema de Guardies",
    description: "Pots assignar guardies de forma manual o automàtica amb IA."
  },
  {
    id: "completed",
    title: "Tutorial Completat!",
    description: "Ja estàs llest per utilitzar l'aplicació."
  }
];

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  currentStep?: string;
}

export default function TutorialOverlaySimple({ 
  isVisible, 
  onClose, 
  currentStep = "welcome"
}: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  
  const currentStepData = TUTORIAL_STEPS[stepIndex];
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('hasSeenTutorial', 'true');
      onClose();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    onClose();
  };

  if (!isVisible) return null;

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
                  <Badge variant="secondary" className="text-xs">
                    Pas {stepIndex + 1} de {TUTORIAL_STEPS.length}
                  </Badge>
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
                    animate={{ width: `${((stepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
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
                        Saltar
                      </Button>
                    )}
                    
                    <Button onClick={handleNext} className="flex items-center space-x-1">
                      {isLastStep ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Finalitzar</span>
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
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}