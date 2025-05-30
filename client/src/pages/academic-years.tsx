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
import { Calendar, Plus, School, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const academicYearSchema = z.object({
  nom: z.string().min(1, "El nom és obligatori"),
  dataInici: z.string().min(1, "La data d'inici és obligatòria"),
  dataFi: z.string().min(1, "La data de fi és obligatòria"),
  estat: z.enum(["actiu", "inactiu", "finalitzat"]),
  observacions: z.string().optional(),
});

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

interface AcademicYear {
  id: number;
  nom: string;
  dataInici: string;
  dataFi: string;
  estat: string;
  observacions?: string;
  createdAt: string;
}

export default function AcademicYears() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch academic years
  const { data: academicYears = [], isLoading } = useQuery({
    queryKey: ['/api/anys-academics'],
    select: (data: AcademicYear[]) => data,
  });

  // Create academic year mutation
  const createAcademicYearMutation = useMutation({
    mutationFn: async (data: AcademicYearFormData) => {
      const response = await apiRequest('POST', '/api/anys-academics', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anys-academics'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Any acadèmic creat",
        description: "L'any acadèmic s'ha creat correctament.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear l'any acadèmic.",
        variant: "destructive",
      });
    },
  });

  // Update academic year mutation
  const updateAcademicYearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AcademicYearFormData> }) => {
      const response = await apiRequest('PUT', `/api/anys-academics/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anys-academics'] });
      setEditingYear(null);
      toast({
        title: "Any acadèmic actualitzat",
        description: "L'any acadèmic s'ha actualitzat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar l'any acadèmic.",
        variant: "destructive",
      });
    },
  });

  // Delete academic year mutation
  const deleteAcademicYearMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/anys-academics/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anys-academics'] });
      toast({
        title: "Any acadèmic eliminat",
        description: "L'any acadèmic s'ha eliminat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar l'any acadèmic.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AcademicYearFormData>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      estat: "actiu",
    },
  });

  const onSubmit = (data: AcademicYearFormData) => {
    if (editingYear) {
      updateAcademicYearMutation.mutate({ id: editingYear.id, data });
    } else {
      createAcademicYearMutation.mutate(data);
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year);
    form.reset({
      nom: year.nom,
      dataInici: year.dataInici,
      dataFi: year.dataFi,
      estat: year.estat as "actiu" | "inactiu" | "finalitzat",
      observacions: year.observacions || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Estàs segur que vols eliminar aquest any acadèmic? Aquesta acció eliminarà totes les dades relacionades.")) {
      deleteAcademicYearMutation.mutate(id);
    }
  };

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case "actiu":
        return "bg-green-100 text-green-800 border-green-200";
      case "finalitzat":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "inactiu":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (estat: string) => {
    switch (estat) {
      case "actiu":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "finalitzat":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "inactiu":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Anys Acadèmics</h1>
          <p className="text-text-secondary">Gestiona els cursos acadèmics i les seves dades associades</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingYear(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nou Any Acadèmic
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingYear ? "Editar Any Acadèmic" : "Crear Nou Any Acadèmic"}
              </DialogTitle>
              <DialogDescription>
                {editingYear 
                  ? "Modifica les dades de l'any acadèmic seleccionat."
                  : "Defineix un nou any acadèmic per organitzar les dades del centre."
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'Any Acadèmic</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2024-25" {...field} />
                      </FormControl>
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
                        <FormLabel>Data d'Inici</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Data de Fi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="estat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona l'estat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="actiu">Actiu</SelectItem>
                          <SelectItem value="inactiu">Inactiu</SelectItem>
                          <SelectItem value="finalitzat">Finalitzat</SelectItem>
                        </SelectContent>
                      </Select>
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
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingYear(null);
                      form.reset();
                    }}
                  >
                    Cancel·lar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAcademicYearMutation.isPending || updateAcademicYearMutation.isPending}
                  >
                    {editingYear ? "Actualitzar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Academic Years List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academicYears.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha anys acadèmics
            </h3>
            <p className="text-gray-500 mb-4">
              Crear el primer any acadèmic per començar a organitzar les dades.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Crear Primer Any Acadèmic
            </Button>
          </div>
        ) : (
          academicYears.map((year) => (
            <Card key={year.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <School className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">
                      Any Acadèmic {year.nom}
                    </CardTitle>
                  </div>
                  <Badge className={getStatusColor(year.estat)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(year.estat)}
                      <span className="capitalize">{year.estat}</span>
                    </div>
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(year.dataInici).toLocaleDateString('ca-ES')} - {new Date(year.dataFi).toLocaleDateString('ca-ES')}
                      </span>
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {year.observacions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Observacions:</h4>
                      <p className="text-sm text-gray-600">{year.observacions}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Creat: {new Date(year.createdAt).toLocaleDateString('ca-ES')}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(year)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(year.id)}
                        disabled={year.estat === "actiu"}
                      >
                        <Trash2 className="w-3 h-3" />
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