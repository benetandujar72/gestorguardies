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
import { Switch } from "@/components/ui/switch";
import { Route, Plus, Calendar, Clock, MapPin, Users, Edit2, Trash2, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
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

interface Group {
  id: number;
  nomGrup: string;
}

export default function OutingsEnhanced() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("totes");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch outings
  const { data: outings = [], isLoading } = useQuery({
    queryKey: ['/api/sortides', { thisWeek: showThisWeekOnly }],
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((sortida: any) => ({
        id: sortida.id,
        nomSortida: sortida.nomSortida,
        dataInici: sortida.dataInici,
        dataFi: sortida.dataFi,
        grup: {
          id: sortida.grup?.id || 0,
          nomGrup: sortida.grup?.nomGrup || 'Sense grup'
        },
        descripcio: sortida.descripcio,
        lloc: sortida.lloc,
        responsable: sortida.responsable,
      }));
    },
  });

  // Fetch groups for the form
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/grups'],
    enabled: isCreateDialogOpen || isEditDialogOpen,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((grup: any) => ({
        id: grup.id,
        nomGrup: grup.nomGrup
      }));
    },
  });

  // Fetch professors for the form
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
    enabled: isCreateDialogOpen || isEditDialogOpen,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((prof: any) => ({
        id: prof.id,
        nom: prof.nom,
        cognoms: prof.cognoms,
        fullName: `${prof.nom} ${prof.cognoms}`,
      }));
    },
  });

  // Create form
  const createForm = useForm<OutingFormData>({
    resolver: zodResolver(outingSchema),
    defaultValues: {
      nomSortida: "",
      dataInici: "",
      dataFi: "",
      grupId: 0,
      descripcio: "",
      lloc: "",
      responsable: "",
    },
  });

  // Edit form
  const editForm = useForm<OutingFormData>({
    resolver: zodResolver(outingSchema),
    defaultValues: {
      nomSortida: "",
      dataInici: "",
      dataFi: "",
      grupId: 0,
      descripcio: "",
      lloc: "",
      responsable: "",
    },
  });

  // Create outing mutation
  const createOutingMutation = useMutation({
    mutationFn: async (data: OutingFormData) => {
      const formattedData = {
        ...data,
        dataInici: new Date(data.dataInici).toISOString(),
        dataFi: new Date(data.dataFi).toISOString(),
      };
      return await apiRequest('POST', '/api/sortides', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Sortida creada",
        description: "La sortida s'ha creat correctament.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No s'ha pogut crear la sortida.",
        variant: "destructive",
      });
    },
  });

  // Edit outing mutation
  const editOutingMutation = useMutation({
    mutationFn: async (data: OutingFormData & { id: number }) => {
      const formattedData = {
        ...data,
        dataInici: new Date(data.dataInici).toISOString(),
        dataFi: new Date(data.dataFi).toISOString(),
      };
      return await apiRequest('PUT', `/api/sortides/${data.id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      setIsEditDialogOpen(false);
      setSelectedOuting(null);
      editForm.reset();
      toast({
        title: "Sortida actualitzada",
        description: "La sortida s'ha actualitzat correctament.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No s'ha pogut actualitzar la sortida.",
        variant: "destructive",
      });
    },
  });

  // Delete outing mutation
  const deleteOutingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/sortides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      toast({
        title: "Sortida eliminada",
        description: "La sortida s'ha eliminat correctament.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No s'ha pogut eliminar la sortida.",
        variant: "destructive",
      });
    },
  });

  const handleEditOuting = (outing: Outing) => {
    setSelectedOuting(outing);
    editForm.reset({
      nomSortida: outing.nomSortida,
      dataInici: format(parseISO(outing.dataInici), "yyyy-MM-dd'T'HH:mm"),
      dataFi: format(parseISO(outing.dataFi), "yyyy-MM-dd'T'HH:mm"),
      grupId: outing.grup.id,
      descripcio: outing.descripcio || "",
      lloc: outing.lloc || "",
      responsable: outing.responsable || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitCreate = (data: OutingFormData) => {
    createOutingMutation.mutate(data);
  };

  const onSubmitEdit = (data: OutingFormData) => {
    if (selectedOuting) {
      editOutingMutation.mutate({ ...data, id: selectedOuting.id });
    }
  };

  // Filter outings
  const filteredOutings = outings.filter(outing => {
    const matchesSearch = outing.nomSortida.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outing.grup.nomGrup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (outing.responsable && outing.responsable.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showThisWeekOnly) {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const outingStart = parseISO(outing.dataInici);
      
      return matchesSearch && outingStart >= weekStart && outingStart <= weekEnd;
    }
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sortides i Activitats</h1>
          <p className="text-gray-600">
            Gestió de sortides escolars i activitats extracurriculars
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Sortida
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Cercar sortides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="this-week"
                checked={showThisWeekOnly}
                onCheckedChange={setShowThisWeekOnly}
              />
              <label htmlFor="this-week" className="text-sm font-medium">
                Només aquesta setmana
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outings List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOutings.map((outing) => (
          <Card key={outing.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{outing.nomSortida}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Users className="w-4 h-4 mr-1" />
                    {outing.grup.nomGrup}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOuting(outing)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteOutingMutation.mutate(outing.id)}
                    disabled={deleteOutingMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    {format(parseISO(outing.dataInici), 'dd/MM/yyyy', { locale: ca })}
                    {outing.dataFi && outing.dataFi !== outing.dataInici && (
                      <> - {format(parseISO(outing.dataFi), 'dd/MM/yyyy', { locale: ca })}</>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    {format(parseISO(outing.dataInici), 'HH:mm', { locale: ca })}
                    {outing.dataFi && (
                      <> - {format(parseISO(outing.dataFi), 'HH:mm', { locale: ca })}</>
                    )}
                  </span>
                </div>

                {outing.lloc && (
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{outing.lloc}</span>
                  </div>
                )}

                {outing.responsable && (
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Responsable: {outing.responsable}</span>
                  </div>
                )}

                {outing.descripcio && (
                  <p className="text-sm text-gray-600 mt-2">{outing.descripcio}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOutings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hi ha sortides que coincideixin amb els filtres seleccionats</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Sortida</DialogTitle>
            <DialogDescription>
              Crea una nova sortida o activitat escolar.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="nomSortida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la sortida</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de la sortida..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
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
                        {groups.map((group: Group) => (
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
                  control={createForm.control}
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
                  control={createForm.control}
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

              <FormField
                control={createForm.control}
                name="lloc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lloc</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lloc de la sortida..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="responsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un professor..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Cap professor assignat</SelectItem>
                        {professors.map((prof: any) => (
                          <SelectItem key={prof.id} value={prof.fullName}>
                            {prof.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="descripcio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripció</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripció de la sortida..." />
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
                  disabled={createOutingMutation.isPending}
                >
                  Cancel·lar
                </Button>
                <Button type="submit" disabled={createOutingMutation.isPending}>
                  {createOutingMutation.isPending ? "Creant..." : "Crear Sortida"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sortida</DialogTitle>
            <DialogDescription>
              Modifica els detalls de la sortida seleccionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nomSortida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la sortida</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de la sortida..." />
                    </FormControl>
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
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un grup" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group: Group) => (
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
                  control={editForm.control}
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
                  control={editForm.control}
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

              <FormField
                control={editForm.control}
                name="lloc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lloc</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lloc de la sortida..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="responsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un professor..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Cap professor assignat</SelectItem>
                        {professors.map((prof: any) => (
                          <SelectItem key={prof.id} value={prof.fullName}>
                            {prof.fullName}
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
                name="descripcio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripció</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripció de la sortida..." />
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
                  disabled={editOutingMutation.isPending}
                >
                  Cancel·lar
                </Button>
                <Button type="submit" disabled={editOutingMutation.isPending}>
                  {editOutingMutation.isPending ? "Guardant..." : "Guardar Canvis"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}