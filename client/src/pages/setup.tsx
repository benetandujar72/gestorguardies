import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building, Calendar, MapPin, Plane } from "lucide-react";

interface SetupResult {
  success: boolean;
  data?: {
    profesores: number;
    grupos: number;
    aulas: number;
    guardias: number;
    sortidas: number;
    horarios: number;
  };
  message: string;
}

export default function Setup() {
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const populateDataMutation = useMutation({
    mutationFn: () => apiRequest('/api/setup/populate-school-data', 'POST', {}),
    onSuccess: (data) => {
      setSetupResult(data);
    },
    onError: (error) => {
      setSetupResult({
        success: false,
        message: `Error: ${error.message}`
      });
    }
  });

  const handlePopulateData = () => {
    populateDataMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuració Inicial del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Pobla la base de datos amb les dades reals del centre educatiu
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Carregar Dades del Centre
          </CardTitle>
          <CardDescription>
            Això crearà tots els professors, grups, aules, guardies i horaris del centre educatiu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Professors que es crearan:</h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Patricia Fajardo", "Alba Serqueda", "Marta Fernàndez", "Mar Villar",
                    "Eva Martin", "Joan Marí", "Julia Coll", "Roger Sabartes",
                    "Maria Creus", "Liliana Perea", "JC Tinoco", "Toni Motos",
                    "Teresa Caralto", "Albert Parrilla", "Noe Muñoz", "Albert Freixenet",
                    "Itziar Fuentes", "Berta Riera", "Laura Manchado", "Luis Cabrera",
                    "Benet Andujar", "Dani Palau", "Inmaculada Murillo", "Mireia Vendrell",
                    "Maria J. Romero", "Marta Lopez", "Xavier Reyes", "Elvira Parra"
                  ].map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Grups ESO:</h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    "1r ESO A", "1r ESO B", "1r ESO C",
                    "2n ESO A", "2n ESO B", "2n ESO C", 
                    "3r ESO A", "3r ESO B", "3r ESO C",
                    "4t ESO A", "4t ESO B", "4t ESO C", "4t ESO D"
                  ].map((grupo) => (
                    <Badge key={grupo} variant="outline" className="text-xs">
                      {grupo}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Aules
                </h4>
                <p className="text-muted-foreground">17 aules diferents: normales, laboratori, informàtica, música, gimnàs</p>
              </div>
              
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Guardies
                </h4>
                <p className="text-muted-foreground">10 guardies planificades per la propera setmana</p>
              </div>
              
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Sortides
                </h4>
                <p className="text-muted-foreground">2 sortides programades: Museu Ciències, Teatre Anglès</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Horaris amb Guardies (G)
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Cada professor tindrà horaris assignats on "G" indica disponibilitat per fer guardies.
                Això permet que el sistema d'assignació automàtica funcioni correctament.
              </p>
            </div>

            <Button 
              onClick={handlePopulateData}
              disabled={populateDataMutation.isPending || setupResult?.success}
              className="w-full"
              size="lg"
            >
              {populateDataMutation.isPending ? (
                "Creant dades..."
              ) : setupResult?.success ? (
                "Dades creades exitosament"
              ) : (
                "Crear Dades del Centre Educatiu"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {setupResult && (
        <Card className={setupResult.success ? "border-green-200 bg-green-50 dark:bg-green-950" : "border-red-200 bg-red-50 dark:bg-red-950"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${setupResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
              <CheckCircle className="h-5 w-5" />
              {setupResult.success ? "Configuració Completada" : "Error en la Configuració"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={setupResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
              {setupResult.message}
            </p>
            
            {setupResult.success && setupResult.data && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.profesores}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Professors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.grupos}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Grups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.aulas}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Aules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.guardias}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Guardies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.sortidas}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Sortides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{setupResult.data.horarios}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Horaris</div>
                </div>
              </div>
            )}

            {setupResult.success && (
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Següents passos:
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Ja pots assignar guardies automàticament</li>
                  <li>• Els professors tenen horaris amb "G" per disponibilitat</li>
                  <li>• El sistema de prioritats està configurat</li>
                  <li>• Pots gestionar sortides i comunicacions</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}