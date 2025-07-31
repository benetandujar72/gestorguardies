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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { CalendarDays, Users, Clock, CheckCircle2, AlertTriangle, UserCheck, Send, User, Calendar, BookOpen } from 'lucide-react';

interface Sortida {
  id: number;
  nomSortida: string;
  dataInici: string;
  dataFi: string;
  grupId: number | null;
  descripcio: string | null;
  lloc: string | null;
  responsableId: number | null;
  grup?: {
    id: number;
    nomGrup: string;
  };
}

interface HoraLliure {
  diaSetmana: number;
  horaInici: string;
  horaFi: string;
  professorId: number;
  professorNom: string;
  assignatura: string;
  aulaId: number | null;
  aulaNom: string | null;
  horariId: number;
}

interface ProfessorDisponible {
  id: number;
  nom: string;
  cognoms: string;
  prioritat: number;
  guardiesRealiitzades: number;
  color: string;
  motiu: string;
  tipus: 'Guàrdia' | 'Lliure' | 'Altres';
  disponible: boolean;
}

interface HoraSeleccionada {
  diaSetmana: number;
  horaInici: string;
  horaFi: string;
  professorOriginalId: number;
  professorOriginalNom: string;
  assignatura: string;
  aulaId: number | null;
  aulaNom: string | null;
  horariId: number;
  professorSubstitutId?: number;
  observacions?: string;
}

