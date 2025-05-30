import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Check, Clock, Users } from "lucide-react";
import { Link } from "wouter";

interface GuardAssignment {
  id: number;
  guardia: {
    id: number;
    horaInici: string;
    horaFi: string;
    tipusGuardia: string;
    lloc?: string;
  };
  professor: {
    id: number;
    nom: string;
    cognoms: string;
  };
  prioritat: number;
  estat: string;
  motiu?: string;
}

export default function GuardScheduleWidget() {
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's guard assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['/api/guardies', { date: today }],
    select: (guards: any[]) => {
      // This would need to be joined with assignments in a real implementation
      // For now, we'll simulate the structure
      return guards.map(guard => ({
        id: guard.id,
        guardia: guard,
        professor: {
          id: 1,
          nom: "Professor",
          cognoms: "Assignat",
        },
        prioritat: 1,
        estat: "assignada",
        motiu: "guardia_assignada",
      }));
    },
  });

  const getPriorityColor = (prioritat: number) => {
    switch (prioritat) {
      case 1:
        return "bg-secondary text-white";
      case 2:
        return "bg-accent text-white";
      case 3:
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getPriorityLabel = (motiu?: string) => {
    switch (motiu) {
      case "sortida":
        return "Sortida";
      case "reunio":
        return "Reunió";
      case "carrec":
        return "Càrrec";
      case "equilibri":
        return "Equilibri";
      default:
        return "Prioritat Alta";
    }
  };

  const getInitials = (nom: string, cognoms: string) => {
    return `${nom[0]}${cognoms.split(' ')[0]?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardies d'Avui</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-text-primary">
            Guardies d'Avui
          </CardTitle>
          <Link href="/guardies">
            <Button variant="ghost" className="text-primary hover:text-blue-800 text-sm font-medium">
              Veure totes <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha guardies programades
            </h3>
            <p className="text-gray-500 mb-4">
              Avui no s'han programat guardies encara.
            </p>
            <Link href="/guardies">
              <Button>Programar Guardies</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                      {getInitials(assignment.professor.nom, assignment.professor.cognoms)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {assignment.professor.nom} {assignment.professor.cognoms}
                    </h3>
                    <p className="text-sm text-text-secondary flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {assignment.guardia.horaInici} - {assignment.guardia.horaFi}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{assignment.guardia.tipusGuardia}</span>
                      {assignment.guardia.lloc && (
                        <>
                          <span>•</span>
                          <span>{assignment.guardia.lloc}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(assignment.prioritat)}>
                    {getPriorityLabel(assignment.motiu)}
                  </Badge>
                  {assignment.estat === "completada" ? (
                    <Check className="h-5 w-5 text-secondary" />
                  ) : assignment.estat === "assignada" ? (
                    <Clock className="h-5 w-5 text-accent" />
                  ) : (
                    <Users className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
            
            {assignments.length > 3 && (
              <div className="pt-2 text-center">
                <Link href="/guardies">
                  <Button variant="outline" size="sm">
                    Veure {assignments.length - 3} guardies més
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
