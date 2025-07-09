import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Users, MapPin, Plus, Filter, Search, AlertCircle, CheckCircle, XCircle, X, Edit, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ca } from "date-fns/locale";

interface Substitucio {
  id: number;
  tipus: string;
  data: string;
  horaInici: string;
  horaFi: string;
  assignatura: string;
  grup: string;
  aula: string;
  descripcio: string;
  motiu: string;
  estat: string;
  professorOriginal: {
    id: number;
    nom: string;
    cognoms: string;
  } | null;
  professorSubstitut: {
    id: number;
    nom: string;
    cognoms: string;
  } | null;
  sortida: {
    id: number;
    nomSortida: string;
    dataInici: string;
    dataFi: string;
    lloc: string;
  } | null;
}

interface Professor {
  id: number;
  nom: string;
  cognoms: string;
  email: string;
}

interface Sortida {
  id: number;
  nomSortida: string;
  dataInici: string;
  dataFi: string;
  lloc: string;
}

export default function GestioGuardies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filters state
  const [filters, setFilters] = useState({
    sortidaId: 'tots',
    professorId: 'tots',
    dataInici: '',
    dataFi: '',
    estat: 'tots'
  });
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubstitucio, setSelectedSubstitucio] = useState<Substitucio | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    professorSubstitutId: number | null;
    estat: string;
    observacions: string;
  }>({
    professorSubstitutId: null,
    estat: '',
    observacions: ''
  });

  // Fetch data
  const { data: substitucions = [], isLoading: isLoadingSubstitucions } = useQuery({
    queryKey: ['/api/substitucions-necessaries', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.sortidaId && filters.sortidaId !== 'tots') {
        params.append('sortidaId', filters.sortidaId);
      }
      
      if (filters.professorId && filters.professorId !== 'tots') {
        params.append('professorId', filters.professorId);
      }
      
      if (filters.estat && filters.estat !== 'tots') {
        params.append('estat', filters.estat);
      }
      
      if (filters.dataInici) {
        params.append('dataInici', filters.dataInici);
      }
      
      if (filters.dataFi) {
        params.append('dataFi', filters.dataFi);
      }
      
      const url = `/api/substitucions-necessaries${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: true
  });

  const { data: professors = [] } = useQuery<Professor[]>({
    queryKey: ['/api/professors']
  });

  const { data: sortides = [] } = useQuery<Sortida[]>({
    queryKey: ['/api/sortides']
  });

  // Get current academic year classes/schedule  
  const { data: horaris = [] } = useQuery({
    queryKey: ['/api/horaris']
  });

  // Get current assignments
  const { data: assignacions = [] } = useQuery({
    queryKey: ['/api/assignacions-guardia']
  });

  // Since filtering is now done on the backend, we use substitucions directly
  const filteredSubstitucions = substitucions as Substitucio[];

  // Group by date
  const substitucionsPerData = useMemo(() => {
    const grouped: { [key: string]: Substitucio[] } = {};
    filteredSubstitucions.forEach((substitucio: Substitucio) => {
      const data = substitucio.data;
      if (!grouped[data]) {
        grouped[data] = [];
      }
      grouped[data].push(substitucio);
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    const result: { [key: string]: Substitucio[] } = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date].sort((a, b) => a.horaInici.localeCompare(b.horaInici));
    });
    
    return result;
  }, [filteredSubstitucions]);

  // Analyze class assignment status
  const classAnalysis = useMemo(() => {
    const classesToCover = (horaris as any[]).filter(h => 
      h.diaSemana && h.horaInici && h.assignatura !== 'G' // Exclude guard slots
    );
    
    const assignades = (substitucions as any[]).filter(s => s.estat === 'assignada').length;
    const pendents = (substitucions as any[]).filter(s => s.estat === 'pendent').length;
    const noAssignables = classesToCover.filter(classe => {
      // Check if there are available professors for this class
      const professorsMaterias = (professors as any[]).filter(p => 
        p.especialitat === classe.assignatura || p.habilitacio?.includes(classe.assignatura)
      );
      return professorsMaterias.length === 0;
    }).length;

    return {
      assignades,
      pendents,
      noAssignables,
      total: classesToCover.length
    };
  }, [horaris, substitucions, professors]);

  // Edit substitution mutation
  const editSubstitucioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/substitucions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update substitution');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/substitucions-necessaries'] });
      setEditingId(null);
      toast({
        title: "Substitució actualitzada",
        description: "La substitució ha estat actualitzada correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar la substitució.",
        variant: "destructive",
      });
    }
  });

  // Delete substitution mutation
  const deleteSubstitucioMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/substitucions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete substitution');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/substitucions-necessaries'] });
      toast({
        title: "Substitució esborrada",
        description: "La substitució ha estat esborrada correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut esborrar la substitució.",
        variant: "destructive",
      });
    }
  });

  // Handle edit functions
  const startEdit = (substitucio: any) => {
    setEditingId(substitucio.id);
    setEditForm({
      professorSubstitutId: substitucio.professorSubstitut?.id || null,
      estat: substitucio.estat,
      observacions: substitucio.descripcio || ''
    });
  };

  const saveEdit = () => {
    if (editingId) {
      editSubstitucioMutation.mutate({
        id: editingId,
        data: editForm
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      professorSubstitutId: null,
      estat: '',
      observacions: ''
    });
  };

  // Assign professor mutation
  const assignProfessorMutation = useMutation({
    mutationFn: async ({ taskId, professorId }: { taskId: number; professorId: number }) => {
      const response = await fetch(`/api/tasques/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignaId: professorId, estat: 'assignada' })
      });
      if (!response.ok) throw new Error('Error assignant professor');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Professor assignat",
        description: "La substitució ha estat assignada correctament"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/substitucions-necessaries'] });
      setIsDialogOpen(false);
      setSelectedSubstitucio(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut assignar el professor",
        variant: "destructive"
      });
    }
  });

  const handleAssignProfessor = (professorId: number) => {
    if (selectedSubstitucio) {
      assignProfessorMutation.mutate({
        taskId: selectedSubstitucio.id,
        professorId: professorId
      });
    }
  };

  const getEstatColor = (estat: string) => {
    switch (estat) {
      case 'pendent': return 'bg-yellow-500';
      case 'assignada': return 'bg-blue-500';
      case 'confirmada': return 'bg-green-500';
      case 'completada': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  const getEstatIcon = (estat: string) => {
    switch (estat) {
      case 'pendent': return <AlertCircle className="h-4 w-4" />;
      case 'assignada': return <Clock className="h-4 w-4" />;
      case 'confirmada': return <CheckCircle className="h-4 w-4" />;
      case 'completada': return <CheckCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestió de Guardies i Substitucions
          </h1>
          <p className="text-gray-600">
            Gestiona totes les substitucions necessàries per sortides, activitats i altres motius
          </p>
        </div>

        {/* Class Assignment Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Anàlisi de Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Classes Assignades</p>
                    <p className="text-2xl font-bold text-green-600">
                      {classAnalysis.assignades}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendents d'Assignar</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {classAnalysis.pendents}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">No Assignables</p>
                    <p className="text-2xl font-bold text-red-600">
                      {classAnalysis.noAssignables}
                    </p>
                    <p className="text-xs text-gray-500">Falta professorat</p>
                  </div>
                  <X className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {classAnalysis.total}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  sortidaId: 'tots',
                  professorId: 'tots',
                  dataInici: '',
                  dataFi: '',
                  estat: 'tots'
                })}
              >
                <X className="h-4 w-4 mr-2" />
                Netejar filtres
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="sortida">Sortida</Label>
                <Select
                  value={filters.sortidaId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortidaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Totes les sortides" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tots">Totes les sortides</SelectItem>
                    {sortides.map((sortida) => (
                      <SelectItem key={sortida.id} value={sortida.id.toString()}>
                        {sortida.nomSortida}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="professor">Professor</Label>
                <Select
                  value={filters.professorId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, professorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tots els professors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tots">Tots els professors</SelectItem>
                    {professors.filter(professor => professor.id).map((professor) => (
                      <SelectItem key={professor.id} value={professor.id.toString()}>
                        {professor.nom} {professor.cognoms}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dataInici">Data inici</Label>
                <Input
                  id="dataInici"
                  type="date"
                  value={filters.dataInici}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataInici: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="dataFi">Data fi</Label>
                <Input
                  id="dataFi"
                  type="date"
                  value={filters.dataFi}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataFi: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="estat">Estat</Label>
                <Select
                  value={filters.estat}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, estat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tots">Tots els estats</SelectItem>
                    <SelectItem value="pendent">Pendent</SelectItem>
                    <SelectItem value="assignada">Assignada</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{filteredSubstitucions.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendents</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredSubstitucions.filter((s: any) => s.estat === 'pendent').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assignades</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredSubstitucions.filter((s: any) => s.estat === 'assignada').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completades</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredSubstitucions.filter((s: any) => s.estat === 'completada').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Substitutions list */}
        {isLoadingSubstitucions ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Carregant substitucions...</p>
            </CardContent>
          </Card>
        ) : Object.keys(substitucionsPerData).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No s'han trobat substitucions amb els filtres aplicats</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(substitucionsPerData).map(([data, substitucions]) => (
              <Card key={data}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(parseISO(data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ca })}
                    <Badge variant="secondary">{substitucions.length} substitucions</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {substitucions.map((substitucio) => (
                      <div
                        key={substitucio.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                      >
                        {/* Header amb estat i accions */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className={`${getEstatColor(substitucio.estat)} text-white`}>
                              {getEstatIcon(substitucio.estat)}
                              {substitucio.estat}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {substitucio.horaInici} - {substitucio.horaFi}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {(substitucio as any).sortida?.nomSortida}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {editingId === substitucio.id ? (
                              <>
                                <Button
                                  onClick={saveEdit}
                                  size="sm"
                                  disabled={editSubstitucioMutation.isPending}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Desar
                                </Button>
                                <Button
                                  onClick={cancelEdit}
                                  size="sm"
                                  variant="outline"
                                >
                                  Cancel·lar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => startEdit(substitucio)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  onClick={() => deleteSubstitucioMutation.mutate(substitucio.id)}
                                  size="sm"
                                  variant="destructive"
                                  disabled={deleteSubstitucioMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Esborrar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Informació principal reorganitzada */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Classe afectada */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Classe a Substituir</h4>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">Assignatura:</span> {(substitucio as any).assignatura}</p>
                              <p><span className="font-medium">Grup:</span> {(substitucio as any).grup}</p>
                              {(substitucio as any).aula && (
                                <p><span className="font-medium">Aula:</span> {(substitucio as any).aula}</p>
                              )}
                            </div>
                          </div>

                          {/* Professors */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Professors</h4>
                            <div className="space-y-2">
                              {substitucio.professorOriginal && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-red-500" />
                                  <div>
                                    <p className="font-medium text-red-600">Original (Sortida)</p>
                                    <p>{substitucio.professorOriginal.nom} {substitucio.professorOriginal.cognoms}</p>
                                  </div>
                                </div>
                              )}
                              
                              {editingId === substitucio.id ? (
                                <div className="space-y-2">
                                  <Label>Professor Substitut</Label>
                                  <Select
                                    value={editForm.professorSubstitutId?.toString() || "none"}
                                    onValueChange={(value) => 
                                      setEditForm({...editForm, professorSubstitutId: value === "none" ? null : parseInt(value)})
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona professor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sense assignar</SelectItem>
                                      {professors.filter(professor => professor.id).map((professor) => (
                                        <SelectItem key={professor.id} value={professor.id.toString()}>
                                          {professor.nom} {professor.cognoms}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (substitucio as any).professorSubstitut ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="font-medium text-green-600">Substitut</p>
                                    <p>{(substitucio as any).professorSubstitut.nom} {(substitucio as any).professorSubstitut.cognoms}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">Sense professor assignat</p>
                              )}
                            </div>
                          </div>

                          {/* Estat i observacions */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Detalls</h4>
                            {editingId === substitucio.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label>Estat</Label>
                                  <Select
                                    value={editForm.estat}
                                    onValueChange={(value) => setEditForm({...editForm, estat: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pendent">Pendent</SelectItem>
                                      <SelectItem value="assignada">Assignada</SelectItem>
                                      <SelectItem value="confirmada">Confirmada</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Observacions</Label>
                                  <Input
                                    value={editForm.observacions}
                                    onChange={(e) => setEditForm({...editForm, observacions: e.target.value})}
                                    placeholder="Observacions..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm space-y-1">
                                <p><span className="font-medium">Data:</span> {format(parseISO(substitucio.data), "dd/MM/yyyy")}</p>
                                <p><span className="font-medium">Motiu:</span> {substitucio.motiu}</p>
                                {substitucio.descripcio && (
                                  <p><span className="font-medium">Observacions:</span> {substitucio.descripcio}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assign Professor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assignar Professor</DialogTitle>
              <DialogDescription>
                Selecciona un professor per cobrir aquesta substitució
              </DialogDescription>
            </DialogHeader>
            
            {selectedSubstitucio && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">{selectedSubstitucio.motiu}</h4>
                  <p className="text-sm text-gray-600">{selectedSubstitucio.descripcio}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Clock className="h-4 w-4" />
                    {selectedSubstitucio.horaInici} - {selectedSubstitucio.horaFi}
                  </div>
                </div>

                <div>
                  <Label htmlFor="professorSelect">Professor disponible</Label>
                  <Select onValueChange={(value) => handleAssignProfessor(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {professors.filter(professor => professor.id).map((professor) => (
                        <SelectItem key={professor.id} value={professor.id.toString()}>
                          {professor.nom} {professor.cognoms}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel·lar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}