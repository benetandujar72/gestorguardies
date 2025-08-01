import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, School, Users, BookOpen, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface LoginCredentials {
  email: string;
  password: string;
}

export default function AuthPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el login');
      }

      // Store JWT token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      toast({
        title: 'Login correcte',
        description: `Benvingut/da ${data.user.nom} ${data.user.cognoms}`,
      });

      // Redirect to dashboard
      setLocation('/');

    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Error desconegut');
      
      toast({
        title: 'Error de login',
        description: error instanceof Error ? error.message : 'Error desconegut',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitUsers = async () => {
    try {
      const response = await fetch('/api/auth/init-users', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Usuaris creats',
          description: 'Usuaris inicials creats correctament',
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error creant usuaris inicials',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          
          {/* Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <School className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Gestor de Guàrdies</CardTitle>
                <CardDescription>
                  Accedeix al sistema de gestió escolar
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuari@insbitacola.cat"
                      value={credentials.email}
                      onChange={handleInputChange('email')}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contrasenya</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={handleInputChange('password')}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accedint...
                      </>
                    ) : (
                      'Accedir'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={handleInitUsers} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Crear usuaris inicials (Dev)
                  </Button>
                </div>

                <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="font-semibold mb-2">Usuaris de prova:</p>
                  <p>📧 admin@insbitacola.cat - admin123</p>
                  <p>📧 director@insbitacola.cat - director123</p>
                  <p>📧 professor@insbitacola.cat - prof123</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hero Section */}
          <div className="space-y-6 lg:pr-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Sistema de Gestió
                <span className="block text-blue-600">d'Assignació de Guàrdies</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Gestiona horaris, assignacions i substitucions de manera eficient
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gestió de Professors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Control d'assignacions i càrrega de treball</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Planificació</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horaris i calendari de guàrdies</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Substitucions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gestió automàtica de substitucions</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                  <School className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Centre Educatiu</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gestió integral de l'institut</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Institut Bitàcola
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                Sistema integrat per a la gestió eficient dels recursos humans i la planificació acadèmica del centre educatiu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}