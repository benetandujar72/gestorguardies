import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Shield, 
  Users, 
  Calendar, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  MessageSquare,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// NAVEGACIÓ SIMPLIFICADA I INTUÏTIVA
// Organitzada per flux de treball i prioritat d'ús

interface NavSection {
  id: string;
  title: string;
  description: string;
  items: NavItem[];
  priority: 'high' | 'medium' | 'low';
  expanded?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  description: string;
  badge?: string;
  isNew?: boolean;
  tutorial?: string;
}

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: "main",
    title: "Inici",
    description: "Visió general i accés ràpid",
    priority: "high",
    expanded: true,
    items: [
      {
        href: "/",
        label: "Tauler Principal",
        icon: Home,
        description: "Resum general de l'activitat"
      }
    ]
  },
  {
    id: "guards",
    title: "Guardies",
    description: "Gestió completa de guardies",
    priority: "high",
    expanded: true,
    items: [
      {
        href: "/sistema-guardies-unificat",
        label: "Sistema Unificat",
        icon: Shield,
        description: "Gestió completa de guardies amb IA",
        badge: "Principal",
        isNew: true,
        tutorial: "guards-system"
      },
      {
        href: "/calendari-guardies",
        label: "Calendari",
        icon: Calendar,
        description: "Vista de calendari de guardies",
        tutorial: "calendar"
      }
    ]
  },
  {
    id: "management",
    title: "Gestió",
    description: "Professors, alumnes i recursos",
    priority: "medium",
    expanded: false,
    items: [
      {
        href: "/professors",
        label: "Professors",
        icon: Users,
        description: "Gestió del professorat",
        tutorial: "professors"
      },
      {
        href: "/alumnes",
        label: "Alumnes",
        icon: Users,
        description: "Gestió d'estudiants"
      },
      {
        href: "/horaris",
        label: "Horaris",
        icon: Calendar,
        description: "Gestió d'horaris i assignatures"
      },
      {
        href: "/sortides",
        label: "Sortides",
        icon: FileText,
        description: "Gestió de sortides i substitucions"
      }
    ]
  },
  {
    id: "tools",
    title: "Eines",
    description: "Analytics i comunicació",
    priority: "medium",
    expanded: false,
    items: [
      {
        href: "/analytics-real",
        label: "Analytics",
        icon: TrendingUp,
        description: "Estadístiques i informes"
      },
      {
        href: "/ai-chat",
        label: "Assistent IA",
        icon: Sparkles,
        description: "Chatbot intel·ligent"
      },
      {
        href: "/comunicacions",
        label: "Comunicacions",
        icon: MessageSquare,
        description: "Missatges i notificacions"
      }
    ]
  },
  {
    id: "admin",
    title: "Administració",
    description: "Configuració i eines avançades",
    priority: "low",
    expanded: false,
    items: [
      {
        href: "/anys-academics",
        label: "Anys Acadèmics",
        icon: Settings,
        description: "Gestió d'anys acadèmics"
      },
      {
        href: "/import-csv",
        label: "Importar Dades",
        icon: FileText,
        description: "Importació de fitxers CSV"
      },
      {
        href: "/gmail-config",
        label: "Configurar Email",
        icon: Settings,
        description: "Configuració de Gmail"
      }
    ]
  }
];

interface SimplifiedNavigationProps {
  onTutorialStart?: (stepId: string) => void;
  isCompact?: boolean;
}

export default function SimplifiedNavigation({ 
  onTutorialStart, 
  isCompact = false 
}: SimplifiedNavigationProps) {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    NAVIGATION_SECTIONS.filter(s => s.expanded).map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.tutorial && onTutorialStart) {
      onTutorialStart(item.tutorial);
    }
  };

  if (isCompact) {
    // Vista compacta per mòbil
    return (
      <div className="space-y-2">
        {NAVIGATION_SECTIONS.map(section => (
          <div key={section.id}>
            {section.items.map(item => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => handleItemClick(item)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.isNew && <Badge variant="secondary" className="ml-2 text-xs">Nou</Badge>}
                </Button>
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Vista completa per desktop
  return (
    <div className="space-y-4">
      {/* Botó d'ajuda sempre visible */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <Button 
            onClick={() => onTutorialStart?.('welcome')}
            className="w-full flex items-center space-x-2"
            variant="outline"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Tutorial pas a pas</span>
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Aprèn a utilitzar l'aplicació
          </p>
        </CardContent>
      </Card>

      {/* Seccions de navegació */}
      {NAVIGATION_SECTIONS.map(section => {
        const isExpanded = expandedSections.includes(section.id);
        const shouldShowExpanded = section.priority === 'high' || isExpanded;

        return (
          <div key={section.id}>
            <Button
              variant="ghost"
              onClick={() => toggleSection(section.id)}
              className="w-full justify-between mb-2 h-auto p-3"
            >
              <div className="text-left">
                <div className="font-medium text-sm">{section.title}</div>
                {!isCompact && (
                  <div className="text-xs text-muted-foreground">
                    {section.description}
                  </div>
                )}
              </div>
              {section.priority !== 'high' && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {shouldShowExpanded && (
              <div className="space-y-1 ml-2 border-l-2 border-gray-200 pl-4">
                {section.items.map(item => (
                  <Link key={item.href} href={item.href}>
                    <div
                      id={item.tutorial ? `${item.tutorial}-link` : undefined}
                      className={cn(
                        "group flex items-center space-x-3 rounded-lg p-3 text-sm transition-colors cursor-pointer",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-gray-100"
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {item.isNew && (
                            <Badge variant="default" className="text-xs">
                              Nou
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}