import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Eye, EyeOff, Plus, Filter, X, Calendar, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const communicationSchema = z.object({
  tipusDest: z.enum(["Professor", "Coordinador", "Alumne"]),
  destinatariId: z.number().min(1, "Selecciona un destinatari"),
  missatge: z.string().min(10, "El missatge ha de tenir almenys 10 caràcters"),
  tipus: z.enum(["Assignació", "Avís", "Recordatori", "Reunió", "Sortida", "Canvi", "Informe", "Tasca"]),
});

type CommunicationFormData = z.infer<typeof communicationSchema>;

interface Communication {
  id: number;
  tipusDest: string;
  destinatariId: string;
  missatge: string;
  tipus: string;
  llegit: boolean;
  emissorId: number;
  relatedGuardiaId?: number;
  dataEnviament: string;
  createdAt: string;
}

export default function Communications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("tots");
  const [statusFilter, setStatusFilter] = useState("tots");
  const [recipientFilter, setRecipientFilter] = useState("tots");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch communications
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['/api/comunicacions'],
    select: (data: Communication[]) => data,
  });

  // Fetch professors for the recipient dropdown
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
  });

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    if (typeFilter && comm.tipus !== typeFilter) return false;
    if (statusFilter === "llegit" && !comm.llegit) return false;
    if (statusFilter === "no_llegit" && comm.llegit) return false;
    if (recipientFilter && comm.tipusDest !== recipientFilter) return false;
    return true;
  });

  // Create communication mutation
  const createCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const response = await apiRequest('POST', '/api/comunicacions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comunicacions'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Comunicació enviada",
        description: "La comunicació s'ha enviat correctament.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut enviar la comunicació.",
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (commId: number) => {
      const response = await apiRequest('PUT', `/api/comunicacions/${commId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comunicacions'] });
      toast({
        title: "Marcat com llegit",
        description: "La comunicació s'ha marcat com llegida.",
      });
    },
  });

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      tipusDest: "Professor",
      tipus: "Assignació",
    },
  });

  const onSubmit = (data: CommunicationFormData) => {
    createCommunicationMutation.mutate(data);
  };

  const clearFilters = () => {
    setTypeFilter("tots");
    setStatusFilter("tots");
    setRecipientFilter("tots");
  };

  const getTypeColor = (tipus: string) => {
    switch (tipus) {
      case "Assignació":
        return "bg-blue-100 text-blue-800";
      case "Avís":
        return "bg-yellow-100 text-yellow-800";
      case "Recordatori":
        return "bg-green-100 text-green-800";
      case "Reunió":
        return "bg-purple-100 text-purple-800";
      case "Sortida":
        return "bg-orange-100 text-orange-800";
      case "Informe":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRecipientColor = (tipusDest: string) => {
    switch (tipusDest) {
      case "Professor":
        return "bg-green-50 text-green-700 border-green-200";
      case "Coordinador":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Alumne":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
          <h1 className="text-2xl font-bold text-text-primary">Comunicacions</h1>
          <p className="text-text-secondary">Gestiona totes les comunicacions del sistema</p>
        </div>
        <div className="flex space-x-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {communications.filter(c => !c.llegit).length} no llegides
          </Badge>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Nova Comunicació
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nova Comunicació</DialogTitle>
                <DialogDescription>
                  Envia una comunicació a professors, coordinadors o alumnes.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipusDest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipus de Destinatari</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipus" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Professor">Professor</SelectItem>
                              <SelectItem value="Coordinador">Coordinador</SelectItem>
                              <SelectItem value="Alumne">Alumne</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tipus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipus de Comunicació</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipus" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Assignació">Assignació</SelectItem>
                              <SelectItem value="Avís">Avís</SelectItem>
                              <SelectItem value="Recordatori">Recordatori</SelectItem>
                              <SelectItem value="Reunió">Reunió</SelectItem>
                              <SelectItem value="Sortida">Sortida</SelectItem>
                              <SelectItem value="Canvi">Canvi</SelectItem>
                              <SelectItem value="Informe">Informe</SelectItem>
                              <SelectItem value="Tasca">Tasca</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="destinatariId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destinatari</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un destinatari" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professors.map((prof: any) => (
                              <SelectItem key={prof.id} value={prof.id.toString()}>
                                {prof.nom} {prof.cognoms}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="missatge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Missatge</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escriu el missatge..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel·lar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCommunicationMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createCommunicationMutation.isPending ? "Enviant..." : "Enviar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </CardTitle>
            {(typeFilter || statusFilter || recipientFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Esborrar filtres
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipus</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els tipus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tots">Tots els tipus</SelectItem>
                  <SelectItem value="Assignació">Assignació</SelectItem>
                  <SelectItem value="Avís">Avís</SelectItem>
                  <SelectItem value="Recordatori">Recordatori</SelectItem>
                  <SelectItem value="Reunió">Reunió</SelectItem>
                  <SelectItem value="Sortida">Sortida</SelectItem>
                  <SelectItem value="Informe">Informe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estat</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els estats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tots">Tots els estats</SelectItem>
                  <SelectItem value="llegit">Llegides</SelectItem>
                  <SelectItem value="no_llegit">No llegides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Destinatari</label>
              <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els destinataris" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tots">Tots els destinataris</SelectItem>
                  <SelectItem value="Professor">Professors</SelectItem>
                  <SelectItem value="Coordinador">Coordinadors</SelectItem>
                  <SelectItem value="Alumne">Alumnes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <div className="space-y-4">
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha comunicacions
            </h3>
            <p className="text-gray-500 mb-4">
              {(typeFilter || statusFilter || recipientFilter) 
                ? "Amb els filtres aplicats no s'han trobat comunicacions."
                : "Encara no s'han creat comunicacions."
              }
            </p>
          </div>
        ) : (
          filteredCommunications.map((comm) => (
            <Card 
              key={comm.id} 
              className={`hover:shadow-md transition-shadow ${!comm.llegit ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(comm.tipus)}>
                        {comm.tipus}
                      </Badge>
                      <Badge variant="outline" className={getRecipientColor(comm.tipusDest)}>
                        {comm.tipusDest}
                      </Badge>
                    </div>
                    {!comm.llegit && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Nova
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(comm.createdAt).toLocaleDateString('ca-ES')}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <User className="w-3 h-3 mr-1" />
                        ID: {comm.destinatariId}
                      </div>
                    </div>
                    {!comm.llegit && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsReadMutation.mutate(comm.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        {comm.llegit ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{comm.missatge}</p>
                </div>
                {comm.relatedGuardiaId && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Relacionat amb guàrdia ID: {comm.relatedGuardiaId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}