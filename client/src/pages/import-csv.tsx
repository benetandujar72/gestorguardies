import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info, FileDown, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: boolean;
  importedCount: number;
  totalRows: number;
  errors: string[];
}

export default function ImportCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<string>("");
  const [exportEntityType, setExportEntityType] = useState<string>("");
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener años académicos
  const { data: academicYears } = useQuery({
    queryKey: ['/api/anys-academics'],
  });

  // Encontrar el año académico activo
  const activeAcademicYear = academicYears?.find((year: any) => year.actiu === true);

  const importMutation = useMutation({
    mutationFn: async ({ file, entityType, academicYearId }: { file: File; entityType: string; academicYearId: string }) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('entityType', entityType);
      formData.append('academicYearId', academicYearId);

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error en la importació');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setProgress(100);
      
      // Invalidar totes les caches rellevants per actualitzar les dades
      queryClient.invalidateQueries({ queryKey: ['/api/materies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alumnes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/horaris'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sortides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/anys-academics'] });
      
      toast({
        title: "Importació completada",
        description: `S'han importat ${data.importedCount} de ${data.totalRows} registres.`,
      });
      
      // Auto-reset després de 3 segons per preparar per una nova importació
      setTimeout(() => {
        handleRefresh();
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Error d'importació",
        description: "No s'ha pogut processar el fitxer CSV.",
        variant: "destructive",
      });
      console.error('Import error:', error);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (entityType: string) => {
      const response = await fetch(`/api/export/csv?type=${entityType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error en l\'exportació');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Exportació completada",
        description: "El fitxer CSV s'ha descarregat correctament.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error d'exportació",
        description: "No s'ha pogut exportar les dades.",
        variant: "destructive",
      });
      console.error('Export error:', error);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
      setProgress(0);
    } else {
      toast({
        title: "Format incorrecte",
        description: "Si us plau, selecciona un fitxer CSV vàlid.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    if (!file || !entityType || !academicYearId) {
      toast({
        title: "Dades incompletes",
        description: "Si us plau, selecciona un fitxer, un tipus d'entitat i un curs acadèmic.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({ file, entityType, academicYearId });
  };

  const handleDownloadTemplateForExport = async (exportType: string) => {
    if (!exportType) {
      toast({
        title: "Selecciona un tipus",
        description: "Si us plau, selecciona un tipus d'entitat per descarregar la plantilla.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/download/template?type=${exportType}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al descarregar la plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_${exportType}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Plantilla descarregada",
        description: `S'ha descarregat la plantilla per ${exportType}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No s'ha pogut descarregar la plantilla.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = async () => {
    if (!entityType) {
      toast({
        title: "Selecciona un tipus",
        description: "Si us plau, selecciona un tipus d'entitat per descarregar la plantilla.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/download/template?type=${entityType}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al descarregar la plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_${entityType}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Plantilla descarregada",
        description: `S'ha descarregat la plantilla per ${entityType}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No s'ha pogut descarregar la plantilla.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!exportEntityType) {
      toast({
        title: "Selecciona un tipus",
        description: "Si us plau, selecciona un tipus d'entitat per exportar.",
        variant: "destructive",
      });
      return;
    }

    exportMutation.mutate(exportEntityType);
  };

  const entityTypes = [
    { value: "professors", label: "Professors" },
    { value: "grups", label: "Grups" },
    { value: "alumnes", label: "Alumnes" },
    { value: "aules", label: "Aules" },
    { value: "materies", label: "Matèries" },
    { value: "horaris", label: "Horaris" },
    { value: "guardies", label: "Guàrdies" },
    { value: "sortides", label: "Sortides" },
  ];

  const exportEntityTypes = [
    { value: "sortides", label: "Sortides" },
    { value: "professors", label: "Professors" },
    { value: "grups", label: "Grups" },
    { value: "alumnes", label: "Alumnes" },
    { value: "aules", label: "Aules" },
    { value: "materies", label: "Matèries" },
    { value: "horaris", label: "Horaris" },
    { value: "guardies", label: "Guàrdies" },
  ];

  const csvTemplates = {
    professors: {
      headers: ["nom", "cognom", "email", "telefon", "departament", "carrec"],
      example: "Joan,García,joan.garcia@escola.cat,123456789,Matemàtiques,Cap de departament"
    },
    grups: {
      headers: ["nom", "curs", "nivell", "alumnesCount"],
      example: "1A,1,ESO,25"
    },
    alumnes: {
      headers: ["nom", "cognom", "email", "telefon", "grupId"],
      example: "Maria,Martínez,maria.martinez@estudiants.cat,987654321,1"
    },
    aules: {
      headers: ["nom", "planta", "capacitat", "tipus"],
      example: "Aula 101,1,30,Normal"
    },
    materies: {
      headers: ["nom", "codi", "departament", "horesSetmanals", "tipus", "curs", "descripcio"],
      example: "Matemàtiques,MAT001,Ciències,4,obligatoria,1r ESO,Matemàtiques de primer d'ESO"
    },
    horaris: {
      headers: ["professorId", "grupId", "aulaId", "diaSetmana", "horaInici", "horaFi", "assignatura"],
      example: "1,1,1,Dilluns,08:00,09:00,Matemàtiques"
    },
    guardies: {
      headers: ["data", "horaInici", "horaFi", "lloc", "tipusGuardia"],
      example: "2024-01-15,10:00,11:00,Pati,Pati"
    },
    sortides: {
      headers: ["nomSortida", "descripcio", "lloc", "dataInici", "dataFi", "grupId", "responsableId"],
      example: "Visita al museu,Excursió educativa,Museu d'Art,2024-03-15,2024-03-15,1,2"
    }
  };

  const handleRefresh = () => {
    setFile(null);
    setEntityType("");
    setExportEntityType("");
    setProgress(0);
    setResult(null);
    
    // Reset academic year to active one if exists
    if (activeAcademicYear) {
      setAcademicYearId(String(activeAcademicYear.id));
    } else {
      setAcademicYearId("");
    }
    
    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "Pàgina actualitzada",
      description: "S'han netejat tots els camps per una nova importació",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Importar CSV</h1>
          <p className="text-text-secondary mt-2">
            Importa dades des d'un fitxer CSV al sistema
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Nova importació
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Importar Fitxer</CardTitle>
            <CardDescription>
              Selecciona un fitxer CSV i el tipus d'entitat a importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Curs acadèmic</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el curs acadèmic" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year: any) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.nom} {year.actiu && "(Actiu)"}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
              {academicYearId && activeAcademicYear && String(activeAcademicYear.id) === academicYearId && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Atenció:</strong> Estàs important dades al curs acadèmic actiu. Això pot afectar les dades en ús.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">Tipus d'entitat</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipus d'entitat" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Fitxer CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {importMutation.isPending && (
              <div className="space-y-2">
                <Label>Progrés d'importació</Label>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-text-secondary">
                  Processant fitxer...
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleDownloadTemplate}
                disabled={!entityType}
                variant="outline"
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Descarregar plantilla
              </Button>
              
              <Button
                onClick={handleImport}
                disabled={!file || !entityType || !academicYearId || importMutation.isPending}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Important..." : "Importar CSV"}
              </Button>
            </div>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {result.success ? (
                      <>
                        <strong>Importació exitosa!</strong> S'han importat {result.importedCount} de {result.totalRows} registres.
                      </>
                    ) : (
                      <>
                        <strong>Error d'importació.</strong> S'han trobat {result.errors?.length || 0} errors.
                      </>
                    )}
                  </AlertDescription>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Errors trobats:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {result.errors && result.errors.length > 5 && (
                        <li>... i {result.errors.length - 5} errors més</li>
                      )}
                    </ul>
                  </div>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Export Form */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar Dades</CardTitle>
            <CardDescription>
              Exporta dades del sistema a un fitxer CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportEntityType">Tipus d'entitat</Label>
              <Select value={exportEntityType} onValueChange={setExportEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipus d'entitat" />
                </SelectTrigger>
                <SelectContent>
                  {exportEntityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleDownloadTemplateForExport(exportEntityType)}
                disabled={!exportEntityType}
                variant="outline"
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Descarregar plantilla
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={!exportEntityType || exportMutation.isPending}
                className="flex-1"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? "Exportant..." : "Exportar CSV"}
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Nota:</strong> El fitxer CSV es descarregarà automàticament amb totes les dades disponibles del tipus seleccionat.
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="text-center">
              <h4 className="font-medium text-sm mb-2">Dades disponibles per exportar:</h4>
              <div className="flex flex-wrap gap-1 justify-center">
                {exportEntityTypes.map((type) => (
                  <Badge key={type.value} variant="outline" className="text-xs">
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates and Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Formats CSV</CardTitle>
            <CardDescription>
              Formats requerits per a cada tipus d'entitat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entityType && csvTemplates[entityType as keyof typeof csvTemplates] && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Capçaleres requerides per {entityTypes.find(t => t.value === entityType)?.label}:</h4>
                  <div className="flex flex-wrap gap-1">
                    {csvTemplates[entityType as keyof typeof csvTemplates].headers.map((header) => (
                      <Badge key={header} variant="secondary" className="text-xs">
                        {header}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Exemple de fila:</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                    {csvTemplates[entityType as keyof typeof csvTemplates].example}
                  </code>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descarregar plantilla
                </Button>
              </div>
            )}

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Instruccions:</strong>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• El fitxer ha de tenir extensió .csv</li>
                  <li>• La primera fila ha de contenir les capçaleres</li>
                  <li>• Utilitza comes (,) com a separador</li>
                  <li>• Les dates han d'estar en format YYYY-MM-DD</li>
                  <li>• Les hores han d'estar en format HH:MM</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}