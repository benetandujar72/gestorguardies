import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, List, Grid, Clock, User, MapPin } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ca } from "date-fns/locale";

interface Substitucio {
  id: number;
  tipus: string;
  data: string;
  horaInici: string;
  horaFi: string;
  assignatura: string;
  grup: string;
  aula: string;
  descripcio: string;
  motiu: string;
  estat: string;
  professorOriginal: {
    id: number;
    nom: string;
    cognoms: string;
  } | null;
  professorSubstitut: {
    id: number;
    nom: string;
    cognoms: string;
  } | null;
  sortida: {
    id: number;
    nomSortida: string;
    dataInici: string;
    dataFi: string;
    lloc: string;
  } | null;
}

interface Guardia {
  id: number;
  data: string;
  horaInici: string;
  horaFi: string;
  tipusGuardia: string;
  estat: string;
  observacions?: string;
  assignacions: {
    id: number;
    professor: {
      id: number;
      nom: string;
      cognoms: string;
      fullName: string;
    };
  }[];
}

export default function GuardCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Setmana del 2-8 juny 2025 on hi ha les substitucions
    const june2025 = new Date('2025-06-02');
    return startOfWeek(june2025, { weekStartsOn: 1 }); // Monday start
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('list');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch substitutions
  const { data: substitucions = [], isLoading: loadingSubstitucions } = useQuery({
    queryKey: ['/api/substitucions-necessaries']
  });

  // Fetch regular guards
  const { data: guardies = [], isLoading: loadingGuardies } = useQuery({
    queryKey: ['/api/guardies']
  });

  // Calculate week dates
  const weekStart = selectedWeek;
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter substitutions for current week
  const weekSubstitutions = substitucions.filter((sub: any) => {
    const subDate = parseISO(sub.data);
    return subDate >= weekStart && subDate <= weekEnd;
  });

  // Filter guards for current week
  const weekGuards = guardies.filter((guard: any) => {
    const guardDate = parseISO(guard.data);
    return guardDate >= weekStart && guardDate <= weekEnd;
  });

  // Convert to unified event format
  const allEvents = [
    // Substitutions as events
    ...weekSubstitutions.map((sub: any) => ({
      id: `sub-${sub.id}`,
      type: 'substitucio',
      data: sub.data,
      horaInici: sub.horaInici,
      horaFi: sub.horaFi,
      titol: `${sub.assignatura} - ${sub.grup}`,
      descripcio: sub.sortida?.nomSortida || 'Sortida',
      estat: sub.estat,
      professorOriginal: sub.professorOriginal,
      professorSubstitut: sub.professorSubstitut,
      aula: sub.aula,
      sortida: sub.sortida
    })),
    // Regular guards as events
    ...weekGuards.map((guard: any) => ({
      id: `guard-${guard.id}`,
      type: 'guardia',
      data: guard.data,
      horaInici: guard.horaInici,
      horaFi: guard.horaFi,
      titol: guard.tipusGuardia,
      descripcio: guard.observacions || '',
      estat: guard.estat,
      assignacions: guard.assignacions || []
    }))
  ];

  // Group events by date
  const groupedEvents: Record<string, any[]> = {};
  allEvents.forEach(event => {
    const dateKey = format(parseISO(event.data), 'yyyy-MM-dd');
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  const getEstatColor = (estat: string) => {
    switch (estat) {
      case 'pendent':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'assignada':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'confirmada':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'substitucio':
        return 'border-l-4 border-l-orange-500';
      case 'guardia':
        return 'border-l-4 border-l-blue-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  if (loadingSubstitucions || loadingGuardies) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregant calendari...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendari de Guardies</h1>
          <p className="text-gray-600">
            Setmana del {format(weekStart, 'dd MMM', { locale: ca })} al {format(weekEnd, 'dd MMM yyyy', { locale: ca })}
          </p>
        </div>
        
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Grid className="h-4 w-4 mr-1" />
              Calendari
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Llista
            </Button>
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Setmana anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Avui
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            >
              Setmana següent →
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      {viewMode === 'list' || isMobile ? (
        /* Vista de llista per mòbil */
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = groupedEvents[dayKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={dayKey} className={isToday ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{format(day, 'EEEE, dd MMMM', { locale: ca })}</span>
                    <Badge variant="secondary">{dayEvents.length}</Badge>
                  </CardTitle>
                </CardHeader>
                
                {dayEvents.length > 0 ? (
                  <CardContent className="space-y-3">
                    {dayEvents.map((event) => (
                      <div key={event.id} className={`p-3 rounded-lg border ${getTypeColor(event.type)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getEstatColor(event.estat)}>
                              {event.estat}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {event.horaInici} - {event.horaFi}
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="font-medium">{event.titol}</h4>
                        <p className="text-sm text-gray-600">{event.descripcio}</p>
                        
                        {event.type === 'substitucio' && (
                          <div className="mt-2 space-y-1 text-sm">
                            {event.professorOriginal && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-red-500" />
                                <span className="font-medium">Original:</span>
                                {event.professorOriginal.nom} {event.professorOriginal.cognoms}
                              </div>
                            )}
                            {event.professorSubstitut && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-green-500" />
                                <span className="font-medium">Substitut:</span>
                                {event.professorSubstitut.nom} {event.professorSubstitut.cognoms}
                              </div>
                            )}
                            {event.aula && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="font-medium">Aula:</span>
                                {event.aula}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {event.type === 'guardia' && event.assignacions?.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Assignat:</span>
                            {event.assignacions.map((ass: any) => (
                              <span key={ass.id} className="ml-1">
                                {ass.professor.fullName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-gray-500 text-center py-4">Cap esdeveniment</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista de calendari per desktop */
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = groupedEvents[dayKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={dayKey} className={`min-h-[400px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {format(day, 'EEEE', { locale: ca })}
                      </CardTitle>
                      <p className="text-xs text-gray-600">
                        {format(day, 'dd MMM', { locale: ca })}
                      </p>
                    </div>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded text-xs ${getTypeColor(event.type)} bg-gray-50 hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Badge className={`text-xs ${getEstatColor(event.estat)}`}>
                          {event.estat}
                        </Badge>
                        <span className="text-gray-600">{event.horaInici}</span>
                      </div>
                      
                      <div className="font-medium truncate">{event.titol}</div>
                      <div className="text-gray-600 truncate">{event.descripcio}</div>
                      
                      {event.type === 'substitucio' && event.professorSubstitut && (
                        <div className="text-green-600 font-medium truncate">
                          {event.professorSubstitut.nom} {event.professorSubstitut.cognoms}
                        </div>
                      )}
                      
                      {event.type === 'guardia' && event.assignacions?.length > 0 && (
                        <div className="text-blue-600 font-medium truncate">
                          {event.assignacions[0].professor.fullName}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-8 text-xs">
                      Cap esdeveniment
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resum de la Setmana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {weekSubstitutions.length}
              </div>
              <div className="text-sm text-gray-600">Substitucions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {weekGuards.length}
              </div>
              <div className="text-sm text-gray-600">Guardies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {weekSubstitutions.filter((s: any) => s.estat === 'confirmada').length}
              </div>
              <div className="text-sm text-gray-600">Confirmades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {weekSubstitutions.filter((s: any) => s.estat === 'pendent').length}
              </div>
              <div className="text-sm text-gray-600">Pendents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}