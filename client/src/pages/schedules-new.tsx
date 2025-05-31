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
import { Calendar, Clock, Plus, Users, DoorOpen, BookOpen } from "lucide-react";
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

  // Debug: Check API response
  console.log("Active year API response:", activeAcademicYearData);
  console.log("All academic years:", academicYears);
  console.log("Found active year:", activeAcademicYear);

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

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      diaSetmana: 1,
      horaInici: "08:00",
      horaFi: "09:00",
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (!activeAcademicYear) {
      toast({
        title: "Error",
        description: "No hi ha cap any acadèmic actiu. Si us plau, activa un any acadèmic primer.",
        variant: "destructive",
      });
      return;
    }

    const horariData = {
      ...data,
      anyAcademicId: activeAcademicYear.id
    };
    createScheduleMutation.mutate(horariData);
  };

  // Function to sort groups by level and letter
  const sortGroups = (groups: any[]) => {
    return groups.sort((a, b) => {
      const parseGroup = (nomGrup: string) => {
        const match = nomGrup.match(/(\d+).*?([A-Z])$/);
        if (match) {
          return { level: parseInt(match[1]), letter: match[2] };
        }
        return { level: 999, letter: 'Z' };
      };

      const groupA = parseGroup(a.nomGrup);
      const groupB = parseGroup(b.nomGrup);

      if (groupA.level !== groupB.level) {
        return groupA.level - groupB.level;
      }
      return groupA.letter.localeCompare(groupB.letter);
    });
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
    return (schedules as Schedule[]).filter(schedule => 
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
                            {sortGroups(groups).map((group: any) => (
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

        {DIES_SETMANA.map((dia) => (
          <TabsContent key={dia.value} value={dia.value.toString()} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horari de {dia.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                          Franja Horària
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                          Classes Programades
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {FRANGES_HORARIES.map((franja) => {
                        const schedulesInSlot = getSchedulesForSlot(dia.value, franja);

                        return (
                          <tr key={`${dia.value}-${franja.start}`} className="hover:bg-gray-50">
                            <td className={`border border-gray-300 px-4 py-3 font-medium ${franja.isPati ? 'bg-orange-50' : ''}`}>
                              {franja.label}
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              {schedulesInSlot.length === 0 ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 italic">
                                    {franja.isPati ? 'Pati / Esplai' : 'Sense classes programades'}
                                  </span>
                                  {!franja.isPati && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setIsCreateDialogOpen(true)}
                                      className="ml-2"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Afegir
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {schedulesInSlot.map((schedule, index) => (
                                    <div 
                                      key={schedule.id} 
                                      className={`p-3 rounded-lg ${getConflictColor(index)}`}
                                    >
                                      <div className="font-medium text-sm">
                                        {schedule.grup?.nomGrup || 'Grup no assignat'}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                                        <div><strong>Matèria:</strong> {schedule.assignatura || 'No especificada'}</div>
                                        <div><strong>Aula:</strong> {schedule.aula?.nomAula || 'No assignada'}</div>
                                        <div><strong>Professor:</strong> {schedule.professor ? `${schedule.professor.nom} ${schedule.professor.cognoms}` : 'No assignat'}</div>
                                      </div>
                                    </div>
                                  ))}
                                  {schedulesInSlot.length > 1 && (
                                    <div className="text-xs text-orange-600 font-medium">
                                      ⚠️ Múltiples classes a la mateixa franja
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}