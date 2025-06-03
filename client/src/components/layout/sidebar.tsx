import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  DoorOpen,
  CloudUpload,
  Bot,
  Route,
  School,
  Shield,
  ListTodo,
  Users,
  UserCheck,
  Presentation,
  UsersIcon,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

// Seccions principals organitzades
const principalItems = [
  {
    href: "/dashboard-guardies",
    label: "Centre de Control",
    icon: Shield,
  },
  {
    href: "/calendari-guardies",
    label: "Calendari General",
    icon: Calendar,
  },
  {
    href: "/sortides-substitucions",
    label: "Substitucions",
    icon: UserCheck,
  },
];

// Gestió detallada (funcions específiques)
const gestioItems = [
  {
    href: "/guardies",
    label: "Gestió de Guardies",
    icon: Shield,
  },
  {
    href: "/assignacions",
    label: "Assignar Guardies",
    icon: Users,
  },
  {
    href: "/sortides",
    label: "Gestió de Sortides",
    icon: Route,
  },
  {
    href: "/horaris",
    label: "Horaris",
    icon: Calendar,
  },
  {
    href: "/comunicacions",
    label: "Comunicacions",
    icon: MessageSquare,
  },
  {
    href: "/tasques",
    label: "Tasques",
    icon: ListTodo,
  },
];

const administrationItems = [
  {
    href: "/professors",
    label: "Professors",
    icon: Presentation,
  },
  {
    href: "/grups",
    label: "Grups",
    icon: UsersIcon,
  },
  {
    href: "/alumnes",
    label: "Alumnes",
    icon: Users,
  },
  {
    href: "/aules",
    label: "Aules",
    icon: DoorOpen,
  },
  {
    href: "/materies",
    label: "Matèries",
    icon: BarChart3,
  },
  {
    href: "/anys-academics",
    label: "Anys Acadèmics",
    icon: Calendar,
  },
];

const toolsItems = [
  {
    href: "/analytics",
    label: "Anàlisi",
    icon: BarChart3,
  },
  {
    href: "/chat-bot",
    label: "Chat d'Ajuda IA",
    icon: Bot,
  },
  {
    href: "/import-csv",
    label: "Importar CSV",
    icon: CloudUpload,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(true);
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
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/src/assets/bitacola-logo.svg" 
            alt="Bitàcola" 
            className="w-40 h-auto"
          />
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
                  <Link href={item.href}>
                    <a
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
                    </a>
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
                      <Link href={item.href}>
                        <a
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                            isActive(item.href)
                              ? "bg-blue-50 text-primary font-medium"
                              : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Administration Section */}
        <div className="mb-6">
          <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-text-primary">
              Administració
              <ChevronDown className={cn("h-3 w-3 transition-transform", isAdminOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1">
                {administrationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                            isActive(item.href)
                              ? "bg-blue-50 text-primary font-medium"
                              : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Tools Section */}
        <div>
          <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-text-primary">
              Eines
              <ChevronDown className={cn("h-3 w-3 transition-transform", isToolsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1">
                {toolsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                            isActive(item.href)
                              ? "bg-blue-50 text-primary font-medium"
                              : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
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