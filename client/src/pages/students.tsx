import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { insertAlumneSchema, type Alumne, type InsertAlumne, type Grup } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Users, GraduationCap, Search, Filter } from "lucide-react";

export default function Students() {
  const [selectedAlumne, setSelectedAlumne] = useState<Alumne | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrupFilter, setSelectedGrupFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch alumnes
  const { data: alumnes = [], isLoading } = useQuery<Alumne[]>({
    queryKey: ['/api/alumnes'],
  });

  // Fetch grups for dropdown
  const { data: grups = [] } = useQuery<Grup[]>({
    queryKey: ['/api/grups'],
  });

  // Create form
  const createForm = useForm<InsertAlumne>({
    resolver: zodResolver(insertAlumneSchema),
    defaultValues: {
      nom: "",
      cognoms: "",
      email: "",
      telefon: "",
      grupId: undefined,
    },
  });

  // Edit form
  const editForm = useForm<InsertAlumne>({
    resolver: zodResolver(insertAlumneSchema),
    defaultValues: {
      nom: "",
      cognoms: "",
      email: "",
      telefon: "",
      grupId: undefined,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertAlumne) => {
      return await apiRequest('/api/alumnes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alumnes'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Alumne creat",
        description: "L'alumne s'ha creat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear l'alumne.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAlumne> }) => {
      return await apiRequest(`/api/alumnes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alumnes'] });
      setIsEditDialogOpen(false);
      setSelectedAlumne(null);
      editForm.reset();
      toast({
        title: "Alumne actualitzat",
        description: "L'alumne s'ha actualitzat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar l'alumne.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/alumnes/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alumnes'] });
      toast({
        title: "Alumne eliminat",
        description: "L'alumne s'ha eliminat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar l'alumne.",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: InsertAlumne) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertAlumne) => {
    if (selectedAlumne) {
      updateMutation.mutate({ id: selectedAlumne.id, data });
    }
  };

  const handleEdit = (alumne: Alumne) => {
    setSelectedAlumne(alumne);
    editForm.reset({
      nom: alumne.nom,
      cognoms: alumne.cognoms || "",
      email: alumne.email || "",
      telefon: alumne.telefon || "",
      grupId: alumne.grupId || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Filter and search logic
  const filteredAlumnes = alumnes.filter((alumne) => {
    const matchesSearch = !searchTerm || 
      alumne.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumne.cognoms && alumne.cognoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alumne.email && alumne.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGrup = selectedGrupFilter === "all" || 
      (selectedGrupFilter === "none" && !alumne.grupId) ||
      String(alumne.grupId) === selectedGrupFilter;
    
    return matchesSearch && matchesGrup;
  });

  // Get grup name helper
  const getGrupName = (grupId: number | null) => {
    if (!grupId) return "Sense grup";
    const grup = grups.find(g => g.id === grupId);
    return grup?.nomGrup || "Grup desconegut";
  };

  // Statistics
  const totalAlumnes = alumnes.length;
  const alumnesAmbGrup = alumnes.filter(a => a.grupId).length;
  const alumnesSenseGrup = totalAlumnes - alumnesAmbGrup;
  const grupsAmbAlumnes = new Set(alumnes.filter(a => a.grupId).map(a => a.grupId)).size;

  if (isLoading) {
    return <div className="p-6">Carregant alumnes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestió d'Alumnes</h1>
          <p className="text-text-secondary mt-2">
            Gestiona els estudiants del centre educatiu
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nou Alumne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nou Alumne</DialogTitle>
              <DialogDescription>
                Afegeix un nou alumne al sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria" {...field} />
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
                        <Input placeholder="Ex: García López" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Ex: maria.garcia@estudiants.edu" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="telefon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telèfon</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123456789" {...field} />
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
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grup" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sense grup</SelectItem>
                          {grups.map((grup) => (
                            <SelectItem key={grup.id} value={String(grup.id)}>
                              {grup.nomGrup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creant..." : "Crear Alumne"}
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
            <CardTitle className="text-sm font-medium">Total Alumnes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlumnes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amb Grup Assignat</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alumnesAmbGrup}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sense Grup</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alumnesSenseGrup}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grups Actius</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grupsAmbAlumnes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres i Cerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Cercar alumnes</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cerca per nom, cognoms o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="grup-filter">Filtrar per grup</Label>
              <Select value={selectedGrupFilter} onValueChange={setSelectedGrupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els grups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tots els grups</SelectItem>
                  <SelectItem value="none">Sense grup</SelectItem>
                  {grups.map((grup) => (
                    <SelectItem key={grup.id} value={String(grup.id)}>
                      {grup.nomGrup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumnes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Llistat d'Alumnes</CardTitle>
          <CardDescription>
            {filteredAlumnes.length} de {totalAlumnes} alumnes
            {searchTerm && ` (cercant "${searchTerm}")`}
            {selectedGrupFilter !== "all" && ` (filtrat per grup)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Cognoms</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telèfon</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead>Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlumnes.map((alumne) => (
                <TableRow key={alumne.id}>
                  <TableCell className="font-medium">{alumne.nom}</TableCell>
                  <TableCell>{alumne.cognoms || '-'}</TableCell>
                  <TableCell>{alumne.email || '-'}</TableCell>
                  <TableCell>{alumne.telefon || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={alumne.grupId ? "default" : "secondary"}>
                      {getGrupName(alumne.grupId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(alumne)}
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
                            <AlertDialogTitle>Eliminar alumne</AlertDialogTitle>
                            <AlertDialogDescription>
                              Estàs segur que vols eliminar l'alumne "{alumne.nom} {alumne.cognoms}"? 
                              Aquesta acció no es pot desfer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(alumne.id)}
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
          {filteredAlumnes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedGrupFilter !== "all" 
                ? "No s'han trobat alumnes amb els filtres aplicats"
                : "No hi ha alumnes creats encara"
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Alumne</DialogTitle>
            <DialogDescription>
              Modifica la informació de l'alumne
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Maria" {...field} />
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
                      <Input placeholder="Ex: García López" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Ex: maria.garcia@estudiants.edu" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="telefon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telèfon</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123456789" {...field} />
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
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un grup" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sense grup</SelectItem>
                        {grups.map((grup) => (
                          <SelectItem key={grup.id} value={String(grup.id)}>
                            {grup.nomGrup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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