import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ListTodo, Plus, Search, Filter, Calendar, Clock, AlertTriangle, CheckCircle, FileText, Download } from "lucide-react";
import TaskModal from "@/components/forms/task-modal";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ca } from "date-fns/locale";

interface Task {
  id: number;
  assignaId?: number;
  descripcio: string;
  estat: string;
  dataCreacio: string;
  dataVenciment?: string;
  prioritat: string;
  adjunts?: any;
  comentaris?: string;
  assignacio?: {
    professor: {
      nom: string;
      cognoms: string;
    };
    guardia: {
      data: string;
      tipusGuardia: string;
    };
  };
}

interface Attachment {
  id: number;
  nomFitxer: string;
  urlAlmacenament: string;
  mida: number;
  tipus: string;
}

export default function ListTodo() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasques'],
  });

  // Fetch attachments for selected task
  const { data: attachments = [] } = useQuery({
    queryKey: ['/api/tasques', selectedTask?.id, 'attachments'],
    enabled: !!selectedTask?.id,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tasques/${selectedTask!.id}/attachments`);
      return response.json();
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest('PUT', `/api/tasques/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasques'] });
      toast({
        title: "Tasca actualitzada",
        description: "L'estat de la tasca s'ha actualitzat correctament.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar la tasca.",
        variant: "destructive",
      });
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.descripcio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.estat === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.prioritat === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status
  const tasksByStatus = {
    pendent: filteredTasks.filter((task: Task) => task.estat === "pendent"),
    en_progress: filteredTasks.filter((task: Task) => task.estat === "en_progress"),
    completada: filteredTasks.filter((task: Task) => task.estat === "completada"),
  };

  const getPriorityColor = (prioritat: string) => {
    switch (prioritat) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "alta":
        return "bg-orange-100 text-orange-800";
      case "mitjana":
        return "bg-yellow-100 text-yellow-800";
      case "baixa":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case "completada":
        return "bg-green-100 text-green-800";
      case "en_progress":
        return "bg-blue-100 text-blue-800";
      case "pendent":
        return "bg-yellow-100 text-yellow-800";
      case "cancel·lada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (estat: string) => {
    switch (estat) {
      case "completada":
        return <CheckCircle className="w-4 h-4" />;
      case "en_progress":
        return <Clock className="w-4 h-4" />;
      case "pendent":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ListTodo className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: ca });
    } catch {
      return dateString;
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { estat: newStatus },
    });
  };

  const downloadAttachment = (attachment: Attachment) => {
    window.open(attachment.urlAlmacenament, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h1 className="text-2xl font-bold text-text-primary">Gestió de Tasques</h1>
          <p className="text-text-secondary">Organitza i segueix l'estat de les tasques assignades</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tasca
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <Input
            placeholder="Cercar tasques..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Estat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tots els estats</SelectItem>
            <SelectItem value="pendent">Pendent</SelectItem>
            <SelectItem value="en_progress">En Progrés</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="cancel·lada">Cancel·lada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Prioritat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Totes les prioritats</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="mitjana">Mitjana</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">
            {filteredTasks.length} tasques trobades
          </span>
        </div>
      </div>

      {/* ListTodo Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Pendents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {tasksByStatus.pendent.length}
            </div>
            <p className="text-text-secondary text-sm">
              {tasksByStatus.pendent.filter(t => t.prioritat === 'urgent' || t.prioritat === 'alta').length} prioritàries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>En Progrés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {tasksByStatus.en_progress.length}
            </div>
            <Progress 
              value={(tasksByStatus.en_progress.length / filteredTasks.length) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Completades</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {tasksByStatus.completada.length}
            </div>
            <p className="text-text-secondary text-sm">
              {Math.round((tasksByStatus.completada.length / filteredTasks.length) * 100)}% completat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ListTodo Board */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Tauler</TabsTrigger>
          <TabsTrigger value="list">Llista</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="space-y-4">
                <h3 className="font-medium text-text-primary capitalize flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <span>
                    {status === "pendent" ? "Pendents" : 
                     status === "en_progress" ? "En Progrés" : "Completades"}
                  </span>
                  <Badge variant="outline">{statusTasks.length}</Badge>
                </h3>
                
                <div className="space-y-3">
                  {statusTasks.map((task: Task) => (
                    <Card 
                      key={task.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-text-primary line-clamp-2">
                              {task.descripcio}
                            </p>
                            <Badge className={getPriorityColor(task.prioritat)}>
                              {task.prioritat}
                            </Badge>
                          </div>
                          
                          {task.assignacio && (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {task.assignacio.professor.nom[0]}{task.assignacio.professor.cognoms[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-text-secondary">
                                {task.assignacio.professor.nom} {task.assignacio.professor.cognoms}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {task.dataVenciment && (
                              <div className="flex items-center space-x-1 text-xs text-text-secondary">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.dataVenciment)}</span>
                              </div>
                            )}
                            
                            <Select 
                              value={task.estat} 
                              onValueChange={(value) => handleStatusChange(task.id, value)}
                            >
                              <SelectTrigger className="w-auto h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendent">Pendent</SelectItem>
                                <SelectItem value="en_progress">En Progrés</SelectItem>
                                <SelectItem value="completada">Completada</SelectItem>
                                <SelectItem value="cancel·lada">Cancel·lada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-4">
            {filteredTasks.map((task: Task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-text-primary mb-2">
                            {task.descripcio}
                          </h3>
                          
                          {task.assignacio && (
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {task.assignacio.professor.nom[0]}{task.assignacio.professor.cognoms[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-text-secondary">
                                {task.assignacio.professor.nom} {task.assignacio.professor.cognoms}
                              </span>
                              <span className="text-xs text-text-secondary">
                                • {task.assignacio.guardia.tipusGuardia} ({formatDate(task.assignacio.guardia.data)})
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-text-secondary">
                            <span>Creat: {formatDate(task.dataCreacio)}</span>
                            {task.dataVenciment && (
                              <span>Venciment: {formatDate(task.dataVenciment)}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.prioritat)}>
                            {task.prioritat}
                          </Badge>
                          <Badge className={getStatusColor(task.estat)}>
                            {task.estat}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                      >
                        Detalls
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Detalls de la Tasca</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedTask(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Descripció</h4>
                <p className="text-text-secondary">{selectedTask.descripcio}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Estat</h4>
                  <Badge className={getStatusColor(selectedTask.estat)}>
                    {selectedTask.estat}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Prioritat</h4>
                  <Badge className={getPriorityColor(selectedTask.prioritat)}>
                    {selectedTask.prioritat}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Data de Creació</h4>
                  <p className="text-text-secondary">{formatDate(selectedTask.dataCreacio)}</p>
                </div>
                {selectedTask.dataVenciment && (
                  <div>
                    <h4 className="font-medium mb-1">Data de Venciment</h4>
                    <p className="text-text-secondary">{formatDate(selectedTask.dataVenciment)}</p>
                  </div>
                )}
              </div>
              
              {selectedTask.assignacio && (
                <div>
                  <h4 className="font-medium mb-2">Assignació</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>Professor:</strong> {selectedTask.assignacio.professor.nom} {selectedTask.assignacio.professor.cognoms}
                    </p>
                    <p className="text-sm">
                      <strong>Guàrdia:</strong> {selectedTask.assignacio.guardia.tipusGuardia} - {formatDate(selectedTask.assignacio.guardia.data)}
                    </p>
                  </div>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Adjunts</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment: Attachment) => (
                      <div 
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{attachment.nomFitxer}</p>
                            <p className="text-xs text-text-secondary">
                              {formatFileSize(attachment.mida)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTask.comentaris && (
                <div>
                  <h4 className="font-medium mb-2">Comentaris</h4>
                  <p className="text-text-secondary text-sm bg-gray-50 rounded-lg p-3">
                    {selectedTask.comentaris}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Task Modal */}
      <TaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
