import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { CalendarDays, Users, Clock, CheckCircle2, AlertTriangle, UserCheck, Send } from 'lucide-react';

interface Sortida {
  id: number;
  nomSortida: string;
  dataInici: string;
  dataFi: string;
  grupId: number | null;
  descripcio: string | null;
  lloc: string | null;
  responsableId: number | null;
}

interface ClasseASubstituir {
  id: number;
  professorId: number;
  grupId: number;
  aulaId: number;
  diaSetmana: number;
  horaInici: string;
  horaFi: string;
  assignatura: string;
  professor: { id: number; nom: string; cognoms: string };
  grup: { id: number; nomGrup: string };
  aula: { id: number; nomAula: string };
}

interface ProfessorDisponible {
  id: number;
  nom: string;
  cognoms: string;
  prioritat: number;
  guardiesRealiitzades: number;
  color: string;
}

interface Substitucio {
  horariId: number;
  professorOriginalId: number;
  professorSubstitutId: number;
  observacions: string;
}

export default function SortidesSubstitucions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sortidaSeleccionada, setSortidaSeleccionada] = useState<number | null>(null);
  const [classesASubstituir, setClassesASubstituir] = useState<ClasseASubstituir[]>([]);
  const [substitucions, setSubstitucions] = useState<Substitucio[]>([]);
  const [professorPerClasse, setProfessorPerClasse] = useState<{ [key: number]: number }>({});
  const [observacionsPerClasse, setObservacionsPerClasse] = useState<{ [key: number]: string }>({});
  const [mostrarResum, setMostrarResum] = useState(false);

  // Obtenir sortides planificades
  const { data: sortides, isLoading: loadingSortides } = useQuery({
    queryKey: ['/api/sortides'],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Has estat desconnectat. Redirigint...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Obtenir classes a substituir quan se selecciona una sortida
  const { data: classesToSubstitute, isLoading: loadingClasses } = useQuery({
    queryKey: [`/api/sortides/${sortidaSeleccionada}/classes-substituir`],
    enabled: !!sortidaSeleccionada,
  });

  // Actualitzar l'estat quan arriben les dades
  useEffect(() => {
    if (classesToSubstitute) {
      setClassesASubstituir(classesToSubstitute);
    }
  }, [classesToSubstitute]);

  // Mutació per confirmar substitucions
  const confirmSubstitucions = useMutation({
    mutationFn: async () => {
      if (!sortidaSeleccionada) throw new Error('No sortida selected');
      
      // Crear totes les substitucions
      for (const substitucio of substitucions) {
        await fetch(`/api/sortides/${sortidaSeleccionada}/substitucions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(substitucio)
        });
      }

      // Confirmar i enviar comunicacions
      const response = await fetch(`/api/sortides/${sortidaSeleccionada}/confirmar-substitucions`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error confirmant substitucions');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Substitucions confirmades",
        description: `${data.substitucionsConfirmades} substitucions confirmades i ${data.comunicacionsEnviades} comunicacions enviades.`,
      });
      
      // Reset state
      setSortidaSeleccionada(null);
      setClassesASubstituir([]);
      setSubstitucions([]);
      setProfessorPerClasse({});
      setObservacionsPerClasse({});
      setMostrarResum(false);
      
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comunicacions'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Has estat desconnectat. Redirigint...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No s'han pogut confirmar les substitucions.",
        variant: "destructive",
      });
    }
  });

  const handleSeleccionarSortida = (sortidaId: number) => {
    setSortidaSeleccionada(sortidaId);
    setClassesASubstituir([]);
    setSubstitucions([]);
    setProfessorPerClasse({});
    setObservacionsPerClasse({});
    setMostrarResum(false);
  };

  const handleAssignarProfessor = (horariId: number, professorId: number, professorOriginalId: number) => {
    setProfessorPerClasse(prev => ({ ...prev, [horariId]: professorId }));
    
    // Actualitzar substitucions
    setSubstitucions(prev => {
      const filtered = prev.filter(s => s.horariId !== horariId);
      return [...filtered, {
        horariId,
        professorOriginalId,
        professorSubstitutId: professorId,
        observacions: observacionsPerClasse[horariId] || ''
      }];
    });
  };

  const handleObservacions = (horariId: number, observacions: string) => {
    setObservacionsPerClasse(prev => ({ ...prev, [horariId]: observacions }));
    
    // Actualitzar substitucions
    setSubstitucions(prev => 
      prev.map(s => 
        s.horariId === horariId 
          ? { ...s, observacions }
          : s
      )
    );
  };

  const getDiaSetmanaNom = (dia: number) => {
    const dies = ['', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
    return dies[dia] || dia.toString();
  };

  const getColorBadge = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'orange': return 'bg-orange-100 text-orange-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortidaActual = sortides?.find((s: Sortida) => s.id === sortidaSeleccionada);
  const totesClassesAssignades = classesASubstituir.every(classe => professorPerClasse[classe.id]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Gestió de Substitucions per Sortides</h1>
          <p className="text-muted-foreground">
            Planifica les substitucions automàtiques quan el professorat acompanya sortides
          </p>
        </div>
      </div>

      {/* Selector de sortida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Seleccionar Sortida
          </CardTitle>
          <CardDescription>
            Escull la sortida per la qual vols planificar les substitucions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSortides ? (
            <div className="text-center p-4">Carregant sortides...</div>
          ) : !sortides || sortides.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No hi ha sortides planificades. Crea una sortida primer.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3">
              {sortides.map((sortida: Sortida) => (
                <Card 
                  key={sortida.id} 
                  className={`cursor-pointer transition-colors ${
                    sortidaSeleccionada === sortida.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSeleccionarSortida(sortida.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{sortida.nomSortida}</h3>
                        <p className="text-sm text-muted-foreground">{sortida.descripcio}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {sortida.dataInici}
                          </span>
                          <span>{sortida.lloc}</span>
                        </div>
                      </div>
                      {sortidaSeleccionada === sortida.id && (
                        <Badge variant="secondary">Seleccionada</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes a substituir */}
      {sortidaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Classes a Substituir
            </CardTitle>
            <CardDescription>
              Classes del professorat acompanyant que necessiten substitució
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="text-center p-4">Analitzant horaris...</div>
            ) : classesASubstituir.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  No hi ha classes que necessitin substitució per aquesta sortida.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {classesASubstituir.map((classe) => (
                  <ClasseSubstitucio
                    key={classe.id}
                    classe={classe}
                    professorAssignat={professorPerClasse[classe.id]}
                    observacions={observacionsPerClasse[classe.id] || ''}
                    onAssignarProfessor={(professorId) => 
                      handleAssignarProfessor(classe.id, professorId, classe.professorId)
                    }
                    onObservacions={(obs) => handleObservacions(classe.id, obs)}
                    getDiaSetmanaNom={getDiaSetmanaNom}
                    getColorBadge={getColorBadge}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botons d'acció */}
      {classesASubstituir.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={() => setMostrarResum(true)}
            disabled={!totesClassesAssignades}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Revisar Substitucions
          </Button>
        </div>
      )}

      {/* Resum de substitucions */}
      {mostrarResum && sortidaActual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Resum de Substitucions
            </CardTitle>
            <CardDescription>
              Revisa les substitucions abans de confirmar i enviar comunicacions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sortida:</strong> {sortidaActual.nomSortida} - {sortidaActual.dataInici}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {substitucions.map((sub, index) => {
                const classe = classesASubstituir.find(c => c.id === sub.horariId);
                if (!classe) return null;

                return (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {getDiaSetmanaNom(classe.diaSetmana)} {classe.horaInici}-{classe.horaFi}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {classe.assignatura} - {classe.grup.nomGrup} - {classe.aula.nomAula}
                        </p>
                        <p className="text-sm">
                          <strong>Professor original:</strong> {classe.professor.nom} {classe.professor.cognoms}
                        </p>
                      </div>
                      <Badge variant="outline">Planificada</Badge>
                    </div>
                    {sub.observacions && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        <strong>Observacions:</strong> {sub.observacions}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                onClick={() => confirmSubstitucions.mutate()}
                disabled={confirmSubstitucions.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {confirmSubstitucions.isPending ? 'Confirmant...' : 'Confirmar i Enviar Comunicacions'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMostrarResum(false)}
              >
                Tornar a Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component per cada classe a substituir
function ClasseSubstitucio({
  classe,
  professorAssignat,
  observacions,
  onAssignarProfessor,
  onObservacions,
  getDiaSetmanaNom,
  getColorBadge
}: {
  classe: ClasseASubstituir;
  professorAssignat?: number;
  observacions: string;
  onAssignarProfessor: (professorId: number) => void;
  onObservacions: (observacions: string) => void;
  getDiaSetmanaNom: (dia: number) => string;
  getColorBadge: (color: string) => string;
}) {
  const [mostrarProfessors, setMostrarProfessors] = useState(false);

  // Obtenir professors disponibles per aquesta classe
  const { data: professorsDisponibles, isLoading: loadingProfessors } = useQuery({
    queryKey: [`/api/horari/${classe.id}/professors-disponibles`],
    enabled: mostrarProfessors,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold">
              {getDiaSetmanaNom(classe.diaSetmana)} {classe.horaInici}-{classe.horaFi}
            </h4>
            <p className="text-sm text-muted-foreground">
              {classe.assignatura} - {classe.grup.nomGrup} - {classe.aula.nomAula}
            </p>
            <p className="text-sm">
              <strong>Professor:</strong> {classe.professor.nom} {classe.professor.cognoms}
            </p>
          </div>
          {professorAssignat ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Assignada
            </Badge>
          ) : (
            <Badge variant="outline">Pendent</Badge>
          )}
        </div>

        {!mostrarProfessors ? (
          <Button 
            onClick={() => setMostrarProfessors(true)}
            variant="outline"
            size="sm"
          >
            Seleccionar Professor Substitut
          </Button>
        ) : (
          <div className="space-y-3">
            <Label>Professors Disponibles</Label>
            {loadingProfessors ? (
              <div className="text-sm text-muted-foreground">Carregant professors...</div>
            ) : !professorsDisponibles || professorsDisponibles.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hi ha professors disponibles per aquesta franja horària.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {professorsDisponibles.map((professor: ProfessorDisponible) => (
                  <div
                    key={professor.id}
                    className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                      professorAssignat === professor.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => onAssignarProfessor(professor.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={professorAssignat === professor.id}
                        onChange={() => {}}
                      />
                      <div>
                        <p className="font-medium">{professor.nom} {professor.cognoms}</p>
                        <p className="text-xs text-muted-foreground">
                          {professor.guardiesRealiitzades} guardies realitzades
                        </p>
                      </div>
                    </div>
                    <Badge className={getColorBadge(professor.color)}>
                      Prioritat: {professor.prioritat}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`obs-${classe.id}`}>Observacions</Label>
              <Textarea
                id={`obs-${classe.id}`}
                placeholder="Observacions adicionals per aquesta substitució..."
                value={observacions}
                onChange={(e) => onObservacions(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}