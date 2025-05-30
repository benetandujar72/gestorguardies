import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info } from "lucide-react";
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
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async ({ file, entityType }: { file: File; entityType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);

      return apiRequest('/api/import/csv', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setProgress(100);
      toast({
        title: "Importació completada",
        description: `S'han importat ${data.importedCount} de ${data.totalRows} registres.`,
      });
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
    if (!file || !entityType) {
      toast({
        title: "Dades incompletes",
        description: "Si us plau, selecciona un fitxer i un tipus d'entitat.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({ file, entityType });
  };

  const entityTypes = [
    { value: "professors", label: "Professors" },
    { value: "grups", label: "Grups" },
    { value: "alumnes", label: "Alumnes" },
    { value: "aules", label: "Aules" },
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
    horaris: {
      headers: ["professorId", "grupId", "aulaId", "diaSetmana", "horaInici", "horaFi", "assignatura"],
      example: "1,1,1,Dilluns,08:00,09:00,Matemàtiques"
    },
    guardies: {
      headers: ["data", "horaInici", "horaFi", "lloc", "tipusGuardia"],
      example: "2024-01-15,10:00,11:00,Pati,Pati"
    }
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <Button
              onClick={handleImport}
              disabled={!file || !entityType || importMutation.isPending}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending ? "Important..." : "Importar CSV"}
            </Button>

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
                        <strong>Error d'importació.</strong> S'han trobat {result.errors.length} errors.
                      </>
                    )}
                  </AlertDescription>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Errors trobats:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... i {result.errors.length - 5} errors més</li>
                      )}
                    </ul>
                  </div>
                )}
              </Alert>
            )}
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