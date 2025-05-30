import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, X, FileText } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const taskSchema = z.object({
  assignaId: z.number().optional(),
  descripcio: z.string().min(1, "La descripció és obligatòria"),
  dataVenciment: z.string().optional(),
  prioritat: z.enum(["baixa", "mitjana", "alta", "urgent"]).default("mitjana"),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignacioId?: number;
}

interface Professor {
  id: number;
  nom: string;
  cognoms: string;
}

export default function TaskModal({ isOpen, onClose, assignacioId }: TaskModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch professors for assignment selection
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
    enabled: isOpen,
  });

  // Fetch assignments if needed
  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/assignacions-guardia'],
    enabled: isOpen && !assignacioId,
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      assignaId: assignacioId,
      prioritat: "mitjana",
      dataVenciment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await apiRequest('POST', '/api/tasques', data);
      return response.json();
    },
    onSuccess: async (newTask) => {
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        try {
          await apiRequest('POST', `/api/tasques/${newTask.id}/attachments`, formData);
        } catch (error) {
          console.error('Error uploading files:', error);
          toast({
            title: "Avís",
            description: "La tasca s'ha creat però hi ha hagut problemes amb els adjunts.",
            variant: "destructive",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/tasques'] });
      toast({
        title: "Tasca creada",
        description: "La tasca s'ha creat correctament.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut crear la tasca.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedFiles([]);
    onClose();
  };

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tasca</DialogTitle>
          <DialogDescription>
            Crea una nova tasca i assigna-la a un professor o assignació de guàrdia.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="descripcio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripció de la Tasca</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Descriu la tasca a realitzar..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!assignacioId && (
                <FormField
                  control={form.control}
                  name="assignaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignació de Guàrdia</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una assignació" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignments.map((assignment: any) => (
                            <SelectItem key={assignment.id} value={assignment.id.toString()}>
                              Assignació #{assignment.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="dataVenciment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Límit</FormLabel>
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
              name="prioritat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioritat</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="mitjana">Mitjana</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Area */}
            <div>
              <FormLabel>Adjunts</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors mt-2">
                <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-text-secondary mb-2">
                  Arrossega fitxers aquí o{" "}
                  <label className="text-primary hover:underline cursor-pointer">
                    navega
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-text-secondary">
                  PDF, DOC, JPG fins a 10MB per fitxer
                </p>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-text-primary">{file.name}</span>
                        <span className="text-xs text-text-secondary">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 text-text-secondary hover:text-error"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="flex-1 bg-primary hover:bg-blue-800"
              >
                {createTaskMutation.isPending ? "Creant..." : "Crear Tasca"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancel·lar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
