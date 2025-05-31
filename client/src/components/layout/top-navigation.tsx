import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, LogOut, Settings, User, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function TopNavigation() {
  const { user } = useAuth();
  const [notificationCount] = useState(3); // This would come from actual notifications
  
  // Obtenir informació dels anys acadèmics
  const { data: academicYears } = useQuery({
    queryKey: ['/api/anys-academics'],
  });

  // Trobar l'any acadèmic actiu
  const activeAcademicYear = academicYears?.find((year: any) => year.actiu === true);
  
  // Debug: verificar les dades
  console.log('Academic Years Data:', academicYears);
  console.log('Active Academic Year:', activeAcademicYear);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">GestióGuàrdies</h1>
            </div>
            
            {/* Informació del curs acadèmic actiu */}
            {activeAcademicYear && (
              <div className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {activeAcademicYear.nom}
                </span>
                <Badge variant="secondary" className="text-xs bg-primary text-white">
                  Actiu
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-text-secondary hover:text-primary" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-error text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profileImageUrl || ""} alt="Avatar" />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-text-primary">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "Usuari"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuració</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Tancar Sessió</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
