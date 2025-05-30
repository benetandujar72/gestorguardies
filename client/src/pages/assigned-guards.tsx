import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Shield, Users, Filter, X } from "lucide-react";

interface AssignedGuard {
  id: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  lloc?: string;
  observacions?: string;
  assignacions: Array<{
    id: number;
    professorId: number;
    prioritat: number;
    estat: string;
    professor: {
      id: number;
      nom: string;
      cognoms: string;
    };
  }>;
}

export default function AssignedGuards() {
  const [dateFilter, setDateFilter] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch assigned guards
  const { data: guards = [], isLoading } = useQuery({
    queryKey: ['/api/guardies'],
    select: (data: AssignedGuard[]) => data.filter(guard => 
      guard.assignacions && guard.assignacions.length > 0
    ),
  });

  // Fetch professors for filter
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/professors'],
  });

  // Filter guards based on selected filters
  const filteredGuards = guards.filter(guard => {
    if (dateFilter && guard.data !== dateFilter) return false;
    if (professorFilter && professorFilter !== "all" && !guard.assignacions.some(a => a.professorId.toString() === professorFilter)) return false;
    if (typeFilter && typeFilter !== "all" && guard.tipusGuardia !== typeFilter) return false;
    if (statusFilter && statusFilter !== "all" && guard.estat !== statusFilter) return false;
    return true;
  });

  const clearFilters = () => {
    setDateFilter("");
    setProfessorFilter("");
    setTypeFilter("");
    setStatusFilter("");
  };

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case "assignada":
        return "bg-green-100 text-green-800 border-green-200";
      case "completada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pendent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (prioritat: number) => {
    switch (prioritat) {
      case 1:
      case 2:
        return "bg-red-100 text-red-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getTypeIcon = (tipus: string) => {
    switch (tipus) {
      case "pati":
        return <Users className="w-4 h-4 text-green-600" />;
      case "biblioteca":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "entrada":
        return <MapPin className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
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
          <h1 className="text-2xl font-bold text-text-primary">Guardies Assignades</h1>
          <p className="text-text-secondary">Gestiona i visualitza totes les guardies amb professors assignats</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredGuards.length} guardies assignades
        </Badge>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </CardTitle>
            {(dateFilter || professorFilter || typeFilter || statusFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Esborrar filtres
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Selecciona data..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Professor</label>
              <Select value={professorFilter} onValueChange={setProfessorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els professors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tots els professors</SelectItem>
                  {professors.map((prof: any) => (
                    <SelectItem key={prof.id} value={prof.id.toString()}>
                      {prof.nom} {prof.cognoms}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipus de Guàrdia</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tots els tipus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tots els tipus</SelectItem>
                  <SelectItem value="pati">Pati</SelectItem>
                  <SelectItem value="biblioteca">Biblioteca</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="menjador">Menjador</SelectItem>
                  <SelectItem value="substitució">Substitució</SelectItem>
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
                  <SelectItem value="all">Tots els estats</SelectItem>
                  <SelectItem value="assignada">Assignada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="pendent">Pendent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuards.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha guardies assignades
            </h3>
            <p className="text-gray-500 mb-4">
              {(dateFilter || professorFilter || typeFilter || statusFilter) 
                ? "Amb els filtres aplicats no s'han trobat guardies."
                : "Encara no s'han assignat guardies."
              }
            </p>
          </div>
        ) : (
          filteredGuards.map((guard) => (
            <Card key={guard.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(guard.tipusGuardia)}
                    <CardTitle className="text-lg capitalize">
                      {guard.tipusGuardia}
                    </CardTitle>
                  </div>
                  <Badge className={getStatusColor(guard.estat)}>
                    {guard.estat}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(guard.data).toLocaleDateString('ca-ES')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{guard.horaInici} - {guard.horaFi}</span>
                    </span>
                  </div>
                  {guard.lloc && (
                    <div className="flex items-center space-x-1 text-sm mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{guard.lloc}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Professors assignats ({guard.assignacions.length}):
                  </h4>
                  {guard.assignacions.map((assignacio) => (
                    <div key={assignacio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">
                          {assignacio.professor.nom} {assignacio.professor.cognoms}
                        </div>
                        <div className="text-xs text-gray-500">
                          Estat: {assignacio.estat}
                        </div>
                      </div>
                      <Badge className={getPriorityColor(assignacio.prioritat)} variant="outline">
                        Prioritat {assignacio.prioritat}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {guard.observacions && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{guard.observacions}</p>
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