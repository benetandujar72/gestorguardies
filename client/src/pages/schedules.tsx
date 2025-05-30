import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  diaSetmana: z.number().min(1).max(7),
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
  { value: 6, label: "Dissabte" },
  { value: 7, label: "Diumenge" },
];

export default function Schedules() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['/api/horaris'],
  });

  // Fetch professors for selection
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
    enabled: isCreateDialogOpen,
  });

  // Fetch groups for selection
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/grups'],
    enabled: isCreateDialogOpen,
  });

  // Fetch classrooms for selection
  const { data: classrooms = [] } = useQuery({
    queryKey: ['/api/aules'],
    enabled: isCreateDialogOpen,
  });

  // Filter schedules by selected day
  const filteredSchedules = schedules.filter((schedule: Schedule) => 
    schedule.diaSetmana === selectedDay
  );

  // Sort schedules by time
  const sortedSchedules = filteredSchedules.sort((a: Schedule, b: Schedule) => {
    return a.horaInici.localeCompare(b.horaInici);
  });

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
    createScheduleMutation.mutate(data);
  };

  const getDayName = (day: number) => {
    return DIES_SETMANA.find(d => d.value === day)?.label || "";
  };

  const getTimeSlotColor = (horaInici: string) => {
    const hour = parseInt(horaInici.split(':')[0]);
    if (hour < 10) return 'bg-blue-100 text-blue-800';
    if (hour < 14) return 'bg-green-100 text-green-800';
    if (hour < 17) return 'bg-orange-100 text-orange-800';
    return 'bg-purple-100 text-purple-800';
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió d'Horaris</h1>
          <p className="text-text-secondary">Organitza els horaris de professors, grups i aules</p>
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
                            {groups.map((group: any) => (
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
                        <FormLabel>Hora de Fi</FormLabel>
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
                  name="assignatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignatura (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'assignatura..." {...field} />
                      </FormControl>
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

      {/* Day Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(Number(value))}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIES_SETMANA.map((dia) => (
                <SelectItem key={dia.value} value={dia.value.toString()}>
                  {dia.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-text-secondary">
            {sortedSchedules.length} sessions programades
          </span>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-4">
        {sortedSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha horaris programats
            </h3>
            <p className="text-gray-500 mb-4">
              Per {getDayName(selectedDay).toLowerCase()} no s'han programat sessions encara.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Programar Primera Sessió
            </Button>
          </div>
        ) : (
          sortedSchedules.map((schedule: Schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge className={getTimeSlotColor(schedule.horaInici)}>
                      {schedule.horaInici} - {schedule.horaFi}
                    </Badge>
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {schedule.assignatura || "Sessió de Classe"}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {schedule.professor ? 
                              `${schedule.professor.nom} ${schedule.professor.cognoms}` : 
                              'Professor no assignat'
                            }
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>
                            {schedule.grup ? 
                              schedule.grup.nomGrup : 
                              schedule.assignatura === 'G' ? 'Guàrdia' : 'Grup no assignat'
                            }
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DoorOpen className="w-3 h-3" />
                          <span>
                            {schedule.aula ? 
                              schedule.aula.nomAula : 
                              schedule.assignatura === 'G' ? 'Pati/Vigilància' : 'Aula no assignada'
                            }
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