export default function SortidesSubstitucionsEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sortidaSeleccionada, setSortidaSeleccionada] = useState<number | null>(null);
  const [horesSeleccionades, setHoresSeleccionades] = useState<Set<string>>(new Set());
  const [substitucions, setSubstitucions] = useState<HoraSeleccionada[]>([]);
  const [modalAssignacio, setModalAssignacio] = useState<{
    open: boolean;
    horaSeleccionada: HoraSeleccionada | null;
    professorsDisponibles: ProfessorDisponible[];
  }>({
    open: false,
    horaSeleccionada: null,
    professorsDisponibles: []
  });

  // Obtenir sortides planificades
  const { data: sortides = [], isLoading: loadingSortides } = useQuery({
    queryKey: ['/api/sortides'],
  });

  // Obtenir hores que el grup allibera quan surten
  const { data: horesLliberades = [], isLoading: loadingHores } = useQuery({
    queryKey: [`/api/sortides/${sortidaSeleccionada}/hores-alliberades`],
    enabled: !!sortidaSeleccionada,
  });

  // Mutació per crear substitucions
  const mutationCrearSubstitucions = useMutation({
    mutationFn: async (substitucionsData: Array<{
      horariId: number;
      professorOriginalId: number;
      professorSubstitutId: number;
      sortidaId: number;
      observacions?: string;
    }>) => {
      const response = await fetch('/api/substitucions/crear-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ substitucions: substitucionsData })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Substitucions creades",
        description: `S'han creat ${substitucions.length} substitucions correctament.`,
        variant: "default",
      });

      // Reset del formulari
      setSortidaSeleccionada(null);
      setHoresSeleccionades(new Set());
      setSubstitucions([]);
      
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/substitucions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
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
      
      console.error('Error creant substitucions:', error);
      toast({
        title: "Error",
        description: error.message || "No s'han pogut crear les substitucions.",
        variant: "destructive",
      });
    }
  });

  const handleSeleccionarSortida = (sortidaId: number) => {
    setSortidaSeleccionada(sortidaId);
    setHoresSeleccionades(new Set());
    setSubstitucions([]);
  };

  const handleToggleHora = (hora: HoraLliure) => {
    const horaKey = `${hora.diaSetmana}-${hora.horaInici}-${hora.horaFi}-${hora.horariId}`;
    
    setHoresSeleccionades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(horaKey)) {
        newSet.delete(horaKey);
        // Eliminar de substitucions també
        setSubstitucions(prevSubs => prevSubs.filter(s => s.horariId !== hora.horariId));
      } else {
        newSet.add(horaKey);
        // Afegir a la llista de substitucions
        const novaSubstitucio: HoraSeleccionada = {
          diaSetmana: hora.diaSetmana,
          horaInici: hora.horaInici,
          horaFi: hora.horaFi,
          professorOriginalId: hora.professorId,
          professorOriginalNom: hora.professorNom,
          assignatura: hora.assignatura,
          aulaId: hora.aulaId,
          aulaNom: hora.aulaNom,
          horariId: hora.horariId
        };
        setSubstitucions(prevSubs => [...prevSubs, novaSubstitucio]);
      }
      return newSet;
    });
  };

  const handleObrirModalAssignacio = async (horaSeleccionada: HoraSeleccionada) => {
    try {
      // Obtenir professors disponibles per aquesta hora específica
      const response = await fetch(`/api/professors-disponibles/${horaSeleccionada.diaSetmana}/${horaSeleccionada.horaInici}/${horaSeleccionada.horaFi}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error obtenint professors disponibles');
      }
      
      const professorsDisponibles = await response.json();
      
      setModalAssignacio({
        open: true,
        horaSeleccionada,
        professorsDisponibles
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No s'han pogut obtenir els professors disponibles.",
        variant: "destructive",
      });
    }
  };

  const handleAssignarProfessor = (professorId: number, observacions: string = '') => {
    if (!modalAssignacio.horaSeleccionada) return;

    setSubstitucions(prev => prev.map(sub => 
      sub.horariId === modalAssignacio.horaSeleccionada!.horariId
        ? { ...sub, professorSubstitutId: professorId, observacions }
        : sub
    ));

    setModalAssignacio({ open: false, horaSeleccionada: null, professorsDisponibles: [] });
  };

  const handleConfirmarSubstitucions = () => {
    const substitucionsCompletes = substitucions.filter(s => s.professorSubstitutId);
    
    if (substitucionsCompletes.length === 0) {
      toast({
        title: "Error",
        description: "Has d'assignar almenys un professor substitut.",
        variant: "destructive",
      });
      return;
    }

    const substitucionsData = substitucionsCompletes.map(s => ({
      horariId: s.horariId,
      professorOriginalId: s.professorOriginalId,
      professorSubstitutId: s.professorSubstitutId!,
      sortidaId: sortidaSeleccionada!,
      observacions: s.observacions
    }));

    mutationCrearSubstitucions.mutate(substitucionsData);
  };

  const getDiaSetmanaNom = (dia: number) => {
    const dies = ['', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
    return dies[dia] || dia.toString();
  };

  const formatHora = (hora: string) => {
    // Corregir el format d'hora per evitar els errors de validació HTML
    if (hora.includes(' - ')) {
      return hora.split(' - ')[0];
    }
    return hora.length > 5 ? hora.substring(0, 5) : hora;
  };

  const getColorTipus = (tipus: string) => {
    const colorMap: { [key: string]: string } = {
      'Guàrdia': 'bg-green-100 text-green-800 border-green-200',
      'Lliure': 'bg-blue-100 text-blue-800 border-blue-200',
      'Altres': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colorMap[tipus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const sortidaActual = sortides.find((s: Sortida) => s.id === sortidaSeleccionada);
  const horesSeleccionadesCount = horesSeleccionades.size;
  const substitucionsAssignades = substitucions.filter(s => s.professorSubstitutId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Gestió Avançada de Substitucions</h1>
          </div>
          {substitucionsAssignades > 0 && (
            <Button
              onClick={handleConfirmarSubstitucions}
              disabled={mutationCrearSubstitucions.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {mutationCrearSubstitucions.isPending ? 'Creant...' : `Confirmar ${substitucionsAssignades} Substitucions`}
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar amb sortides */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sortides Planificades
          </h2>
          
          {loadingSortides ? (
            <div className="text-center py-8">Carregant sortides...</div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(sortides) && sortides.map((sortida: Sortida) => (
                <Card 
                  key={sortida.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    sortidaSeleccionada === sortida.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSeleccionarSortida(sortida.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{sortida.nomSortida}</h3>
                      <Badge variant="outline" className="text-xs">
                        {sortida.grup?.nomGrup || 'Sense grup'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sortida.dataInici).toLocaleDateString('ca-ES')}
                        {sortida.dataFi !== sortida.dataInici && (
                          <span> - {new Date(sortida.dataFi).toLocaleDateString('ca-ES')}</span>
                        )}
                      </div>
                      {sortida.lloc && (
                        <div className="text-xs text-gray-500">{sortida.lloc}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contingut principal */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!sortidaSeleccionada ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una sortida</h3>
              <p className="text-gray-600">Tria una sortida de la llista per gestionar les substitucions necessàries.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informació de la sortida seleccionada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {sortidaActual?.nomSortida}
                  </CardTitle>
                  <CardDescription>
                    Grup: {sortidaActual?.grup?.nomGrup || 'Sense grup'} | 
                    Dates: {new Date(sortidaActual?.dataInici || '').toLocaleDateString('ca-ES')} - {new Date(sortidaActual?.dataFi || '').toLocaleDateString('ca-ES')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {horesSeleccionadesCount} hores seleccionades
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {substitucionsAssignades} professors assignats
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Hores que el grup allibera */}
              <Card>
                <CardHeader>
                  <CardTitle>Hores que el grup allibera</CardTitle>
                  <CardDescription>
                    Selecciona les hores específiques que necessiten substitució quan el grup surti.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHores ? (
                    <div className="text-center py-8">Carregant hores...</div>
                  ) : horesLliberades.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No s'han trobat hores programades per aquest grup.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        horesLliberades.reduce((acc: { [key: number]: HoraLliure[] }, hora: HoraLliure) => {
                          if (!acc[hora.diaSetmana]) acc[hora.diaSetmana] = [];
                          acc[hora.diaSetmana].push(hora);
                          return acc;
                        }, {})
                      ).map(([dia, hores]) => (
                        <div key={dia} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{getDiaSetmanaNom(parseInt(dia))}</h4>
                          <div className="grid gap-2">
                            {hores.map((hora: HoraLliure) => {
                              const horaKey = `${hora.diaSetmana}-${hora.horaInici}-${hora.horaFi}-${hora.horariId}`;
                              const isSelected = horesSeleccionades.has(horaKey);
                              
                              return (
                                <div
                                  key={horaKey}
                                  className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                                    isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleToggleHora(hora)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox 
                                      checked={isSelected}
                                      onChange={() => {}} // Controlat pel onClick del div
                                    />
                                    <div>
                                      <div className="font-medium">
                                        {formatHora(hora.horaInici)} - {formatHora(hora.horaFi)}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {hora.assignatura} | {hora.professorNom} | {hora.aulaNom || 'Sense aula'}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const substitucio = substitucions.find(s => s.horariId === hora.horariId);
                                        if (substitucio) {
                                          handleObrirModalAssignacio(substitucio);
                                        }
                                      }}
                                    >
                                      {substitucions.find(s => s.horariId === hora.horariId)?.professorSubstitutId 
                                        ? 'Canviar Professor' 
                                        : 'Assignar Professor'
                                      }
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resum de substitucions */}
              {substitucions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resum de Substitucions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {substitucions.map((sub) => (
                        <div key={sub.horariId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {getDiaSetmanaNom(sub.diaSetmana)} | {formatHora(sub.horaInici)} - {formatHora(sub.horaFi)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {sub.assignatura} | Original: {sub.professorOriginalNom}
                            </div>
                          </div>
                          <div className="text-right">
                            {sub.professorSubstitutId ? (
                              <Badge className="bg-green-100 text-green-800">
                                Assignat
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600">
                                Pendent
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'assignació de professor */}
      <Dialog open={modalAssignacio.open} onOpenChange={(open) => 
        setModalAssignacio(prev => ({ ...prev, open }))
      }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignar Professor Substitut</DialogTitle>
            <DialogDescription>
              {modalAssignacio.horaSeleccionada && (
                <>
                  {getDiaSetmanaNom(modalAssignacio.horaSeleccionada.diaSetmana)} de{' '}
                  {formatHora(modalAssignacio.horaSeleccionada.horaInici)} a{' '}
                  {formatHora(modalAssignacio.horaSeleccionada.horaFi)} |{' '}
                  {modalAssignacio.horaSeleccionada.assignatura}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {modalAssignacio.professorsDisponibles.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hi ha professors disponibles per aquesta hora.
                </AlertDescription>
              </Alert>
            ) : (
              modalAssignacio.professorsDisponibles.map((professor) => (
                <div
                  key={professor.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssignarProfessor(professor.id)}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{professor.nom} {professor.cognoms}</div>
                      <div className="text-sm text-gray-600">{professor.motiu}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getColorTipus(professor.tipus)}>
                      {professor.tipus}
                    </Badge>
                    <Badge variant="outline">
                      {professor.guardiesRealiitzades} guardies
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}