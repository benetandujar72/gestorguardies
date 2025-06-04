import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, List, Grid, Clock, User, MapPin } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ca } from "date-fns/locale";

export default function GuardCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Start with June 2025 where substitutions are
    return startOfWeek(new Date('2025-06-02'), { weekStartsOn: 1 });
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Fetch substitutions
  const { data: substitucions = [], isLoading, error } = useQuery({
    queryKey: ['/api/substitucions-necessaries'],
    retry: false
  });

  // Calculate week dates
  const weekStart = selectedWeek;
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Debug info
  console.log('Substitucions loaded:', substitucions?.length);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregant substitucions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error carregant dades</h2>
          <p>No s'han pogut carregar les substitucions.</p>
          <p className="text-sm mt-2">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  // Filter substitutions for current week
  const weekSubstitutions = (substitucions as any[]).filter((sub) => {
    if (!sub.data) return false;
    const subDate = parseISO(sub.data);
    return subDate >= weekStart && subDate <= weekEnd;
  });

  // Group by date
  const groupedByDate: Record<string, any[]> = {};
  weekSubstitutions.forEach(sub => {
    const dateKey = format(parseISO(sub.data), 'yyyy-MM-dd');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(sub);
  });

  const getEstatColor = (estat: string) => {
    switch (estat) {
      case 'pendent': return 'bg-orange-500';
      case 'assignada': return 'bg-blue-500';
      case 'confirmada': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendari de Guardies</h1>
          <p className="text-gray-600">
            Setmana del {format(weekStart, 'dd MMM', { locale: ca })} al {format(weekEnd, 'dd MMM yyyy', { locale: ca })}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Total substitucions: {substitucions?.length || 0} | Aquesta setmana: {weekSubstitutions.length}
          </p>
        </div>
        
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
              onClick={() => setSelectedWeek(startOfWeek(new Date('2025-06-02'), { weekStartsOn: 1 }))}
            >
              Juny 2025
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

      {/* Content */}
      {viewMode === 'list' ? (
        /* Vista de llista */
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = groupedByDate[dayKey] || [];
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
                      <div key={event.id} className="p-4 rounded-lg border border-l-4 border-l-orange-500 bg-orange-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getEstatColor(event.estat)} text-white`}>
                              {event.estat}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {event.horaInici} - {event.horaFi}
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-2">{event.assignatura} - {event.grup}</h4>
                        <p className="text-sm text-gray-600 mb-2">{event.sortida?.nomSortida}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {event.professorOriginal && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-red-500" />
                              <span className="font-medium">Original:</span>
                              <span>{event.professorOriginal.nom} {event.professorOriginal.cognoms}</span>
                            </div>
                          )}
                          {event.professorSubstitut && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-green-500" />
                              <span className="font-medium">Substitut:</span>
                              <span>{event.professorSubstitut.nom} {event.professorSubstitut.cognoms}</span>
                            </div>
                          )}
                          {event.aula && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="font-medium">Aula:</span>
                              <span>{event.aula}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-gray-500 text-center py-4">Cap substitució</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista de calendari */
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = groupedByDate[dayKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={dayKey} className={`min-h-[300px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-2">
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
                      className="p-2 rounded text-xs border-l-2 border-l-orange-500 bg-orange-50"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Badge className={`text-xs ${getEstatColor(event.estat)} text-white`}>
                          {event.estat}
                        </Badge>
                        <span className="text-gray-600">{event.horaInici}</span>
                      </div>
                      
                      <div className="font-medium truncate">{event.assignatura}</div>
                      <div className="text-gray-600 truncate">{event.grup}</div>
                      
                      {event.professorSubstitut && (
                        <div className="text-green-600 font-medium truncate">
                          {event.professorSubstitut.nom}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-8 text-xs">
                      Cap substitució
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
          <CardTitle>Resum</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {substitucions?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Substitucions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {weekSubstitutions.length}
              </div>
              <div className="text-sm text-gray-600">Aquesta Setmana</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {weekSubstitutions.filter(s => s.estat === 'confirmada').length}
              </div>
              <div className="text-sm text-gray-600">Confirmades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {weekSubstitutions.filter(s => s.estat === 'pendent').length}
              </div>
              <div className="text-sm text-gray-600">Pendents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}