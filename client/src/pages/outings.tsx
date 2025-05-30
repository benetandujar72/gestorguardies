import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Route, Plus, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ca } from "date-fns/locale";

const outingSchema = z.object({
  nomSortida: z.string().min(1, "El nom de la sortida és obligatori"),
  dataInici: z.string().min(1, "La data d'inici és obligatòria"),
  dataFi: z.string().min(1, "La data de fi és obligatòria"),
  grupId: z.number().min(1, "Selecciona un grup"),
  descripcio: z.string().optional(),
  lloc: z.string().optional(),
  responsable: z.string().optional(),
});

type OutingFormData = z.infer<typeof outingSchema>;

interface Outing {
  id: number;
  nomSortida: string;
  dataInici: string;
  dataFi: string;
  grup: {
    id: number;
    nomGrup: string;
  };
  descripcio?: string;
  lloc?: string;
  responsable?: string;
}

export default function Outings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("totes");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch outings
  const { data: outings = [], isLoading } = useQuery({
    queryKey: ['/api/sortides', { thisWeek: showThisWeekOnly }],
  });

  // Fetch groups for selection
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/grups'],
    enabled: isCreateDialogOpen,
  });

  // Create outing mutation
  const createOutingMutation = useMutation({
    mutationFn: async (data: OutingFormData) => {
      const formattedData = {
        ...data,
        dataInici: new Date(data.dataInici).toISOString(),
        dataFi: new Date(data.dataFi).toISOString(),
      };
      const response = await apiRequest('POST', '/api/sortides', formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sortida creada",
        description: "La sortida s'ha creat correctament.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear la sortida.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<OutingFormData>({
    resolver: zodResolver(outingSchema),
    defaultValues: {
      dataInici: new Date().toISOString().split('T')[0] + 'T09:00',
      dataFi: new Date().toISOString().split('T')[0] + 'T17:00',
    },
  });

  const onSubmit = (data: OutingFormData) => {
    createOutingMutation.mutate(data);
  };

  const getOutingStatus = (dataInici: string, dataFi: string) => {
    const now = new Date();
    const start = new Date(dataInici);
    const end = new Date(dataFi);

    if (now < start) return { status: 'programada', color: 'bg-blue-100 text-blue-800' };
    if (now >= start && now <= end) return { status: 'en curs', color: 'bg-green-100 text-green-800' };
    return { status: 'finalitzada', color: 'bg-gray-100 text-gray-800' };
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), "dd MMM yyyy 'a les' HH:mm", { locale: ca });
    } catch {
      return dateTime;
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió de Sortides</h1>
          <p className="text-text-secondary">Organitza les sortides i activitats extraescolars</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nova Sortida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nova Sortida</DialogTitle>
              <DialogDescription>
                Programa una nova sortida o activitat extraescolar per a un grup.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nomSortida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la Sortida</FormLabel>
                      <FormControl>
                        <Input placeholder="Visita al Museu de Ciències..." {...field} />
                      </FormControl>
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
                            <SelectValue placeholder="Selecciona un grup" />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataInici"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data i Hora d'Inici</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataFi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data i Hora de Fi</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lloc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lloc (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Museu de Ciències..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom del professor responsable..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descripcio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripció (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder="Descripció de l'activitat..." 
                          {...field} 
                        />
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
                    disabled={createOutingMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {createOutingMutation.isPending ? "Creant..." : "Crear Sortida"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <Button
            variant={showThisWeekOnly ? "default" : "outline"}
            onClick={() => setShowThisWeekOnly(!showThisWeekOnly)}
            size="sm"
          >
            {showThisWeekOnly ? "Mostrar totes" : "Aquesta setmana"}
          </Button>
          <span className="text-sm text-text-secondary">
            {outings.length} sortides trobades
          </span>
        </div>
      </div>

      {/* Outings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha sortides programades
            </h3>
            <p className="text-gray-500 mb-4">
              {showThisWeekOnly 
                ? "Aquesta setmana no hi ha sortides programades."
                : "Encara no s'han programat sortides."
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Programar Primera Sortida
            </Button>
          </div>
        ) : (
          outings.map((outing: Outing) => {
            const statusInfo = getOutingStatus(outing.dataInici, outing.dataFi);
            
            return (
              <Card key={outing.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Route className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">
                        {outing.nomSortida}
                      </CardTitle>
                    </div>
                    <Badge className={statusInfo.color}>
                      {statusInfo.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <Users className="w-3 h-3" />
                    <span>{outing.grup?.nomGrup || 'Grup no assignat'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex items-start space-x-2 mb-2">
                        <Calendar className="w-3 h-3 mt-0.5 text-text-secondary" />
                        <div>
                          <div className="text-text-primary">
                            <strong>Inici:</strong> {formatDateTime(outing.dataInici)}
                          </div>
                          <div className="text-text-primary">
                            <strong>Fi:</strong> {formatDateTime(outing.dataFi)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {outing.lloc && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-3 h-3 text-text-secondary" />
                        <span className="text-text-secondary">{outing.lloc}</span>
                      </div>
                    )}

                    {outing.responsable && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-3 h-3 text-text-secondary" />
                        <span className="text-text-secondary">
                          Responsable: {outing.responsable}
                        </span>
                      </div>
                    )}

                    {outing.descripcio && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {outing.descripcio}
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Detalls
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
