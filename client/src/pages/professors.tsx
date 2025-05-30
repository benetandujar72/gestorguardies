import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Presentation, Plus, Search, Mail, UserCheck, Calendar, BarChart3, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const professorSchema = z.object({
  nom: z.string().min(1, "El nom és obligatori"),
  cognoms: z.string().min(1, "Els cognoms són obligatoris"),
  email: z.string().email("Email no vàlid"),
  rol: z.enum(["professor", "cap_estudis", "coordinador", "director"]).default("professor"),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

interface Professor {
  id: number;
  nom: string;
  cognoms: string;
  email: string;
  rol: string;
  createdAt: string;
}

export default function Professors() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch professors
  const { data: professors = [], isLoading } = useQuery({
    queryKey: ['/api/professors'],
  });

  // Fetch workload balance for professors
  const { data: workloadBalance = [] } = useQuery({
    queryKey: ['/api/analytics/workload-balance'],
  });

  // Create professor mutation
  const createProfessorMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      const response = await apiRequest('POST', '/api/professors', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professors'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Professor creat",
        description: "El professor s'ha creat correctament.",
      });
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear el professor.",
        variant: "destructive",
      });
    },
  });

  // Update professor mutation
  const updateProfessorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProfessorFormData }) => {
      const response = await apiRequest('PUT', `/api/professors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professors'] });
      setIsEditDialogOpen(false);
      setSelectedProfessor(null);
      toast({
        title: "Professor actualitzat",
        description: "El professor s'ha actualitzat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar el professor.",
        variant: "destructive",
      });
    },
  });

  // Delete professor mutation
  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/professors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professors'] });
      toast({
        title: "Professor eliminat",
        description: "El professor s'ha eliminat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar el professor.",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      rol: "professor",
    },
  });

  const editForm = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
  });

  // Filter professors
  const filteredProfessors = professors.filter((professor: Professor) =>
    professor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.cognoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onCreateSubmit = (data: ProfessorFormData) => {
    createProfessorMutation.mutate(data);
  };

  const onEditSubmit = (data: ProfessorFormData) => {
    if (selectedProfessor) {
      updateProfessorMutation.mutate({ id: selectedProfessor.id, data });
    }
  };

  const handleEdit = (professor: Professor) => {
    setSelectedProfessor(professor);
    editForm.reset({
      nom: professor.nom,
      cognoms: professor.cognoms,
      email: professor.email,
      rol: professor.rol as any,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (professor: Professor) => {
    if (confirm(`Estàs segur que vols eliminar el professor ${professor.nom} ${professor.cognoms}?`)) {
      deleteProfessorMutation.mutate(professor.id);
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case "director":
        return "bg-red-100 text-red-800";
      case "cap_estudis":
        return "bg-purple-100 text-purple-800";
      case "coordinador":
        return "bg-blue-100 text-blue-800";
      case "professor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case "director":
        return "Director";
      case "cap_estudis":
        return "Cap d'Estudis";
      case "coordinador":
        return "Coordinador";
      case "professor":
        return "Professor";
      default:
        return rol;
    }
  };

  const getInitials = (nom: string, cognoms: string) => {
    return `${nom[0]}${cognoms.split(' ')[0]?.[0] || ''}`.toUpperCase();
  };

  const getProfessorWorkload = (professorId: number) => {
    return workloadBalance.find((w: any) => w.professorId === professorId)?.guardCount || 0;
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió de Professors</h1>
          <p className="text-text-secondary">Administra el personal docent del centre educatiu</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nou Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Afegir Nou Professor</DialogTitle>
              <DialogDescription>
                Registra un nou professor al sistema del centre educatiu.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom del professor..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="cognoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognoms</FormLabel>
                        <FormControl>
                          <Input placeholder="Cognoms del professor..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@centre.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="coordinador">Coordinador</SelectItem>
                          <SelectItem value="cap_estudis">Cap d'Estudis</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
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
                    disabled={createProfessorMutation.isPending}
                    className="bg-primary hover:bg-blue-800"
                  >
                    {createProfessorMutation.isPending ? "Creant..." : "Crear Professor"}
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
                <p className="text-text-secondary text-sm">Total Professors</p>
                <p className="text-2xl font-bold text-text-primary">{professors.length}</p>
              </div>
              <Presentation className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Directors</p>
                <p className="text-2xl font-bold text-text-primary">
                  {professors.filter((p: Professor) => p.rol === 'director').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Coordinadors</p>
                <p className="text-2xl font-bold text-text-primary">
                  {professors.filter((p: Professor) => p.rol === 'coordinador' || p.rol === 'cap_estudis').length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Professors Actius</p>
                <p className="text-2xl font-bold text-text-primary">
                  {professors.filter((p: Professor) => p.rol === 'professor').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <Input
            placeholder="Cercar professors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Professors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Presentation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No s'han trobat professors" : "No hi ha professors"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "Prova a modificar els termes de cerca."
                : "Comença afegint el primer professor al sistema."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Afegir Primer Professor
              </Button>
            )}
          </div>
        ) : (
          filteredProfessors.map((professor: Professor) => (
            <Card key={professor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-white font-semibold">
                        {getInitials(professor.nom, professor.cognoms)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {professor.nom} {professor.cognoms}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{professor.email}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getRoleColor(professor.rol)}>
                    {getRoleLabel(professor.rol)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Guardies assignades</span>
                    <span className="font-medium text-text-primary">
                      {getProfessorWorkload(professor.id)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Registrat</span>
                    <span className="text-text-primary">
                      {new Date(professor.createdAt).toLocaleDateString('ca-ES')}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(professor)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDelete(professor)}
                      disabled={deleteProfessorMutation.isPending}
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

      {/* Edit Professor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
            <DialogDescription>
              Modifica la informació del professor seleccionat.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom del professor..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="cognoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognoms</FormLabel>
                      <FormControl>
                        <Input placeholder="Cognoms del professor..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@centre.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="coordinador">Coordinador</SelectItem>
                        <SelectItem value="cap_estudis">Cap d'Estudis</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel·lar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfessorMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  {updateProfessorMutation.isPending ? "Actualitzant..." : "Actualitzar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
