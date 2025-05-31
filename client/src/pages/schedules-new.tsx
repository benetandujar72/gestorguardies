import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Plus, Users, DoorOpen, BookOpen, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const scheduleSchema = z.object({
  professorId: z.number().min(1, "Selecciona un professor"),
  grupId: z.number().min(1, "Selecciona un grup"),
  aulaId: z.number().min(1, "Selecciona una aula"),
  diaSetmana: z.number().min(1).max(5, "Només es permeten dies laborables"),
  horaInici: z.string().min(1, "L'hora d'inici és obligatòria"),
  horaFi: z.string().min(1, "L'hora de fi és obligatòria"),
  assignatura: z.string().optional(),
  duracio: z.number().min(1).max(6).optional(), // Duració en hores (1-6)
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface Schedule {
  id: number;
  professor: {
    id: number;
    nom: string;
    cognoms: string;
  };
  grup: {
    id: number;
    nomGrup: string;
  };
  aula: {
    id: number;
    nomAula: string;
  };
  diaSetmana: number;
  horaInici: string;
  horaFi: string;
  assignatura?: string;
}

const DIES_SETMANA = [
  { value: 1, label: "Dilluns" },
  { value: 2, label: "Dimarts" },
  { value: 3, label: "Dimecres" },
  { value: 4, label: "Dijous" },
  { value: 5, label: "Divendres" },
];

const FRANGES_HORARIES = [
  { start: "08:00", end: "09:00", label: "8:00 - 9:00" },
  { start: "09:00", end: "10:00", label: "9:00 - 10:00" },
  { start: "10:00", end: "11:00", label: "10:00 - 11:00" },
  { start: "11:00", end: "11:30", label: "11:00 - 11:30 (Pati)", isPati: true },
  { start: "11:30", end: "12:30", label: "11:30 - 12:30" },
  { start: "12:30", end: "13:30", label: "12:30 - 13:30" },
  { start: "13:30", end: "14:30", label: "13:30 - 14:30" },
];

export default function SchedulesNew() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showOnlyGuards, setShowOnlyGuards] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/horaris'],
  });

  // Fetch data for form
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
    enabled: isCreateDialogOpen,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/grups'],
    enabled: isCreateDialogOpen,
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ['/api/aules'],
    enabled: isCreateDialogOpen,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/materies'],
    enabled: isCreateDialogOpen,
  });

  // Fetch active academic year directly from backend
  const { data: activeAcademicYearData } = useQuery({
    queryKey: ['/api/anys-academics/active/id'],
  });

  // Fetch all academic years for reference
  const { data: academicYears = [] } = useQuery({
    queryKey: ['/api/anys-academics'],
  });

  const activeAcademicYear = academicYears?.length > 0 && activeAcademicYearData?.activeYearId 
    ? academicYears.find((year: any) => year.id === activeAcademicYearData.activeYearId)
    : null;

  // Filter schedules based on guard filter
  const filteredSchedules = showOnlyGuards 
    ? schedules.filter((schedule: Schedule) => 
        schedule.assignatura === "GUARDIA" || schedule.assignatura === "G"
      )
    : schedules;



  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await apiRequest('POST', '/api/horaris', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/horaris'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Horari creat",
        description: "L'horari s'ha creat correctament.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear l'horari.",
        variant: "destructive",
      });
    },
  });

  // Create multiple schedules mutation
  const createMultipleSchedulesMutation = useMutation({
    mutationFn: async (schedules: any[]) => {
      const response = await apiRequest('POST', '/api/horaris/bulk', { schedules });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/horaris'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Horaris creats",
        description: `S'han creat ${data.count} horaris consecutius correctament.`,
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'han pogut crear els horaris.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      professorId: 0,
      grupId: 0,
      aulaId: 0,
      diaSetmana: 1,
      horaInici: "08:00",
      horaFi: "09:00",
      assignatura: "",
    },
  });

  const editForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      professorId: 0,
      grupId: 0,
      aulaId: 0,
      diaSetmana: 1,
      horaInici: "08:00",
      horaFi: "09:00",
      assignatura: "",
    },
  });

  // Function to create multiple schedules from a long class
  const createMultipleSchedules = (data: ScheduleFormData, academicYearId: number) => {
    const startTime = new Date(`2000-01-01T${data.horaInici}:00`);
    const endTime = new Date(`2000-01-01T${data.horaFi}:00`);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    const schedules = [];
    for (let i = 0; i < durationHours; i++) {
      const slotStart = new Date(startTime.getTime() + (i * 60 * 60 * 1000));
      const slotEnd = new Date(slotStart.getTime() + (60 * 60 * 1000));
      
      schedules.push({
        professorId: data.professorId,
        grupId: data.grupId,
        aulaId: data.aulaId,
        diaSetmana: data.diaSetmana,
        horaInici: slotStart.toTimeString().substring(0, 5),
        horaFi: slotEnd.toTimeString().substring(0, 5),
        assignatura: data.assignatura || '',
        anyAcademicId: academicYearId
      });
    }
    return schedules;
  };

  // Create schedule handler
  const onSubmit = (data: ScheduleFormData) => {
    if (!activeAcademicYear) {
      toast({
        title: "Error",
        description: "No hi ha cap any acadèmic actiu. Si us plau, activa un any acadèmic primer.",
        variant: "destructive",
      });
      return;
    }

    // Check if it's a multi-hour class
    const startTime = new Date(`2000-01-01T${data.horaInici}:00`);
    const endTime = new Date(`2000-01-01T${data.horaFi}:00`);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    if (durationHours > 1) {
      // Create multiple one-hour schedules
      const schedules = createMultipleSchedules(data, activeAcademicYear.id);
      createMultipleSchedulesMutation.mutate(schedules);
    } else {
      // Create single schedule
      const horariData = {
        ...data,
        anyAcademicId: activeAcademicYear.id
      };
      createScheduleMutation.mutate(horariData);
    }
  };

  // Edit schedule handler
  const handleEditSchedule = (schedule: Schedule) => {
    // Reset form to clean state first
    editForm.reset({
      professorId: 0,
      grupId: 0,
      aulaId: 0,
      diaSetmana: 1,
      horaInici: "08:00",
      horaFi: "09:00",
      assignatura: "",
    });
    
    setEditingSchedule(schedule);
    
    // Immediately set the values
    const formData = {
      professorId: schedule.professor?.id || 0,
      grupId: schedule.grup?.id || 0,
      aulaId: schedule.aula?.id || 0,
      diaSetmana: schedule.diaSetmana,
      horaInici: schedule.horaInici?.substring(0, 5) || '',
      horaFi: schedule.horaFi?.substring(0, 5) || '',
      assignatura: schedule.assignatura || '',
    };
    
    // Use multiple approaches to ensure values are set
    Object.keys(formData).forEach((key) => {
      editForm.setValue(key as keyof ScheduleFormData, formData[key as keyof ScheduleFormData]);
    });
    
    setIsEditDialogOpen(true);
  };

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { id: number } & ScheduleFormData) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/horaris/${id}`, 'PATCH', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/horaris'] });
      setIsEditDialogOpen(false);
      setEditingSchedule(null);
      toast({
        title: "Èxit",
        description: "Horari actualitzat correctament.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No s'ha pogut actualitzar l'horari.",
        variant: "destructive",
      });
    },
  });

  // Function to group and sort groups by educational level
  const groupByLevel = (groups: any[]) => {
    const grouped = groups.reduce((acc, group) => {
      // Extract level from group name (e.g., "1rESO A" -> "1rESO")
      const levelMatch = group.nomGrup.match(/^(\d+r?\w+)/);
      const level = levelMatch ? levelMatch[1] : 'Altres';
      
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(group);
      return acc;
    }, {});

    // Sort groups within each level by letter
    Object.keys(grouped).forEach(level => {
      grouped[level].sort((a: any, b: any) => {
        const aLetter = a.nomGrup.match(/([A-Z])$/)?.[1] || '';
        const bLetter = b.nomGrup.match(/([A-Z])$/)?.[1] || '';
        return aLetter.localeCompare(bLetter);
      });
    });

    return grouped;
  };

  // Function to check if a schedule fits in a time slot
  const scheduleInTimeSlot = (schedule: Schedule, timeSlot: any) => {
    // Normalize time format (handle both HH:mm:ss and HH:mm)
    const normalizeTime = (time: string) => {
      if (!time) return '';
      const parts = time.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    };
    
    const scheduleStart = normalizeTime(schedule.horaInici);
    const scheduleEnd = normalizeTime(schedule.horaFi);
    const slotStart = normalizeTime(timeSlot.start);
    const slotEnd = normalizeTime(timeSlot.end);
    
    return scheduleStart === slotStart && scheduleEnd === slotEnd;
  };

  // Function to get schedules for a specific day and time slot
  const getSchedulesForSlot = (day: number, timeSlot: any) => {
    return (filteredSchedules as Schedule[]).filter(schedule => 
      schedule.diaSetmana === day && scheduleInTimeSlot(schedule, timeSlot)
    );
  };

  // Function to get conflicting color for multiple schedules in same slot
  const getConflictColor = (index: number) => {
    const colors = [
      'bg-blue-100 border-l-4 border-blue-500',
      'bg-green-100 border-l-4 border-green-500', 
      'bg-yellow-100 border-l-4 border-yellow-500',
      'bg-purple-100 border-l-4 border-purple-500',
      'bg-pink-100 border-l-4 border-pink-500',
    ];
    return colors[index % colors.length];
  };

  if (!schedules) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Graella d'Horaris</h1>
          <p className="text-text-secondary">Visualització setmanal per franges horàries i grups</p>
        </div>
        
        {/* Guard Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="guardFilter"
              checked={showOnlyGuards}
              onChange={(e) => setShowOnlyGuards(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label 
              htmlFor="guardFilter" 
              className="text-sm font-medium text-text-secondary cursor-pointer"
            >
              Mostrar només guardies
            </label>
          </div>
          
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nou Horari
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nou Horari</DialogTitle>
              <DialogDescription>
                Defineix una nova sessió de classe assignant professor, grup i aula.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="professorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona professor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professors.map((professor: any) => (
                              <SelectItem key={professor.id} value={professor.id.toString()}>
                                {professor.nom} {professor.cognoms}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grup</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona grup" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(groups) && groups.map((group: any) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.nomGrup}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aulaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aula</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona aula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classrooms.map((classroom: any) => (
                              <SelectItem key={classroom.id} value={classroom.id.toString()}>
                                {classroom.nomAula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diaSetmana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de la Setmana</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona dia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIES_SETMANA.map((dia) => (
                              <SelectItem key={dia.value} value={dia.value.toString()}>
                                {dia.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="horaInici"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora d'Inici</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FRANGES_HORARIES.map((franja) => (
                              <SelectItem key={franja.start} value={franja.start}>
                                {franja.start}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="horaFi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Fi</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FRANGES_HORARIES.map((franja) => (
                              <SelectItem key={franja.end} value={franja.end}>
                                {franja.end}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <div className="font-medium mb-1">Classes de múltiples hores</div>
                  <div>Si la classe dura més d'una hora, el sistema crearà automàticament horaris consecutius d'una hora cada un. Això és important per gestionar correctament les guardies dels professors.</div>
                </div>

                <FormField
                  control={form.control}
                  name="assignatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matèria (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una matèria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject: any) => (
                            <SelectItem key={`${subject.id}-${subject.nom}`} value={subject.nom}>
                              {subject.nom} - {subject.codi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel·lar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createScheduleMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {createScheduleMutation.isPending ? "Creant..." : "Crear Horari"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Grid with Tabs for Days */}
      <Tabs defaultValue="1" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {DIES_SETMANA.map((dia) => (
            <TabsTrigger key={dia.value} value={dia.value.toString()}>
              {dia.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DIES_SETMANA.map((dia) => {
          return (
            <TabsContent key={dia.value} value={dia.value.toString()} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Horari de {dia.label}
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Afegir Classe
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {FRANGES_HORARIES.map((franja) => {
                      const schedulesInSlot = getSchedulesForSlot(dia.value, franja);
                      
                      return (
                        <div key={`${dia.value}-${franja.start}`} className="border rounded-lg overflow-hidden">
                          <div className={`px-4 py-2 font-medium text-sm ${franja.isPati ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'}`}>
                            {franja.label}
                          </div>
                          <div className="p-4">
                            {schedulesInSlot.length === 0 ? (
                              franja.isPati ? (
                                <div className="text-center text-orange-600 text-sm">
                                  Hora del pati - No es programen classes
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-4">
                                  <span className="text-gray-400">Sense classes programades</span>
                                  <br />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                    className="mt-2"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Afegir classe
                                  </Button>
                                </div>
                              )
                            ) : (
                              (() => {
                                // Group schedules by educational level
                                const groupedSchedules = schedulesInSlot.reduce((acc: any, schedule: any) => {
                                  if (!schedule.grup?.nomGrup) return acc;
                                  
                                  // Extract level from group name (e.g., "1r ESO A" -> "1r ESO")
                                  const levelMatch = schedule.grup.nomGrup.match(/^(\d+r?\s*\w+)/);
                                  const level = levelMatch ? levelMatch[1] : 'Altres';
                                  
                                  if (!acc[level]) {
                                    acc[level] = [];
                                  }
                                  acc[level].push(schedule);
                                  return acc;
                                }, {});

                                const levelOrder = ['1r ESO', '2n ESO', '3r ESO', '4t ESO', '1r BATX', '2n BATX'];
                                const sortedLevels = Object.keys(groupedSchedules).sort((a, b) => {
                                  const aIndex = levelOrder.indexOf(a);
                                  const bIndex = levelOrder.indexOf(b);
                                  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                                  if (aIndex === -1) return 1;
                                  if (bIndex === -1) return -1;
                                  return aIndex - bIndex;
                                });

                                const levelColors = [
                                  'bg-blue-50 border-l-4 border-blue-500',
                                  'bg-green-50 border-l-4 border-green-500', 
                                  'bg-yellow-50 border-l-4 border-yellow-500',
                                  'bg-purple-50 border-l-4 border-purple-500',
                                  'bg-pink-50 border-l-4 border-pink-500',
                                  'bg-indigo-50 border-l-4 border-indigo-500',
                                ];

                                return (
                                  <div className="space-y-3">
                                    {sortedLevels.map((level, levelIndex) => (
                                      <div key={level} className={`rounded-lg p-3 ${levelColors[levelIndex % levelColors.length]}`}>
                                        <h4 className="font-semibold text-sm text-gray-700 mb-2">{level}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                          {groupedSchedules[level].map((schedule: any) => (
                                            <div 
                                              key={schedule.id}
                                              onClick={() => handleEditSchedule(schedule)}
                                              className="bg-white border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
                                            >
                                              <div className="font-medium text-blue-700 text-xs mb-1">
                                                {schedule.grup?.nomGrup}
                                              </div>
                                              <div className="text-gray-600 text-xs space-y-1">
                                                <div className="font-medium">{schedule.assignatura || 'Matèria no especificada'}</div>
                                                <div className="flex items-center gap-1">
                                                  <DoorOpen className="w-3 h-3" />
                                                  {schedule.aula?.nomAula || 'Aula no assignada'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Users className="w-3 h-3" />
                                                  {schedule.professor ? `${schedule.professor.nom} ${schedule.professor.cognoms}` : 'Professor no assignat'}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400">
                                                  <Clock className="w-3 h-3" />
                                                  {schedule.horaInici?.substring(0, 5)} - {schedule.horaFi?.substring(0, 5)}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Horari</DialogTitle>
          </DialogHeader>
          {editingSchedule && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => {
                if (editingSchedule) {
                  updateScheduleMutation.mutate({ id: editingSchedule.id, ...data });
                }
              })}>
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="professorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professor</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value && field.value > 0 ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un professor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(professors) && professors.map((professor: any) => (
                              <SelectItem key={professor.id} value={professor.id.toString()}>
                                {professor.nom} {professor.cognoms}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="grupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grup</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value && field.value > 0 ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un grup" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(groups) && groups.map((group: any) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.nomGrup}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="aulaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aula</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value && field.value > 0 ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una aula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(classrooms) && classrooms.map((classroom: any) => (
                              <SelectItem key={classroom.id} value={classroom.id.toString()}>
                                {classroom.nomAula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="assignatura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignatura</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom de l'assignatura" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="diaSetmana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DIES_SETMANA.map((dia) => (
                                <SelectItem key={dia.value} value={dia.value.toString()}>
                                  {dia.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="horaInici"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Inici</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="horaFi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Fi</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel·lar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateScheduleMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {updateScheduleMutation.isPending ? "Actualitzant..." : "Actualitzar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}