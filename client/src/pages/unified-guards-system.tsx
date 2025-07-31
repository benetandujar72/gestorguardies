import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertCircle, CheckCircle, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ca } from "date-fns/locale";

// SISTEMA UNIFICAT DE GUARDIES
// Integra: Calendari, Assignacions, Professors, Guardies Pendents i IA

interface Guardia {
  id: number;
  anyAcademicId: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  lloc?: string;
  observacions?: string;
}

interface AssignacioGuardia {
  id: number;
  guardiaId: number;
  professorId: number;
  prioritat: number;
  estat: string;
  motiu?: string;
  professor?: {
    nom: string;
    cognoms: string;
  };
}

interface Professor {
  id: number;
  nom: string;
  cognoms: string;
  email: string;
}

export default function UnifiedGuardsSystem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGuardiaId, setSelectedGuardiaId] = useState<number | null>(null);

  // Carregar guardies
  const { data: guardies = [], isLoading: guardiesLoading } = useQuery({
    queryKey: ['/api/guardies'],
  });

  // Carregar assignacions
  const { data: assignacions = [], isLoading: assignacionsLoading } = useQuery({
    queryKey: ['/api/assignacions-guardia'],
  });

  // Carregar professors
  const { data: professors = [], isLoading: professorsLoading } = useQuery({
    queryKey: ['/api/professors'],
  });

  // Mutació per assignació automàtica amb IA
  const autoAssignMutation = useMutation({
    mutationFn: async (guardiaId: number) => {
      const response = await fetch('/api/assignacions-guardia/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardiaId }),
      });
      if (!response.ok) throw new Error('Error en assignació automàtica');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignació automàtica completada",
        description: "La IA ha assignat la guàrdia correctament",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en assignació automàtica",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutació per assignació manual
  const manualAssignMutation = useMutation({
    mutationFn: async ({ guardiaId, professorId, motiu }: { guardiaId: number; professorId: number; motiu: string }) => {
      const response = await fetch('/api/assignacions-guardia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardiaId,
          professorId,
          prioritat: 1,
          estat: 'assignada',
          motiu,
          anyAcademicId: 2
        }),
      });
      if (!response.ok) throw new Error('Error en assignació manual');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignació manual completada",
        description: "Professor assignat correctament",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en assignació manual",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar guardies per data seleccionada
  const guardiesFiltered = guardies.filter((g: Guardia) => g.data === selectedDate);

  // Obtenir assignacions per guàrdia
  const getAssignacionsForGuardia = (guardiaId: number) => {
    return assignacions.filter((a: AssignacioGuardia) => a.guardiaId === guardiaId);
  };

  // Estadístiques ràpides
  const guardiesPendents = guardies.filter((g: Guardia) => g.estat === 'Pendent' || g.estat === 'pendent').length;
  const guardiesAssignades = guardies.filter((g: Guardia) => g.estat === 'assignada').length;
  const totalAssignacions = assignacions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema Unificat de Guardies</h1>
          <p className="text-muted-foreground">
            Gestió integrada de guardies, assignacions i professors amb IA
          </p>
        </div>
      </div>

      {/* Estadístiques ràpides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendents</p>
                <p className="text-2xl font-bold">{guardiesPendents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Assignades</p>
                <p className="text-2xl font-bold">{guardiesAssignades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Assignacions</p>
                <p className="text-2xl font-bold">{totalAssignacions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Professors</p>
                <p className="text-2xl font-bold">{professors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtre per data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Calendari de Guardies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="date-select">Seleccionar data:</Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {/* Guardies del dia seleccionat */}
          <div className="space-y-4">
            {guardiesFiltered.length === 0 ? (
              <p className="text-muted-foreground">No hi ha guardies programades per aquesta data.</p>
            ) : (
              guardiesFiltered.map((guardia: Guardia) => {
                const assignacionsGuardia = getAssignacionsForGuardia(guardia.id);
                
                return (
                  <Card key={guardia.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {guardia.horaInici} - {guardia.horaFi}
                            </span>
                            <Badge variant={guardia.estat === 'assignada' ? 'default' : 'secondary'}>
                              {guardia.tipusGuardia}
                            </Badge>
                            <Badge variant={guardia.estat === 'assignada' ? 'default' : 'outline'}>
                              {guardia.estat}
                            </Badge>
                          </div>
                          
                          {guardia.lloc && (
                            <p className="text-sm text-muted-foreground">Lloc: {guardia.lloc}</p>
                          )}
                          
                          {assignacionsGuardia.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assignacionsGuardia.map((assignacio: AssignacioGuardia) => (
                                <Badge key={assignacio.id} variant="outline" className="text-xs">
                                  {assignacio.professor ? 
                                    `${assignacio.professor.nom} ${assignacio.professor.cognoms}` : 
                                    `Professor ID: ${assignacio.professorId}`
                                  }
                                  {assignacio.motiu && ` (${assignacio.motiu})`}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {guardia.estat !== 'assignada' && (
                            <>
                              <Button
                                id="auto-assign-btn"
                                variant="outline"
                                size="sm"
                                onClick={() => autoAssignMutation.mutate(guardia.id)}
                                disabled={autoAssignMutation.isPending}
                                className="flex items-center space-x-1"
                              >
                                <Bot className="h-4 w-4" />
                                <span>Assignar amb IA</span>
                              </Button>
                              
                              <Button
                                id="manual-assign-btn"
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedGuardiaId(guardia.id)}
                              >
                                Assignar Manual
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal d'assignació manual */}
      {selectedGuardiaId && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Assignació Manual</CardTitle>
            <CardDescription>
              Selecciona un professor per la guàrdia ID: {selectedGuardiaId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const professorId = parseInt(formData.get('professorId') as string);
              const motiu = formData.get('motiu') as string;
              
              if (professorId && motiu) {
                manualAssignMutation.mutate({
                  guardiaId: selectedGuardiaId,
                  professorId,
                  motiu
                });
                setSelectedGuardiaId(null);
              }
            }} className="space-y-4">
              
              <div>
                <Label htmlFor="professor-select">Professor:</Label>
                <Select name="professorId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map((prof: Professor) => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.nom} {prof.cognoms}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="motiu-select">Motiu:</Label>
                <Select name="motiu" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el motiu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sortida">Sortida</SelectItem>
                    <SelectItem value="reunio">Reunió</SelectItem>
                    <SelectItem value="carrec">Càrrec administratiu</SelectItem>
                    <SelectItem value="equilibri">Equilibri de càrrega</SelectItem>
                    <SelectItem value="substitucio">Substitució</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={manualAssignMutation.isPending}>
                  Assignar
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedGuardiaId(null)}
                >
                  Cancel·lar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}