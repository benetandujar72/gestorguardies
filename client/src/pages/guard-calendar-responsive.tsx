import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, Clock, MapPin, User, Download, ExternalLink, Edit2, List, Grid3x3, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { ca } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const guardEditSchema = z.object({
  data: z.string().min(1, "La data és obligatòria"),
  horaInici: z.string().min(1, "L'hora d'inici és obligatòria"),
  horaFi: z.string().min(1, "L'hora de fi és obligatòria"),
  tipusGuardia: z.string().min(1, "El tipus de guàrdia és obligatori"),
  estat: z.string().optional(),
  lloc: z.string().optional(),
  observacions: z.string().optional(),
});

type GuardEditFormData = z.infer<typeof guardEditSchema>;

interface GuardEvent {
  id: number;
  data: string;
  hora: string;
  tipusGuardia: string;
  categoria: string;
  observacions?: string;
  assignacioId?: number;
  professor?: {
    id: number;
    nom: string;
    cognoms: string;
  };
  aula?: {
    id: number;
    nom: string;
  };
  grup?: string;
  sortida?: string;
}

export default function GuardCalendarResponsive() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Start with June 2025 where substitutions are
    const june2025 = new Date('2025-06-02');
    return startOfWeek(june2025, { weekStartsOn: 1 });
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isMobile, setIsMobile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<GuardEvent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('list');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch substitutions (guards)
  const { data: guards = [], isLoading } = useQuery({
    queryKey: ['/api/substitucions-necessaries'],
    select: (data: any[]) => data.map(substitucio => ({
      id: substitucio.id,
      data: substitucio.data,
      hora: `${substitucio.horaInici} - ${substitucio.horaFi}`,
      tipusGuardia: substitucio.assignatura,
      categoria: substitucio.estat === 'pendent' ? 'Pendent' : 'Assignada',
      observacions: substitucio.descripcio,
      assignacioId: substitucio.id,
      professor: substitucio.professorSubstitut ? {
        id: substitucio.professorSubstitut.id,
        nom: substitucio.professorSubstitut.nom,
        cognoms: substitucio.professorSubstitut.cognoms,
      } : undefined,
      aula: { id: 1, nom: substitucio.aula || 'Aula' },
      grup: substitucio.grup,
      sortida: substitucio.sortida?.nomSortida
    })),
  });

  // Form for editing guards
  const form = useForm<GuardEditFormData>({
    resolver: zodResolver(guardEditSchema),
    defaultValues: {
      data: "",
      horaInici: "",
      horaFi: "",
      tipusGuardia: "",
      estat: "",
      lloc: "",
      observacions: "",
    },
  });

  // Edit substitution mutation
  const editGuardMutation = useMutation({
    mutationFn: async (data: GuardEditFormData & { id: number }) => {
      return await apiRequest('PUT', `/api/substitucions/${data.id}`, {
        professorSubstitutId: data.estat === 'assignada' ? 1 : null, // Would need proper professor selection
        estat: data.estat,
        observacions: data.observacions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/substitucions-necessaries'] });
      setIsEditDialogOpen(false);
      setSelectedGuard(null);
      form.reset();
      toast({
        title: "Guàrdia actualitzada",
        description: "La guàrdia s'ha actualitzat correctament.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No s'ha pogut actualitzar la guàrdia.",
        variant: "destructive",
      });
    },
  });

  const handleEditGuard = (guard: GuardEvent) => {
    setSelectedGuard(guard);
    form.reset({
      data: guard.data,
      horaInici: guard.hora,
      horaFi: guard.hora,
      tipusGuardia: guard.tipusGuardia,
      estat: guard.categoria,
      lloc: "",
      observacions: guard.observacions || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitEdit = (data: GuardEditFormData) => {
    if (selectedGuard) {
      editGuardMutation.mutate({ ...data, id: selectedGuard.id });
    }
  };

  // Get guards for the selected week
  const weekStart = selectedWeek;
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const weekGuards = guards.filter(guard => {
    const guardDate = parseISO(guard.data);
    return guardDate >= weekStart && guardDate <= weekEnd;
  });

  // Navigation functions
  const goToPreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    setSelectedWeek(startOfWeek(today, { weekStartsOn: 1 }));
  };

  // Export to Google Calendar
  const exportToGoogleCalendar = () => {
    const events = weekGuards.map(guard => {
      const startDate = new Date(`${guard.data}T${guard.hora}:00`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      const title = `Guàrdia ${guard.tipusGuardia}`;
      const description = `Tipus: ${guard.tipusGuardia}${guard.professor ? `\nProfessor: ${guard.professor.nom} ${guard.professor.cognoms}` : ''}${guard.observacions ? `\nObservacions: ${guard.observacions}` : ''}`;
      
      return `BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT`;
    }).join('\n');

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//School Guard System//NONSGML v1.0//EN
${events}
END:VCALENDAR`;

    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guardies-${format(selectedWeek, 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Calendari exportat",
      description: "El fitxer del calendari s'ha descarregat correctament.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendari de Guàrdies</h1>
          <p className="text-gray-600">
            Visualització setmanal de les guàrdies assignades
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {!isMobile && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="px-3"
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Calendari
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="w-4 h-4 mr-2" />
                Llista
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={exportToGoogleCalendar}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {format(weekStart, 'd MMM', { locale: ca })} - {format(weekEnd, 'd MMM yyyy', { locale: ca })}
                </h3>
                <p className="text-sm text-gray-500">
                  Setmana {format(weekStart, 'w', { locale: ca })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
            >
              Avui
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Guards Display */}
      {viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {/* Day headers */}
              {['Dll', 'Dmt', 'Dmc', 'Djs', 'Dvs', 'Dss', 'Dmg'].map((day, index) => {
                const fullDays = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
                return (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    <span className="md:hidden">{day}</span>
                    <span className="hidden md:inline">{fullDays[index]}</span>
                  </div>
                );
              })}
              
              {/* Calendar days */}
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const currentDay = addDays(weekStart, dayIndex);
                const dayGuards = weekGuards.filter(guard => 
                  isSameDay(parseISO(guard.data), currentDay)
                );
                
                const isToday = isSameDay(currentDay, new Date());
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-24 md:min-h-32 border rounded-lg p-1 md:p-2 ${
                      isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {format(currentDay, 'd', { locale: ca })}
                    </div>
                    
                    <div className="space-y-1">
                      {dayGuards.map((guard) => (
                        <div
                          key={guard.id}
                          className="bg-white border border-gray-200 rounded p-1 text-xs cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                          onClick={() => handleEditGuard(guard)}
                        >
                          <div className="font-medium flex items-center justify-between">
                            <span className="truncate">{guard.hora}</span>
                            <Edit2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          </div>
                          <div className="text-blue-600 truncate">{guard.tipusGuardia}</div>
                          {guard.professor && (
                            <div className="text-gray-500 truncate">
                              {guard.professor.nom}
                            </div>
                          )}
                          <Badge
                            variant={guard.categoria === 'Assignada' ? 'default' : 'secondary'}
                            className="mt-1 text-xs px-1 py-0"
                          >
                            {guard.categoria}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const currentDay = addDays(weekStart, dayIndex);
            const dayGuards = weekGuards.filter(guard => 
              isSameDay(parseISO(guard.data), currentDay)
            );
            
            if (dayGuards.length === 0) return null;
            
            const isToday = isSameDay(currentDay, new Date());
            
            return (
              <Card key={dayIndex} className={isToday ? 'border-blue-300 bg-blue-50' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {format(currentDay, 'EEEE, d MMMM', { locale: ca })}
                    {isToday && (
                      <Badge variant="default" className="ml-2">Avui</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayGuards.map((guard) => (
                      <div
                        key={guard.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border"
                        onClick={() => handleEditGuard(guard)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center text-sm font-medium">
                              <Clock className="w-4 h-4 mr-1" />
                              {guard.hora}
                            </div>
                            <Badge
                              variant={guard.categoria === 'Assignada' ? 'default' : 'secondary'}
                            >
                              {guard.categoria}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">{guard.tipusGuardia}</div>
                          {guard.professor && (
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              {guard.professor.nom} {guard.professor.cognoms}
                            </div>
                          )}
                          {guard.observacions && (
                            <div className="text-xs text-gray-400 mt-1">{guard.observacions}</div>
                          )}
                        </div>
                        <Edit2 className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {weekGuards.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hi ha guàrdies programades aquesta setmana</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Guard Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Guàrdia</DialogTitle>
            <DialogDescription>
              Modifica els detalls de la guàrdia seleccionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horaInici"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora d'inici</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaFi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de fi</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tipusGuardia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipus de guàrdia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pati">Pati</SelectItem>
                        <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                        <SelectItem value="Passadís">Passadís</SelectItem>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estat</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendent">Pendent</SelectItem>
                        <SelectItem value="Assignada">Assignada</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observacions</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observacions opcionals..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={editGuardMutation.isPending}
                >
                  Cancel·lar
                </Button>
                <Button type="submit" disabled={editGuardMutation.isPending}>
                  {editGuardMutation.isPending ? "Guardant..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}