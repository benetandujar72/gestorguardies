import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Key,
  Shield,
  Loader2
} from "lucide-react";

export default function GmailConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authCode, setAuthCode] = useState("");

  // Verificar estat de configuració Gmail
  const { data: gmailStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/gmail/status'],
    retry: false,
  });

  // Obtenir URL d'autorització
  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/gmail/auth-url', 'GET');
    },
    onSuccess: (data: any) => {
      // Obrir nova finestra per autorització
      window.open(data.authUrl, '_blank', 'width=500,height=600');
      toast({
        title: "Autorització oberta",
        description: "Completa l'autorització a la nova finestra i torna aquí amb el codi.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Has estat desconnectat. Redirigint...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No s'ha pogut generar l'URL d'autorització.",
        variant: "destructive",
      });
    }
  });

  // Configurar tokens d'autorització
  const configureTokensMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('/api/gmail/auth-callback', 'POST', { code });
    },
    onSuccess: () => {
      toast({
        title: "Gmail configurat",
        description: "L'API de Gmail s'ha configurat correctament. Ja pots enviar emails.",
      });
      setAuthCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/gmail/status'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Has estat desconnectat. Redirigint...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No s'ha pogut configurar l'autorització Gmail.",
        variant: "destructive",
      });
    }
  });

  const handleAuthCodeSubmit = () => {
    if (!authCode.trim()) {
      toast({
        title: "Codi requerit",
        description: "Introdueix el codi d'autorització obtingut de Google.",
        variant: "destructive",
      });
      return;
    }
    configureTokensMutation.mutate(authCode.trim());
  };

  const isConfigured = gmailStatus && typeof gmailStatus === 'object' && 'configured' in gmailStatus ? (gmailStatus as any).configured : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8 text-blue-600" />
          Configuració Gmail API
        </h1>
        <p className="text-muted-foreground mt-2">
          Configura l'autenticació OAuth2 per enviar emails via Gmail API
        </p>
      </div>

      {/* Estat actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estat Actual
          </CardTitle>
          <CardDescription>
            Estat de la configuració del servei d'emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificant configuració...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Configurat
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Gmail API està operatiu i pot enviar emails
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">
                    No Configurat
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Cal completar l'autorització OAuth2
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuració OAuth2 */}
      {!isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Autorització OAuth2
            </CardTitle>
            <CardDescription>
              Configura l'accés segur a Gmail per enviar notificacions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Pas 1:</strong> Fes clic al botó d'autorització per obrir Google OAuth2.
                <br />
                <strong>Pas 2:</strong> Autoritza l'aplicació i copia el codi de verificació.
                <br />
                <strong>Pas 3:</strong> Enganxa el codi aquí i confirma la configuració.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={() => getAuthUrlMutation.mutate()}
                disabled={getAuthUrlMutation.isPending}
                className="w-full flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {getAuthUrlMutation.isPending ? 'Generant...' : 'Obrir Autorització Google'}
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="authCode">Codi d'Autorització</Label>
                <Input
                  id="authCode"
                  type="text"
                  placeholder="Enganxa aquí el codi obtingut de Google"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                />
              </div>

              <Button
                onClick={handleAuthCodeSubmit}
                disabled={!authCode.trim() || configureTokensMutation.isPending}
                className="w-full"
              >
                {configureTokensMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Configurant...
                  </>
                ) : (
                  'Configurar Gmail API'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informació tècnica */}
      <Card>
        <CardHeader>
          <CardTitle>Informació Tècnica</CardTitle>
          <CardDescription>
            Detalls sobre la configuració OAuth2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Scopes utilitzats:</Label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• gmail.send - Enviar emails</li>
                <li>• gmail.readonly - Verificar configuració</li>
              </ul>
            </div>
            <div>
              <Label className="text-sm font-medium">Funcionalitats:</Label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Emails de substitució automàtics</li>
                <li>• Notificacions a professors</li>
                <li>• Comunicacions del sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Gmail API Operatiu</CardTitle>
            <CardDescription>
              El sistema ja pot enviar emails automàticament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Les notificacions per email s'enviaran automàticament quan es confirmin substitucions.
                Els professors rebran emails amb els detalls de les seves assignacions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}