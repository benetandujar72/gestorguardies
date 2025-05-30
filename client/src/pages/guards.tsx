import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Plus, Shield, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const guardSchema = z.object({
  data: z.string().min(1, "La data és obligatòria"),
  horaInici: z.string().min(1, "L'hora d'inici és obligatòria"),
  horaFi: z.string().min(1, "L'hora de fi és obligatòria"),
  tipusGuardia: z.string().min(1, "El tipus de guàrdia és obligatori"),
  lloc: z.string().optional(),
  observacions: z.string().optional(),
});

type GuardFormData = z.infer<typeof guardSchema>;

interface Guard {
  id: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  lloc?: string;
  observacions?: string;
  assignacions?: Array<{
    id: number;
    professor: { nom: string; cognoms: string };
    prioritat: number;
    estat: string;
  }>;
}

export default function Guards() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch guards
  const { data: guards = [], isLoading } = useQuery({
    queryKey: ['/api/guardies'],
    select: (data: Guard[]) => data,
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (guardiaId: number) => {
      const response = await apiRequest('POST', '/api/assignacions-guardia/auto-assign', { guardiaId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignacions-guardia'] });
      toast({
        title: "Assignació automàtica completada",
        description: `S'han assignat ${data.assignacions?.length || 0} professors automàticament.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut fer l'assignació automàtica.",
        variant: "destructive",
      });
    },
  });

  // Filter guards by selected date
  const filteredGuards = guards.filter(guard => guard.data === selectedDate);

  // Create guard mutation
  const createGuardMutation = useMutation({
    mutationFn: async (data: GuardFormData) => {
      const response = await apiRequest('POST', '/api/guardies', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardies'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Guàrdia creada",
        description: "La guàrdia s'ha creat correctament.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear la guàrdia.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<GuardFormData>({
    resolver: zodResolver(guardSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      tipusGuardia: "pati",
      horaInici: "08:00",
      horaFi: "09:00",
    },
  });

  const onSubmit = (data: GuardFormData) => {
    createGuardMutation.mutate(data);
  };

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case 'assignada':
        return 'bg-green-100 text-green-800';
      case 'pendent':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (tipus: string) => {
    switch (tipus) {
      case 'pati':
        return <Users className="w-4 h-4" />;
      case 'biblioteca':
        return <MapPin className="w-4 h-4" />;
      case 'aula':
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió de Guardies</h1>
          <p className="text-text-secondary">Crea i gestiona les guardies del centre educatiu</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nova Guàrdia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nova Guàrdia</DialogTitle>
              <DialogDescription>
                Defineix els detalls de la nova guàrdia a assignar.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="tipusGuardia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipus de Guàrdia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pati">Pati</SelectItem>
                            <SelectItem value="biblioteca">Biblioteca</SelectItem>
                            <SelectItem value="aula">Aula</SelectItem>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="menjador">Menjador</SelectItem>
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
                  name="lloc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lloc (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ubicació específica..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observacions (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes addicionals..." {...field} />
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
                    disabled={createGuardMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {createGuardMutation.isPending ? "Creant..." : "Crear Guàrdia"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            {filteredGuards.length} guardies programades
          </span>
        </div>
      </div>

      {/* Guards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuards.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha guardies programades
            </h3>
            <p className="text-gray-500 mb-4">
              Per aquesta data no s'han programat guardies encara.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Crear Primera Guàrdia
            </Button>
          </div>
        ) : (
          filteredGuards.map((guard) => (
            <Card key={guard.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(guard.tipusGuardia)}
                    <CardTitle className="text-lg capitalize">
                      {guard.tipusGuardia}
                    </CardTitle>
                  </div>
                  <Badge className={getStatusColor(guard.estat)}>
                    {guard.estat}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{guard.horaInici} - {guard.horaFi}</span>
                    </span>
                    {guard.lloc && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{guard.lloc}</span>
                      </span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {guard.assignacions && guard.assignacions.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Assignat a:</h4>
                    {guard.assignacions.map((assignacio) => (
                      <div key={assignacio.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {assignacio.professor.nom} {assignacio.professor.cognoms}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Prioritat {assignacio.prioritat}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Sense assignar</p>
                    <div className="flex flex-col space-y-2 mt-2">
                      <Button 
                        size="sm" 
                        onClick={() => autoAssignMutation.mutate(guard.id)}
                        disabled={autoAssignMutation.isPending}
                        className="bg-primary hover:bg-blue-800"
                      >
                        {autoAssignMutation.isPending ? "Assignant..." : "Assignar Automàticament"}
                      </Button>
                      <Button size="sm" variant="outline">
                        Assignar Manual
                      </Button>
                    </div>
                  </div>
                )}
                
                {guard.observacions && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{guard.observacions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
