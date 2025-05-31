import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMateriaSchema, type Materia, type InsertMateria } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, BookOpen, Clock, GraduationCap, Building } from "lucide-react";

export default function Subjects() {
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch materies
  const { data: materies = [], isLoading } = useQuery<Materia[]>({
    queryKey: ['/api/materies'],
  });

  // Create form
  const createForm = useForm<InsertMateria>({
    resolver: zodResolver(insertMateriaSchema),
    defaultValues: {
      nom: "",
      codi: "",
      departament: "",
      horesSetmanals: 0,
      tipus: "obligatoria",
      curs: "",
      descripcio: "",
    },
  });

  // Edit form
  const editForm = useForm<InsertMateria>({
    resolver: zodResolver(insertMateriaSchema),
    defaultValues: {
      nom: "",
      codi: "",
      departament: "",
      horesSetmanals: 0,
      tipus: "obligatoria",
      curs: "",
      descripcio: "",
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertMateria) => {
      return await apiRequest('/api/materies', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materies'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Matèria creada",
        description: "La matèria s'ha creat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear la matèria.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMateria> }) => {
      return await apiRequest(`/api/materies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materies'] });
      setIsEditDialogOpen(false);
      setSelectedMateria(null);
      editForm.reset();
      toast({
        title: "Matèria actualitzada",
        description: "La matèria s'ha actualitzat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar la matèria.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/materies/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materies'] });
      toast({
        title: "Matèria eliminada",
        description: "La matèria s'ha eliminat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar la matèria.",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: InsertMateria) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertMateria) => {
    if (selectedMateria) {
      updateMutation.mutate({ id: selectedMateria.id, data });
    }
  };

  const handleEdit = (materia: Materia) => {
    setSelectedMateria(materia);
    editForm.reset({
      nom: materia.nom,
      codi: materia.codi,
      departament: materia.departament || "",
      horesSetmanals: materia.horesSetmanals || 0,
      tipus: materia.tipus || "obligatoria",
      curs: materia.curs || "",
      descripcio: materia.descripcio || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getTypeColor = (tipus: string) => {
    switch (tipus) {
      case 'obligatoria':
        return 'bg-blue-100 text-blue-800';
      case 'optativa':
        return 'bg-green-100 text-green-800';
      case 'extraescolar':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregant matèries...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestió de Matèries</h1>
          <p className="text-text-secondary mt-2">
            Gestiona les assignatures del centre educatiu
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Matèria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nova Matèria</DialogTitle>
              <DialogDescription>
                Afegeix una nova matèria al sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la matèria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Matemàtiques" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="codi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codi</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: MAT001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="departament"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departament</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ciències" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="horesSetmanals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hores setmanals</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="tipus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="obligatoria">Obligatòria</SelectItem>
                            <SelectItem value="optativa">Optativa</SelectItem>
                            <SelectItem value="extraescolar">Extraescolar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="curs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curs</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1r ESO" {...field} />
                      </FormControl>
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
                        <Textarea 
                          placeholder="Descripció opcional de la matèria..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creant..." : "Crear Matèria"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matèries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obligatòries</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materies.filter(m => m.tipus === 'obligatoria').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optatives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materies.filter(m => m.tipus === 'optativa').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departaments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(materies.map(m => m.departament).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Llistat de Matèries</CardTitle>
          <CardDescription>
            Gestiona totes les matèries del centre educatiu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Codi</TableHead>
                <TableHead>Departament</TableHead>
                <TableHead>Tipus</TableHead>
                <TableHead>Curs</TableHead>
                <TableHead>Hores/Setmana</TableHead>
                <TableHead>Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materies.map((materia) => (
                <TableRow key={materia.id}>
                  <TableCell className="font-medium">{materia.nom}</TableCell>
                  <TableCell>{materia.codi}</TableCell>
                  <TableCell>{materia.departament || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(materia.tipus || 'obligatoria')}>
                      {materia.tipus === 'obligatoria' ? 'Obligatòria' : 
                       materia.tipus === 'optativa' ? 'Optativa' : 'Extraescolar'}
                    </Badge>
                  </TableCell>
                  <TableCell>{materia.curs || '-'}</TableCell>
                  <TableCell>{materia.horesSetmanals || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(materia)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar matèria</AlertDialogTitle>
                            <AlertDialogDescription>
                              Estàs segur que vols eliminar la matèria "{materia.nom}"? 
                              Aquesta acció no es pot desfer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(materia.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {materies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hi ha matèries creades encara
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Matèria</DialogTitle>
            <DialogDescription>
              Modifica la informació de la matèria
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la matèria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Matemàtiques" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="codi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codi</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MAT001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="departament"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departament</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ciències" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="horesSetmanals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hores setmanals</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="tipus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipus</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="obligatoria">Obligatòria</SelectItem>
                          <SelectItem value="optativa">Optativa</SelectItem>
                          <SelectItem value="extraescolar">Extraescolar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="curs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curs</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1r ESO" {...field} />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Descripció opcional de la matèria..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Actualitzant..." : "Actualitzar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}