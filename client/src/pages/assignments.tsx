import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Plus, Shield, Clock, Calendar, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const assignmentSchema = z.object({
  guardiaId: z.number().min(1, "Selecciona una guàrdia"),
  professorId: z.number().min(1, "Selecciona un professor"),
  prioritat: z.number().min(1).max(5),
  motiu: z.enum(["sortida", "reunio", "carrec", "equilibri"]).default("equilibri"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface Assignment {
  id: number;
  guardia: {
    id: number;
    data: string;
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
  motiu: string;
  timestampAsg: string;
}

export default function Assignments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2025-05-30');
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['/api/assignacions-guardia'],
    select: (data: Assignment[]) => data,
  });

  // Fetch guards for selection
  const { data: guards = [] } = useQuery({
    queryKey: ['/api/guardies'],
    enabled: isCreateDialogOpen,
  });

  // Fetch available professors for the selected guard
  const { data: availableProfessors = [] } = useQuery({
    queryKey: [`/api/professors/available/${selectedGuardId}`],
    enabled: isCreateDialogOpen && selectedGuardId !== null,
  });

  // Fetch all professors as fallback
  const { data: allProfessors = [] } = useQuery({
    queryKey: ['/api/professors'],
    enabled: isCreateDialogOpen && selectedGuardId === null,
  });

  // Use available professors if a guard is selected, otherwise use all professors
  const professors = selectedGuardId ? availableProfessors : allProfessors;

  // Filter assignments by selected date
  const filteredAssignments = assignments.filter(assignment => 
    assignment.guardia && assignment.guardia.data === selectedDate
  );

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      // Add the missing anyAcademicId field
      const payload = {
        ...data,
        anyAcademicId: 2, // Active academic year
        estat: "assignada"
      };
      const response = await apiRequest('POST', '/api/assignacions-guardia', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Assignació creada",
        description: "L'assignació s'ha creat correctament.",
      });
      form.reset();
    },
    onError: (error: any) => {
      console.error("Assignment creation error:", error);
      toast({
        title: "Error en crear l'assignació",
        description: error.message || "No s'ha pogut crear l'assignació. Comprova les dades.",
        variant: "destructive",
      });
    },
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (guardiaId: number) => {
      const response = await apiRequest('POST', '/api/assignacions-guardia/auto-assign', {
        guardiaId,
        date: selectedDate,
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
      toast({
        title: "Assignació automàtica completada",
        description: `Recomanacions generades amb ${result.confidence}% de confiança.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut realitzar l'assignació automàtica.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      prioritat: 3,
      motiu: "equilibri",
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case 'assignada':
        return 'bg-blue-100 text-blue-800';
      case 'acceptada':
        return 'bg-green-100 text-green-800';
      case 'rebutjada':
        return 'bg-red-100 text-red-800';
      case 'completada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (prioritat: number) => {
    if (prioritat === 1) return 'bg-red-100 text-red-800';
    if (prioritat === 2) return 'bg-orange-100 text-orange-800';
    if (prioritat === 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMotiuLabel = (motiu: string) => {
    switch (motiu) {
      case 'sortida':
        return 'Sortida/Activitat';
      case 'reunio':
        return 'Reunió';
      case 'carrec':
        return 'Càrrec Administratiu';
      case 'equilibri':
        return 'Equilibri de Càrrega';
      default:
        return motiu;
    }
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
          <h1 className="text-2xl font-bold text-text-primary">Assignacions de Guardies</h1>
          <p className="text-text-secondary">Gestiona les assignacions de professors a guardies</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => autoAssignMutation.mutate(1)}
            disabled={autoAssignMutation.isPending}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>
              {autoAssignMutation.isPending ? "Assignant..." : "Assignació IA"}
            </span>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Nova Assignació
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nova Assignació</DialogTitle>
                <DialogDescription>
                  Assigna un professor a una guàrdia específica.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="guardiaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guàrdia</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const guardId = Number(value);
                            field.onChange(guardId);
                            setSelectedGuardId(guardId);
                            form.resetField('professorId'); // Reset professor selection when guard changes
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una guàrdia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {guards.map((guard: any) => (
                              <SelectItem key={guard.id} value={guard.id.toString()}>
                                {guard.data} - {guard.horaInici} a {guard.horaFi} ({guard.tipusGuardia})
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
                    name="professorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professor</FormLabel>
                        {selectedGuardId && (
                          <div className="text-sm text-muted-foreground mb-2 p-2 bg-blue-50 rounded">
                            <p className="font-medium">Professors ordenats per prioritat:</p>
                            <ul className="text-xs mt-1 space-y-1">
                              <li>• <span className="text-green-700 font-medium">Alta</span>: Guàrdia programada</li>
                              <li>• <span className="text-blue-700 font-medium">Mitjana</span>: Té classe (pot substituir)</li>
                              <li>• <span className="text-gray-700 font-medium">Baixa</span>: Disponible</li>
                            </ul>
                          </div>
                        )}
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={!selectedGuardId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue 
                                placeholder={
                                  selectedGuardId 
                                    ? "Selecciona un professor disponible"
                                    : "Primer selecciona una guàrdia"
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professors.map((professor: any) => (
                              <SelectItem key={professor.id} value={professor.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{professor.nom} {professor.cognoms}</span>
                                  <div className="flex items-center gap-2 ml-2">
                                    <span className={`px-2 py-1 rounded text-xs ${professor.prioritatColor || 'bg-gray-100 text-gray-800'}`}>
                                      {professor.motiu || 'Disponible'}
                                    </span>
                                    {professor.grupObjectiu && (
                                      <span className="text-xs text-gray-500">
                                        {professor.grupObjectiu}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prioritat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioritat (1-5)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="5" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motiu"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motiu</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sortida">Sortida/Activitat</SelectItem>
                              <SelectItem value="reunio">Reunió</SelectItem>
                              <SelectItem value="carrec">Càrrec Administratiu</SelectItem>
                              <SelectItem value="equilibri">Equilibri de Càrrega</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                      disabled={createAssignmentMutation.isPending}
                      className="bg-primary hover:bg-blue-800"
                    >
                      {createAssignmentMutation.isPending ? "Creant..." : "Crear Assignació"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-text-secondary">
            {filteredAssignments.length} assignacions trobades
          </span>
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha assignacions
            </h3>
            <p className="text-gray-500 mb-4">
              Per aquesta data no s'han fet assignacions de guardies encara.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Crear Primera Assignació
            </Button>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {assignment.professor.nom} {assignment.professor.cognoms}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Shield className="w-3 h-3" />
                      <span className="capitalize">{assignment.guardia.tipusGuardia}</span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(assignment.estat)}>
                    {assignment.estat}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {assignment.guardia.horaInici} - {assignment.guardia.horaFi}
                      </span>
                    </span>
                    {assignment.guardia.lloc && (
                      <span className="text-text-secondary">{assignment.guardia.lloc}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(assignment.prioritat)}>
                      Prioritat {assignment.prioritat}
                    </Badge>
                    <span className="text-xs text-text-secondary">
                      {getMotiuLabel(assignment.motiu)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">
                        Assignat: {new Date(assignment.timestampAsg).toLocaleDateString('ca-ES')}
                      </span>
                      <Button size="sm" variant="outline">
                        Detalls
                      </Button>
                    </div>
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
