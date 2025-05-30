import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DoorOpen, Plus, Search, Users, Monitor, Beaker, Calculator, Edit, Trash2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const classroomSchema = z.object({
  nomAula: z.string().min(1, "El nom de l'aula és obligatori"),
  capacitat: z.number().min(1, "La capacitat ha de ser almenys 1").optional(),
  tipus: z.string().optional(),
  equipament: z.string().optional(),
});

type ClassroomFormData = z.infer<typeof classroomSchema>;

interface Classroom {
  id: number;
  nomAula: string;
  capacitat?: number;
  tipus?: string;
  equipament?: string;
  createdAt: string;
}

const CLASSROOM_TYPES = [
  { value: "aula_ordinaria", label: "Aula Ordinària", icon: DoorOpen },
  { value: "laboratori", label: "Laboratori", icon: Beaker },
  { value: "informatica", label: "Informàtica", icon: Monitor },
  { value: "matematiques", label: "Matemàtiques", icon: Calculator },
  { value: "gymnasium", label: "Gimnàs", icon: Users },
  { value: "biblioteca", label: "Biblioteca", icon: DoorOpen },
  { value: "taller", label: "Taller", icon: DoorOpen },
  { value: "sala_actes", label: "Sala d'Actes", icon: Users },
];

export default function Classrooms() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classrooms
  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ['/api/aules'],
  });

  // Create classroom mutation
  const createClassroomMutation = useMutation({
    mutationFn: async (data: ClassroomFormData) => {
      const response = await apiRequest('POST', '/api/aules', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aules'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Aula creada",
        description: "L'aula s'ha creat correctament.",
      });
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear l'aula.",
        variant: "destructive",
      });
    },
  });

  // Update classroom mutation
  const updateClassroomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClassroomFormData }) => {
      const response = await apiRequest('PUT', `/api/aules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aules'] });
      setIsEditDialogOpen(false);
      setSelectedClassroom(null);
      toast({
        title: "Aula actualitzada",
        description: "L'aula s'ha actualitzat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar l'aula.",
        variant: "destructive",
      });
    },
  });

  // Delete classroom mutation
  const deleteClassroomMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/aules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aules'] });
      toast({
        title: "Aula eliminada",
        description: "L'aula s'ha eliminat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar l'aula.",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      tipus: "aula_ordinaria",
    },
  });

  const editForm = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
  });

  // Filter classrooms
  const filteredClassrooms = classrooms.filter((classroom: Classroom) => {
    const matchesSearch = classroom.nomAula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classroom.tipus && classroom.tipus.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || classroom.tipus === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group classrooms by type
  const classroomsByType = CLASSROOM_TYPES.reduce((acc, type) => {
    acc[type.value] = filteredClassrooms.filter((c: Classroom) => c.tipus === type.value);
    return acc;
  }, {} as Record<string, Classroom[]>);

  const onCreateSubmit = (data: ClassroomFormData) => {
    createClassroomMutation.mutate(data);
  };

  const onEditSubmit = (data: ClassroomFormData) => {
    if (selectedClassroom) {
      updateClassroomMutation.mutate({ id: selectedClassroom.id, data });
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    editForm.reset({
      nomAula: classroom.nomAula,
      capacitat: classroom.capacitat,
      tipus: classroom.tipus || "aula_ordinaria",
      equipament: classroom.equipament || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (classroom: Classroom) => {
    if (confirm(`Estàs segur que vols eliminar l'aula ${classroom.nomAula}?`)) {
      deleteClassroomMutation.mutate(classroom.id);
    }
  };

  const getTypeColor = (tipus?: string) => {
    switch (tipus) {
      case "laboratori":
        return "bg-purple-100 text-purple-800";
      case "informatica":
        return "bg-blue-100 text-blue-800";
      case "matematiques":
        return "bg-green-100 text-green-800";
      case "gymnasium":
        return "bg-orange-100 text-orange-800";
      case "biblioteca":
        return "bg-indigo-100 text-indigo-800";
      case "taller":
        return "bg-yellow-100 text-yellow-800";
      case "sala_actes":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (tipus?: string) => {
    const type = CLASSROOM_TYPES.find(t => t.value === tipus);
    return type?.label || "Aula Ordinària";
  };

  const getTypeIcon = (tipus?: string) => {
    const type = CLASSROOM_TYPES.find(t => t.value === tipus);
    const Icon = type?.icon || DoorOpen;
    return <Icon className="w-4 h-4" />;
  };

  const getTotalCapacity = () => {
    return classrooms.reduce((total: number, classroom: Classroom) => {
      return total + (classroom.capacitat || 0);
    }, 0);
  };

  const getAverageCapacity = () => {
    const total = getTotalCapacity();
    return classrooms.length > 0 ? Math.round(total / classrooms.length) : 0;
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió d'Aules</h1>
          <p className="text-text-secondary">Administra les aules i espais del centre educatiu</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nova Aula</DialogTitle>
              <DialogDescription>
                Registra una nova aula o espai al sistema del centre educatiu.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="nomAula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'Aula</FormLabel>
                      <FormControl>
                        <Input placeholder="Aula 101, Laboratori Química..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="tipus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipus d'Aula</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CLASSROOM_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="capacitat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacitat</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="equipament"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipament (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder="Descripció de l'equipament disponible..." 
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
                    disabled={createClassroomMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {createClassroomMutation.isPending ? "Creant..." : "Crear Aula"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Aules</p>
                <p className="text-2xl font-bold text-text-primary">{classrooms.length}</p>
              </div>
              <DoorOpen className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Capacitat Total</p>
                <p className="text-2xl font-bold text-text-primary">{getTotalCapacity()}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Capacitat Mitjana</p>
                <p className="text-2xl font-bold text-text-primary">{getAverageCapacity()}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Tipus d'Aules</p>
                <p className="text-2xl font-bold text-text-primary">
                  {new Set(classrooms.map((c: Classroom) => c.tipus)).size}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <Input
            placeholder="Cercar aules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tipus d'aula" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tots els tipus</SelectItem>
            {CLASSROOM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">
            {filteredClassrooms.length} aules trobades
          </span>
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClassrooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No s'han trobat aules" : "No hi ha aules"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "Prova a modificar els termes de cerca."
                : "Comença registrant la primera aula del centre."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Crear Primera Aula
              </Button>
            )}
          </div>
        ) : (
          filteredClassrooms.map((classroom: Classroom) => (
            <Card key={classroom.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(classroom.tipus)}
                    <CardTitle className="text-lg">{classroom.nomAula}</CardTitle>
                  </div>
                  <Badge className={getTypeColor(classroom.tipus)}>
                    {getTypeLabel(classroom.tipus)}
                  </Badge>
                </div>
                {classroom.capacitat && (
                  <CardDescription className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Capacitat: {classroom.capacitat} persones</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classroom.equipament && (
                    <div>
                      <h4 className="text-sm font-medium text-text-primary mb-1">Equipament</h4>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {classroom.equipament}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Registrada</span>
                    <span className="text-text-primary">
                      {new Date(classroom.createdAt).toLocaleDateString('ca-ES')}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(classroom)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDelete(classroom)}
                      disabled={deleteClassroomMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Classroom Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Modifica la informació de l'aula seleccionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nomAula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'Aula</FormLabel>
                    <FormControl>
                      <Input placeholder="Aula 101, Laboratori Química..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="tipus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipus d'Aula</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASSROOM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="capacitat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacitat</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="equipament"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipament (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        placeholder="Descripció de l'equipament disponible..." 
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel·lar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateClassroomMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  {updateClassroomMutation.isPending ? "Actualitzant..." : "Actualitzar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
