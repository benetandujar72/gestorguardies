import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SimplifiedNavigation from "./simplified-navigation";
import TutorialOverlay from "../common/tutorial-overlay";

// NOVA SIDEBAR AMB NAVEGACIÓ SIMPLIFICADA I TUTORIAL INTEGRAT

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResponsiveSidebar({ isOpen, onClose }: SidebarProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState("welcome");

  // Comprovar si és la primera vegada que l'usuari utilitza l'app
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      // Retardar el tutorial una mica perquè l'usuari pugui veure la interfície
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);

  // Tancar sidebar al fer clic en un enllaç en mòbil
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleTutorialStart = (stepId: string) => {
    setTutorialStep(stepId);
    setShowTutorial(true);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  return (
    <>
      {/* Backdrop per mòbil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar amb navegació simplificada */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        id="sidebar"
      >
        {/* Header millorat */}
        <div className="flex h-16 items-center justify-between border-b px-6 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="text-white">
            <h2 className="text-lg font-bold">Sistema de Guardies</h2>
            <p className="text-xs text-blue-100">Gestió Intel·ligent</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="md:hidden text-white hover:bg-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contingut de navegació simplificada */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
          <SimplifiedNavigation 
            onTutorialStart={handleTutorialStart}
            isCompact={false}
          />

          {/* Logout button millorat */}
          <div className="border-t pt-6 mt-6">
            <Button
              variant="outline"
              className="w-full justify-center border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                window.location.href = "/api/logout";
              }}
            >
              Tancar Sessió
            </Button>
          </div>
        </div>
      </div>

      {/* Tutorial overlay */}
      <TutorialOverlay
        isVisible={showTutorial}
        onClose={handleTutorialClose}
        currentStep={tutorialStep}
        onStepChange={setTutorialStep}
      />
    </>
  );
}