import { useState } from "react";
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ca } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GuardiaWithAssignments {
  id: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  lloc: string | null;
  observacions: string | null | undefined;
  assignacions?: Array<{
    id: number;
    professor?: {
      id: number;
      nom: string;
      cognoms: string;
      fullName: string;
    };
  }>;
}

interface MobileGuardListProps {
  guardies: GuardiaWithAssignments[];
  onEditGuard: (guard: GuardiaWithAssignments) => void;
  onViewAssignments: (guard: GuardiaWithAssignments) => void;
}

export default function MobileGuardList({ guardies, onEditGuard, onViewAssignments }: MobileGuardListProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const startWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const endWeek = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Filtrar guardies per setmana actual
  const weekGuards = guardies.filter(guard => {
    const guardDate = parseISO(guard.data);
    return guardDate >= startWeek && guardDate <= endWeek;
  });

  // Aplicar filtres adicionals
  const filteredGuards = weekGuards.filter(guard => {
    if (filterStatus !== "all" && guard.estat !== filterStatus) return false;
    if (filterType !== "all" && guard.tipusGuardia !== filterType) return false;
    return true;
  });

  // Agrupar per dia
  const groupedByDay = filteredGuards.reduce((acc, guard) => {
    const day = format(parseISO(guard.data), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(guard);
    return acc;
  }, {} as Record<string, GuardiaWithAssignments[]>);

  // Generar dies de la setmana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));

  const getStatusColor = (estat: string) => {
    switch (estat) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'pendent': return 'bg-yellow-100 text-yellow-800';
      case 'completada': return 'bg-blue-100 text-blue-800';
      case 'cancel·lada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (tipus: string) => {
    switch (tipus) {
      case 'pati': return 'bg-blue-100 text-blue-800';
      case 'biblioteca': return 'bg-purple-100 text-purple-800';
      case 'aula': return 'bg-green-100 text-green-800';
      case 'passadís': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls de navegació i filtres */}
      <div className="space-y-3">
        {/* Navegació setmanal */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold text-sm">
              {format(startWeek, 'd MMM', { locale: ca })} - {format(endWeek, 'd MMM yyyy', { locale: ca })}
            </h3>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Estat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tots els estats</SelectItem>
              <SelectItem value="pendent">Pendent</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancel·lada">Cancel·lada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Tipus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tots els tipus</SelectItem>
              <SelectItem value="pati">Pati</SelectItem>
              <SelectItem value="biblioteca">Biblioteca</SelectItem>
              <SelectItem value="aula">Aula</SelectItem>
              <SelectItem value="passadís">Passadís</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Llista de dies i guardies */}
      <div className="space-y-3">
        {weekDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayGuards = groupedByDay[dayKey] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={dayKey} className={`${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(day, 'EEEE d MMMM', { locale: ca })}</span>
                    {isToday && <Badge variant="secondary" className="text-xs">Avui</Badge>}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dayGuards.length} guardies
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                {dayGuards.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hi ha guardies programades
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayGuards
                      .sort((a, b) => a.horaInici.localeCompare(b.horaInici))
                      .map(guard => (
                        <Card key={guard.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              {/* Hora i tipus */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    {guard.horaInici} - {guard.horaFi}
                                  </span>
                                </div>
                                <Badge className={`text-xs ${getTypeColor(guard.tipusGuardia)}`}>
                                  {guard.tipusGuardia}
                                </Badge>
                              </div>

                              {/* Estat i lloc */}
                              <div className="flex items-center justify-between">
                                <Badge className={`text-xs ${getStatusColor(guard.estat)}`}>
                                  {guard.estat}
                                </Badge>
                                {guard.lloc && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-500" />
                                    <span className="text-xs text-gray-600">{guard.lloc}</span>
                                  </div>
                                )}
                              </div>

                              {/* Professors assignats */}
                              {guard.assignacions && guard.assignacions.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">
                                    {guard.assignacions.map(a => a.professor?.fullName).join(', ')}
                                  </span>
                                </div>
                              )}

                              {/* Observacions */}
                              {guard.observacions && (
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {guard.observacions}
                                </p>
                              )}

                              {/* Accions */}
                              <div className="flex gap-2 pt-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs"
                                  onClick={() => onViewAssignments(guard)}
                                >
                                  Veure
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-7 text-xs"
                                  onClick={() => onEditGuard(guard)}
                                >
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}