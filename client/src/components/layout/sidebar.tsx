import { useState } from "react";
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
  Presentation,
  UsersIcon,
  MessageSquare,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  {
    href: "/",
    label: "Tauler de Control",
    icon: BarChart3,
  },
  {
    href: "/guardies",
    label: "Guardies",
    icon: Shield,
  },
  {
    href: "/assignacions",
    label: "Assignacions",
    icon: Users,
  },
  {
    href: "/guardies-assignades",
    label: "Guardies Assignades",
    icon: Shield,
  },
  {
    href: "/comunicacions",
    label: "Comunicacions",
    icon: MessageSquare,
  },
  {
    href: "/anys-academics",
    label: "Anys Acadèmics",
    icon: Calendar,
  },
  {
    href: "/horaris",
    label: "Horaris",
    icon: Calendar,
  },
  {
    href: "/sortides",
    label: "Sortides",
    icon: Route,
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
    href: "/aules",
    label: "Aules",
    icon: DoorOpen,
  },
];

const toolsItems = [
  {
    href: "/analytics",
    label: "Analítiques",
    icon: BarChart3,
  },
  {
    href: "/chat-bot",
    label: "Chat d'Ajuda IA",
    icon: Bot,
  },
  {
    href: "/import",
    label: "Importar CSV",
    icon: CloudUpload,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex-shrink-0 h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <School className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-text-primary">Centre Educatiu</h2>
            <p className="text-xs text-text-secondary">IES Sant Jordi</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 px-4 overflow-y-auto h-full pb-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
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

          {/* Administration Section */}
          <li className="pt-4">
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 pb-2 hover:text-text-primary">
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
          </li>

          {/* Tools Section */}
          <li className="pt-4">
            <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 pb-2 hover:text-text-primary">
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
          </li>
        </ul>
      </nav>
    </aside>
  );
}
