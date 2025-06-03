import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { CalendarDays, Users, Clock, CheckCircle2, AlertTriangle, UserCheck, Send, User } from 'lucide-react';

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
  aulaId: number | null;
  diaSetmana: number;
  horaInici: string;
  horaFi: string;
  assignatura: string | null;
  professor: {
    id: number;
    nom: string;
    cognoms: string;
  };
  grup: {
    id: number;
    nomGrup: string;
  };
  aula?: {
    id: number;
    nomAula: string;
  } | null;
}

interface ProfessorDisponible {
  id: number;
  nom: string;
  cognoms: string;
  prioritat: number;
  guardiesRealiitzades: number;
  color: string;
  motiu: string;
  tipus: string;
}

interface Substitucio {
  horariId: number;
  horariOriginalId?: number;
  professorOriginalId: number;
  professorSubstitutId: number;
  observacions: string;
}

export default function SortidesSubstitucions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sortidaSeleccionada, setSortidaSeleccionada] = useState<number | null>(null);
  const [substitucions, setSubstitucions] = useState<Substitucio[]>([]);
  const [professorPerClasse, setProfessorPerClasse] = useState<{ [key: number]: number }>({});
  const [observacionsPerClasse, setObservacionsPerClasse] = useState<{ [key: number]: string }>({});
  const [classeSeleccionada, setClasseSeleccionada] = useState<number | null>(null);
  const [modalConfirmacio, setModalConfirmacio] = useState(false);
  const [assignacioTemporal, setAssignacioTemporal] = useState<{
    classeId: number;
    professorSubstitutId: number;
    professorOriginalId: number;
    motiu: string;
    descripcioTasca: string;
  } | null>(null);

  // Obtenir sortides planificades
  const { data: sortides = [], isLoading: loadingSortides } = useQuery({
    queryKey: ['/api/sortides'],
  });

  // Obtenir classes a substituir quan se selecciona una sortida
  const { data: classesToSubstitute = [], isLoading: loadingClasses } = useQuery({
    queryKey: [`/api/sortides/${sortidaSeleccionada}/classes-substituir`],
    enabled: !!sortidaSeleccionada,
  });

  // Obtenir professors disponibles per la classe seleccionada
  const { data: professorsDisponibles = [], isLoading: loadingProfessors } = useQuery({
    queryKey: [`/api/horari/${classeSeleccionada}/professors-disponibles`],
    enabled: !!classeSeleccionada,
  });

  // Mutació per crear tasca de substitució
  const mutationCrearTasca = useMutation({
    mutationFn: async (tasca: {
      professorOriginalId: number;
      professorAssignatId: number;
      horariId: number;
      diaSetmana: number;
      horaInici: string;
      horaFi: string;
      motiu: string;
      descripcio: string;
    }) => {
      const response = await fetch('/api/tasques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tasca)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creant tasca');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tasca creada",
        description: `Tasca de substitució creada i comunicacions enviades als professors involucrats.`,
      });
      
      // Tancar modal i reset
      setModalConfirmacio(false);
      setAssignacioTemporal(null);
      
      // Actualitzar substitucions locals
      if (assignacioTemporal) {
        setProfessorPerClasse(prev => ({ 
          ...prev, 
          [assignacioTemporal.classeId]: assignacioTemporal.professorSubstitutId 
        }));
        
        setSubstitucions(prev => {
          const filtered = prev.filter(s => s.horariId !== assignacioTemporal.classeId);
          return [...filtered, {
            horariId: assignacioTemporal.classeId,
            horariOriginalId: assignacioTemporal.classeId,
            professorOriginalId: assignacioTemporal.professorOriginalId,
            professorSubstitutId: assignacioTemporal.professorSubstitutId,
            observacions: assignacioTemporal.descripcioTasca
          }];
        });
      }
      
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['/api/tasques'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comunicacions'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autoritzat",
          description: "Estàs desconnectat. Connectant-te de nou...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Error creant la tasca de substitució",
        variant: "destructive",
      });
    },
  });

  const classesToUse = Array.isArray(classesToSubstitute) ? classesToSubstitute : [];
  const sortidaActual = Array.isArray(sortides) ? sortides.find(s => s.id === sortidaSeleccionada) : null;

  // Validar dades abans d'enviar
  const validarSubstitucions = () => {
    if (!sortidaSeleccionada) {
      toast({
        title: "Error de validació",
        description: "Has de seleccionar una sortida primer.",
        variant: "destructive",
      });
      return false;
    }

    if (substitucions.length === 0) {
      toast({
        title: "Error de validació", 
        description: "No hi ha substitucions per confirmar.",
        variant: "destructive",
      });
      return false;
    }

    // Verificar que totes les classes tenen professor assignat
    const classesAmbProfessor = substitucions.filter(s => s.professorSubstitutId);
    if (classesAmbProfessor.length !== classesToUse.length) {
      toast({
        title: "Error de validació",
        description: "Falten professors per assignar a algunes classes.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Mutació per confirmar substitucions
  const confirmSubstitucions = useMutation({
    mutationFn: async () => {
      if (!validarSubstitucions()) {
        throw new Error('Validació fallida');
      }

      try {
        // Crear totes les substitucions
        for (const substitucio of substitucions) {
          const response = await fetch(`/api/sortides/${sortidaSeleccionada}/substitucions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(substitucio)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creant substitució');
          }
        }

        // Confirmar i enviar comunicacions
        const response = await fetch(`/api/sortides/${sortidaSeleccionada}/confirmar-substitucions`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error confirmant substitucions');
        }
        
        return response.json();
      } catch (error: any) {
        console.error('Error en confirmSubstitucions:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Substitucions confirmades",
        description: `${data.substitucionsConfirmades} substitucions confirmades i ${data.comunicacionsEnviades} comunicacions enviades.`,
      });
      
      // Eliminar les classes confirmades de la llista de planificació
      const classesConfirmades = substitucions.map(s => s.horariId);
      
      // Reset state
      setSortidaSeleccionada(null);
      setSubstitucions([]);
      setProfessorPerClasse({});
      setObservacionsPerClasse({});
      setClasseSeleccionada(null);
      
      // Invalidar caches per actualitzar les llistes
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comunicacions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasques'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
      
      // Força la recàrrega de les classes per a substitució per eliminar les confirmades
      if (sortidaSeleccionada) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/sortides', sortidaSeleccionada, 'classes-substitucio'] 
        });
      }
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
      
      console.error('Error confirmant substitucions:', error);
      toast({
        title: "Error",
        description: error.message || "No s'han pogut confirmar les substitucions.",
        variant: "destructive",
      });
    }
  });

  const handleSeleccionarSortida = (sortidaId: number) => {
    setSortidaSeleccionada(sortidaId);
    setSubstitucions([]);
    setProfessorPerClasse({});
    setObservacionsPerClasse({});
    setClasseSeleccionada(null);
  };

  const handleAssignarProfessor = (horariId: number, professorId: number, professorOriginalId: number) => {
    // Obtenir informació del professor seleccionat
    const professorSeleccionat = professorsDisponibles.find(p => p.id === professorId);
    const classeInfo = classesToUse.find(c => c.id === horariId);
    
    if (!professorSeleccionat || !classeInfo) return;

    // Configurar dades temporals per al modal
    setAssignacioTemporal({
      classeId: horariId,
      professorSubstitutId: professorId,
      professorOriginalId,
      motiu: `Substitució per sortida: ${sortidaActual?.nomSortida}`,
      descripcioTasca: `Cobrir classe de ${classeInfo.assignatura} - ${classeInfo.grup?.nomGrup || 'Sense grup'} de ${classeInfo.horaInici} a ${classeInfo.horaFi}`
    });
    
    // Obrir modal de confirmació
    setModalConfirmacio(true);
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
    const colorMap: { [key: string]: string } = {
      'Guàrdia': 'bg-green-100 text-green-800 border-green-200',
      'Lliure': 'bg-blue-100 text-blue-800 border-blue-200',
      'Altres': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const totesClassesAssignades = classesToUse.length > 0 && 
    classesToUse.every(classe => professorPerClasse[classe.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Substitucions per Sortides</h1>
          </div>
          {totesClassesAssignades && (
            <Button
              onClick={() => confirmSubstitucions.mutate()}
              disabled={confirmSubstitucions.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              {confirmSubstitucions.isPending ? 'Confirmant...' : 'Confirmar Substitucions'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar amb sortides */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Sortides Planificades</h2>
          
          {loadingSortides ? (
            <div className="text-center py-8">Carregant sortides...</div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(sortides) && sortides.map((sortida: Sortida) => (
                <Card 
                  key={sortida.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    sortidaSeleccionada === sortida.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleSeleccionarSortida(sortida.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">{sortida.nomSortida}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {sortida.dataInici}
                      </div>
                      {sortida.lloc && (
                        <p className="text-xs text-muted-foreground">{sortida.lloc}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contingut principal */}
        <div className="flex-1 flex flex-col">
          {!sortidaSeleccionada ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Selecciona una sortida</h3>
                <p className="text-gray-500">Tria una sortida de la llista per gestionar les substitucions</p>
              </div>
            </div>
          ) : (
            <>
              {/* Informació de la sortida seleccionada */}
              {sortidaActual && (
                <div className="bg-blue-50 border-b border-blue-200 p-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sortida:</strong> {sortidaActual.nomSortida} - {sortidaActual.dataInici}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Classes en horitzontal */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Classes a Substituir</h2>
                
                {loadingClasses ? (
                  <div className="text-center py-8">Carregant classes...</div>
                ) : classesToUse.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hi ha classes que necessiten substitució per aquesta sortida
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {classesToUse.map((classe) => {
                      const professorAssignat = professorPerClasse[classe.id];
                      const isSelected = classeSeleccionada === classe.id;
                      
                      return (
                        <Card 
                          key={classe.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          } ${professorAssignat ? 'border-green-500 bg-green-50' : ''}`}
                          onClick={() => setClasseSeleccionada(classe.id)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-sm">
                                    {getDiaSetmanaNom(classe.diaSetmana)} {classe.horaInici}-{classe.horaFi}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {classe.assignatura || 'Sense assignatura'} - {classe.grup?.nomGrup || 'Sense grup'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {classe.aula?.nomAula || 'Sense aula'}
                                  </p>
                                </div>
                                {professorAssignat && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    Assignada
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium">Professor original:</p>
                                <p className="text-xs">{classe.professor.nom} {classe.professor.cognoms}</p>
                              </div>

                              {professorAssignat && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-medium text-green-700">Professor substitut:</p>
                                  <p className="text-xs text-green-600">Professor ID: {professorAssignat}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Professors disponibles (desplegat a sota) */}
              {classeSeleccionada && (
                <div className="border-t bg-white">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Professors Disponibles per la Classe Seleccionada
                    </h3>
                    
                    {loadingProfessors ? (
                      <div className="text-center py-8">Carregant professors...</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Professors amb guàrdia (prioritat 1) */}
                        <div>
                          <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Professors amb Guàrdia Programada
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Array.isArray(professorsDisponibles) && 
                              professorsDisponibles
                                .filter((prof: ProfessorDisponible) => prof.motiu === 'Guàrdia')
                                .map((professor: ProfessorDisponible) => (
                                  <Card 
                                    key={`guardia-${professor.id}`}
                                    className="cursor-pointer hover:shadow-md transition-all border-green-200"
                                    onClick={() => handleAssignarProfessor(classeSeleccionada, professor.id, classesToUse.find(c => c.id === classeSeleccionada)?.professor.id || 0)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-3">
                                        <User className="h-8 w-8 text-green-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{professor.nom} {professor.cognoms}</p>
                                          <Badge className={`text-xs ${getColorBadge(professor.color)}`}>
                                            {professor.color}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                          </div>
                        </div>

                        {/* Professors lliures (prioritat 2) */}
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Professors Lliures
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Array.isArray(professorsDisponibles) && 
                              professorsDisponibles
                                .filter((prof: ProfessorDisponible) => prof.motiu === 'Lliure')
                                .map((professor: ProfessorDisponible) => (
                                  <Card 
                                    key={`lliure-${professor.id}`}
                                    className="cursor-pointer hover:shadow-md transition-all border-blue-200"
                                    onClick={() => handleAssignarProfessor(classeSeleccionada, professor.id, classesToUse.find(c => c.id === classeSeleccionada)?.professor.id || 0)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-3">
                                        <User className="h-8 w-8 text-blue-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{professor.nom} {professor.cognoms}</p>
                                          <Badge className={`text-xs ${getColorBadge(professor.color)}`}>
                                            {professor.color}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                          </div>
                        </div>

                        {/* Altres professors (prioritat 3) */}
                        {Array.isArray(professorsDisponibles) && 
                          professorsDisponibles.filter((prof: ProfessorDisponible) => prof.color === 'Altres').length > 0 && (
                          <div>
                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Altres Professors
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {professorsDisponibles
                                .filter((prof: ProfessorDisponible) => prof.color === 'Altres')
                                .map((professor: ProfessorDisponible) => (
                                  <Card 
                                    key={`altres-${professor.id}`}
                                    className="cursor-pointer hover:shadow-md transition-all border-yellow-200"
                                    onClick={() => handleAssignarProfessor(classeSeleccionada, professor.id, classesToUse.find(c => c.id === classeSeleccionada)?.professor.id || 0)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-3">
                                        <User className="h-8 w-8 text-yellow-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{professor.nom} {professor.cognoms}</p>
                                          <Badge className={`text-xs ${getColorBadge(professor.color)}`}>
                                            {professor.color}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Observacions per la classe seleccionada */}
                        <div className="mt-6">
                          <Label htmlFor="observacions" className="text-sm font-medium">
                            Observacions per aquesta substitució
                          </Label>
                          <Textarea
                            id="observacions"
                            placeholder="Afegeix observacions específiques per aquesta substitució..."
                            value={observacionsPerClasse[classeSeleccionada] || ''}
                            onChange={(e) => handleObservacions(classeSeleccionada, e.target.value)}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmació per crear tasca */}
      <Dialog open={modalConfirmacio} onOpenChange={setModalConfirmacio}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Assignació de Substitució</DialogTitle>
            <DialogDescription>
              Estàs a punt de crear una tasca de substitució. Revisa els detalls abans de confirmar.
            </DialogDescription>
          </DialogHeader>
          
          {assignacioTemporal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Professor Original</Label>
                  <p className="text-sm text-muted-foreground">
                    {classesToUse.find(c => c.id === assignacioTemporal.classeId)?.professor?.nom}{' '}
                    {classesToUse.find(c => c.id === assignacioTemporal.classeId)?.professor?.cognoms}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Professor Substitut</Label>
                  <p className="text-sm text-muted-foreground">
                    {(professorsDisponibles as any[])?.find((p: any) => p.id === assignacioTemporal.professorSubstitutId)?.nom}{' '}
                    {(professorsDisponibles as any[])?.find((p: any) => p.id === assignacioTemporal.professorSubstitutId)?.cognoms}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Motiu</Label>
                <Input
                  value={assignacioTemporal.motiu}
                  onChange={(e) => setAssignacioTemporal(prev => prev ? {...prev, motiu: e.target.value} : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descripció de la Tasca</Label>
                <Textarea
                  value={assignacioTemporal.descripcioTasca}
                  onChange={(e) => setAssignacioTemporal(prev => prev ? {...prev, descripcioTasca: e.target.value} : null)}
                  className="mt-1"
                  rows={3}
                  placeholder="Descriu la tasca específica que ha de realitzar el professor substitut..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setModalConfirmacio(false);
                setAssignacioTemporal(null);
              }}
            >
              Cancel·lar
            </Button>
            <Button 
              onClick={() => {
                if (assignacioTemporal) {
                  const classeInfo = classesToUse.find(c => c.id === assignacioTemporal.classeId);
                  if (classeInfo) {
                    mutationCrearTasca.mutate({
                      professorOriginalId: assignacioTemporal.professorOriginalId,
                      professorAssignatId: assignacioTemporal.professorSubstitutId,
                      horariId: assignacioTemporal.classeId,
                      diaSetmana: classeInfo.diaSetmana,
                      horaInici: classeInfo.horaInici,
                      horaFi: classeInfo.horaFi,
                      motiu: assignacioTemporal.motiu,
                      descripcio: assignacioTemporal.descripcioTasca
                    });
                  }
                }
              }}
              disabled={mutationCrearTasca.isPending}
            >
              {mutationCrearTasca.isPending ? "Creant..." : "Confirmar i Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}