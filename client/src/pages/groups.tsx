import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersIcon, Plus, Search, GraduationCap, Users, BookOpen, Edit, Trash2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const groupSchema = z.object({
  nomGrup: z.string().min(1, "El nom del grup és obligatori"),
  curs: z.string().optional(),
  nivell: z.string().optional(),
});

const studentSchema = z.object({
  nom: z.string().min(1, "El nom és obligatori"),
  cognoms: z.string().min(1, "Els cognoms són obligatoris"),
  grupId: z.number().min(1, "Selecciona un grup"),
  email: z.string().email("Email no vàlid").optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;
type StudentFormData = z.infer<typeof studentSchema>;

interface Group {
  id: number;
  nomGrup: string;
  curs?: string;
  nivell?: string;
  createdAt: string;
}

interface Student {
  id: number;
  nom: string;
  cognoms: string;
  grupId: number;
  email?: string;
  createdAt: string;
}

export default function Groups() {
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isCreateStudentDialogOpen, setIsCreateStudentDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState("groups");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/grups'],
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/alumnes'],
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const response = await apiRequest('POST', '/api/grups', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grups'] });
      setIsCreateGroupDialogOpen(false);
      toast({
        title: "Grup creat",
        description: "El grup s'ha creat correctament.",
      });
      groupForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear el grup.",
        variant: "destructive",
      });
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiRequest('POST', '/api/alumnes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alumnes'] });
      setIsCreateStudentDialogOpen(false);
      toast({
        title: "Alumne afegit",
        description: "L'alumne s'ha afegit correctament.",
      });
      studentForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut afegir l'alumne.",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GroupFormData }) => {
      const response = await apiRequest('PUT', `/api/grups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grups'] });
      setIsEditGroupDialogOpen(false);
      setSelectedGroup(null);
      toast({
        title: "Grup actualitzat",
        description: "El grup s'ha actualitzat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar el grup.",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/grups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grups'] });
      toast({
        title: "Grup eliminat",
        description: "El grup s'ha eliminat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar el grup.",
        variant: "destructive",
      });
    },
  });

  const groupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
  });

  const editGroupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
  });

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  // Filter groups and students
  const filteredGroups = groups.filter((group: Group) =>
    group.nomGrup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.curs && group.curs.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (group.nivell && group.nivell.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStudents = students.filter((student: Student) => {
    const group = groups.find((g: Group) => g.id === student.grupId);
    return (
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cognoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group && group.nomGrup.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const onCreateGroupSubmit = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const onCreateStudentSubmit = (data: StudentFormData) => {
    createStudentMutation.mutate(data);
  };

  const onEditGroupSubmit = (data: GroupFormData) => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data });
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    editGroupForm.reset({
      nomGrup: group.nomGrup,
      curs: group.curs || "",
      nivell: group.nivell || "",
    });
    setIsEditGroupDialogOpen(true);
  };

  const handleDeleteGroup = (group: Group) => {
    const studentsInGroup = students.filter((s: Student) => s.grupId === group.id);
    if (studentsInGroup.length > 0) {
      toast({
        title: "No es pot eliminar",
        description: "Aquest grup té alumnes assignats. Mou-los primer a un altre grup.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Estàs segur que vols eliminar el grup ${group.nomGrup}?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const getStudentCountByGroup = (groupId: number) => {
    return students.filter((s: Student) => s.grupId === groupId).length;
  };

  const getGroupName = (groupId: number) => {
    const group = groups.find((g: Group) => g.id === groupId);
    return group?.nomGrup || "Sense grup";
  };

  const getLevelColor = (nivell?: string) => {
    if (!nivell) return "bg-gray-100 text-gray-800";
    if (nivell.includes("ESO")) return "bg-blue-100 text-blue-800";
    if (nivell.includes("Batxillerat")) return "bg-green-100 text-green-800";
    if (nivell.includes("FP")) return "bg-orange-100 text-orange-800";
    return "bg-purple-100 text-purple-800";
  };

  const isLoading = groupsLoading || studentsLoading;

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
          <h1 className="text-2xl font-bold text-text-primary">Gestió de Grups i Alumnes</h1>
          <p className="text-text-secondary">Administra els grups classe i els seus alumnes</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isCreateStudentDialogOpen} onOpenChange={setIsCreateStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Afegir Alumne
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Nou Grup
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Grups</p>
                <p className="text-2xl font-bold text-text-primary">{groups.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Alumnes</p>
                <p className="text-2xl font-bold text-text-primary">{students.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Mitjana per Grup</p>
                <p className="text-2xl font-bold text-text-primary">
                  {groups.length > 0 ? Math.round(students.length / groups.length) : 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Grups Actius</p>
                <p className="text-2xl font-bold text-text-primary">
                  {groups.filter((g: Group) => getStudentCountByGroup(g.id) > 0).length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <Input
            placeholder="Cercar grups o alumnes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Grups ({filteredGroups.length})</TabsTrigger>
          <TabsTrigger value="students">Alumnes ({filteredStudents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No s'han trobat grups" : "No hi ha grups"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Prova a modificar els termes de cerca."
                    : "Comença creant el primer grup classe."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateGroupDialogOpen(true)}>
                    Crear Primer Grup
                  </Button>
                )}
              </div>
            ) : (
              filteredGroups.map((group: Group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.nomGrup}</CardTitle>
                        {group.curs && (
                          <CardDescription>{group.curs}</CardDescription>
                        )}
                      </div>
                      {group.nivell && (
                        <Badge className={getLevelColor(group.nivell)}>
                          {group.nivell}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Alumnes</span>
                        <span className="font-medium text-text-primary">
                          {getStudentCountByGroup(group.id)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Creat</span>
                        <span className="text-text-primary">
                          {new Date(group.createdAt).toLocaleDateString('ca-ES')}
                        </span>
                      </div>

                      <div className="flex space-x-2 pt-3 border-t border-gray-200">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDeleteGroup(group)}
                          disabled={deleteGroupMutation.isPending}
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
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No s'han trobat alumnes" : "No hi ha alumnes"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Prova a modificar els termes de cerca."
                    : "Comença afegint els primers alumnes."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateStudentDialogOpen(true)}>
                    Afegir Primer Alumne
                  </Button>
                )}
              </div>
            ) : (
              filteredStudents.map((student: Student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {student.nom[0]}{student.cognoms.split(' ')[0]?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">
                            {student.nom} {student.cognoms}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-text-secondary">
                            <span>{getGroupName(student.grupId)}</span>
                            {student.email && (
                              <>
                                <span>•</span>
                                <span>{student.email}</span>
                              </>
                            )}
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
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nou Grup</DialogTitle>
            <DialogDescription>
              Registra un nou grup classe al sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(onCreateGroupSubmit)} className="space-y-4">
              <FormField
                control={groupForm.control}
                name="nomGrup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom del Grup</FormLabel>
                    <FormControl>
                      <Input placeholder="1r ESO A, 2n Batxillerat B..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={groupForm.control}
                  name="curs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curs (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="2024-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={groupForm.control}
                  name="nivell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivell (opcional)</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona nivell" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1r ESO">1r ESO</SelectItem>
                          <SelectItem value="2n ESO">2n ESO</SelectItem>
                          <SelectItem value="3r ESO">3r ESO</SelectItem>
                          <SelectItem value="4t ESO">4t ESO</SelectItem>
                          <SelectItem value="1r Batxillerat">1r Batxillerat</SelectItem>
                          <SelectItem value="2n Batxillerat">2n Batxillerat</SelectItem>
                          <SelectItem value="FP Grau Mitjà">FP Grau Mitjà</SelectItem>
                          <SelectItem value="FP Grau Superior">FP Grau Superior</SelectItem>
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
                  onClick={() => setIsCreateGroupDialogOpen(false)}
                >
                  Cancel·lar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGroupMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  {createGroupMutation.isPending ? "Creant..." : "Crear Grup"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Student Dialog */}
      <Dialog open={isCreateStudentDialogOpen} onOpenChange={setIsCreateStudentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Afegir Nou Alumne</DialogTitle>
            <DialogDescription>
              Registra un nou alumne i assigna'l a un grup classe.
            </DialogDescription>
          </DialogHeader>
          <Form {...studentForm}>
            <form onSubmit={studentForm.handleSubmit(onCreateStudentSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={studentForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'alumne..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studentForm.control}
                  name="cognoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognoms</FormLabel>
                      <FormControl>
                        <Input placeholder="Cognoms de l'alumne..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={studentForm.control}
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
                            {group.nomGrup} {group.nivell && `(${group.nivell})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={studentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@estudiant.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateStudentDialogOpen(false)}
                >
                  Cancel·lar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStudentMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  {createStudentMutation.isPending ? "Afegint..." : "Afegir Alumne"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Grup</DialogTitle>
            <DialogDescription>
              Modifica la informació del grup seleccionat.
            </DialogDescription>
          </DialogHeader>
          <Form {...editGroupForm}>
            <form onSubmit={editGroupForm.handleSubmit(onEditGroupSubmit)} className="space-y-4">
              <FormField
                control={editGroupForm.control}
                name="nomGrup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom del Grup</FormLabel>
                    <FormControl>
                      <Input placeholder="1r ESO A, 2n Batxillerat B..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editGroupForm.control}
                  name="curs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curs (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="2024-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editGroupForm.control}
                  name="nivell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivell (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona nivell" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1r ESO">1r ESO</SelectItem>
                          <SelectItem value="2n ESO">2n ESO</SelectItem>
                          <SelectItem value="3r ESO">3r ESO</SelectItem>
                          <SelectItem value="4t ESO">4t ESO</SelectItem>
                          <SelectItem value="1r Batxillerat">1r Batxillerat</SelectItem>
                          <SelectItem value="2n Batxillerat">2n Batxillerat</SelectItem>
                          <SelectItem value="FP Grau Mitjà">FP Grau Mitjà</SelectItem>
                          <SelectItem value="FP Grau Superior">FP Grau Superior</SelectItem>
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
                  onClick={() => setIsEditGroupDialogOpen(false)}
                >
                  Cancel·lar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateGroupMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  {updateGroupMutation.isPending ? "Actualitzant..." : "Actualitzar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
