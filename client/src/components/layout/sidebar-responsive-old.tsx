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
  const [location] = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isGestioOpen, setIsGestioOpen] = useState(true);

  // Tancar sidebar al fer clic en un enllaç en mòbil
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Evitar scroll del body quan la sidebar està oberta en mòbil
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <>
      {/* Overlay per mòbil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out h-full",
        "md:translate-x-0 md:h-[calc(100vh-64px)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header amb logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <img 
              src="/src/assets/bitacola-logo.svg" 
              alt="Bitàcola" 
              className="w-32 h-auto"
            />
            {/* Botó tancar per mòbil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="mt-4 px-4 overflow-y-auto h-full pb-4">
          {/* Secció Principal */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Principal
            </h3>
            <ul className="space-y-1">
              {principalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-blue-50 text-primary font-medium"
                          : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                      )}
                      onClick={handleLinkClick}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Secció Gestió */}
          <div className="mb-6">
            <Collapsible open={isGestioOpen} onOpenChange={setIsGestioOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-text-primary">
                Gestió Detallada
                <ChevronDown className={cn("h-3 w-3 transition-transform", isGestioOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-1">
                  {gestioItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm",
                            isActive(item.href)
                              ? "bg-blue-50 text-primary font-medium"
                              : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                          )}
                          onClick={handleLinkClick}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Secció Administració */}
          <div className="mb-6">
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-text-primary">
                Eines Administració
                <ChevronDown className={cn("h-3 w-3 transition-transform", isAdminOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-1">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm",
                            isActive(item.href)
                              ? "bg-blue-50 text-primary font-medium"
                              : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                          )}
                          onClick={handleLinkClick}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </nav>
      </aside>
    </>
  );
}