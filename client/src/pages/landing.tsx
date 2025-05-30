import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Shield, Users, Calendar, BarChart3, Bot } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-primary">GestióGuàrdies</h1>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-blue-800">
              Iniciar Sessió
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Sistema de Gestió de{" "}
            <span className="text-primary">Guardies Educatives</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Automatitza l'assignació de guardies, gestiona tasques i optimitza la distribució 
            de responsabilitats al teu centre educatiu amb intel·ligència artificial.
          </p>
          <div className="mt-10">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-blue-800 text-lg px-8 py-4"
            >
              Començar Ara
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Funcionalitats Principals</h2>
          <p className="mt-4 text-lg text-gray-600">
            Tot el que necessites per gestionar les guardies del teu centre educatiu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Assignació Automatitzada</CardTitle>
              <CardDescription>
                Algoritme intel·ligent que assigna guardies segons prioritats i equilibri de càrrega
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Gestió de Professors</CardTitle>
              <CardDescription>
                Control complet de professorat, grups, alumnes i disponibilitats
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Horaris i Sortides</CardTitle>
              <CardDescription>
                Integració amb calendaris i gestió automàtica de sortides i activitats
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Assistent IA</CardTitle>
              <CardDescription>
                Chat bot intel·ligent per ajuda, prediccions i optimització de guardies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Analítiques</CardTitle>
              <CardDescription>
                Mètriques detallades, informes i seguiment de l'equilibri de guardies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <School className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Gestió de Tasques</CardTitle>
              <CardDescription>
                Assignació de tasques amb adjunts, comunicacions i seguiment
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Avantatges del Sistema</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Estalvia Temps i Recursos
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Assignació automàtica segons regles de prioritat</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Equilibri automàtic de la càrrega de treball</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Importació de dades des de CSV</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Comunicacions automàtiques als afectats</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Control i Transparència
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Mètriques en temps real</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Historial complet d'assignacions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Prediccions amb intel·ligència artificial</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Interfície moderna i intuïtiva</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">GestióGuàrdies</span>
            </div>
            <p className="text-gray-600">
              Sistema integral de gestió de guardies escolares amb IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
