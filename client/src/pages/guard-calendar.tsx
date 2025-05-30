import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Clock, MapPin, User, Download, ExternalLink } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ca } from "date-fns/locale";

interface GuardEvent {
  id: number;
  data: string;
  hora: string;
  tipusGuardia: string;
  categoria: string;
  observacions?: string;
  assignacioId?: number;
  professor?: {
    id: number;
    nom: string;
    cognoms: string;
  };
  aula?: {
    id: number;
    nom: string;
  };
}

export default function GuardCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  });

  // Fetch guards for the next 4 weeks
  const { data: guards = [], isLoading } = useQuery({
    queryKey: ['/api/guardies', format(selectedWeek, 'yyyy-MM-dd')],
    select: (data: GuardEvent[]) => data,
  });

  // Get guards for the selected week
  const weekStart = selectedWeek;
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const weekGuards = guards.filter(guard => {
    const guardDate = parseISO(guard.data);
    return guardDate >= weekStart && guardDate <= weekEnd;
  });

  // Group guards by day
  const groupedGuards = weekGuards.reduce((acc, guard) => {
    const day = format(parseISO(guard.data), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(guard);
    return acc;
  }, {} as Record<string, GuardEvent[]>);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const getGuardTypeColor = (tipus: string, categoria: string) => {
    if (categoria === 'Especial') return "bg-purple-100 text-purple-800 border-purple-200";
    switch (tipus) {
      case 'Substitució':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'Pati':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Biblioteca':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'Aula':
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportToGoogleCalendar = () => {
    // Create Google Calendar URL with guard events
    const events = weekGuards.map(guard => {
      const date = format(parseISO(guard.data), 'yyyyMMdd');
      const title = `Guàrdia ${guard.tipusGuardia}${guard.professor ? ` - ${guard.professor.nom} ${guard.professor.cognoms}` : ''}`;
      const details = `Tipus: ${guard.tipusGuardia}\nCategoria: ${guard.categoria}${guard.aula ? `\nAula: ${guard.aula.nom}` : ''}${guard.observacions ? `\nObservacions: ${guard.observacions}` : ''}`;
      
      return `${title}\n${date}T${guard.hora.replace(':', '')}00\n${details}`;
    }).join('\n\n');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Guàrdies%20Setmana&details=${encodeURIComponent(events)}`;
    window.open(calendarUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendari de Guàrdies</h1>
          <p className="text-text-secondary">
            Visualització setmanal de les guàrdies assignades
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToGoogleCalendar}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Exportar a Google Calendar
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigateWeek('prev')}
            >
              ← Setmana anterior
            </Button>
            <div className="text-center">
              <CardTitle className="text-lg">
                {format(weekStart, 'dd MMM', { locale: ca })} - {format(weekEnd, 'dd MMM yyyy', { locale: ca })}
              </CardTitle>
              <CardDescription>
                Setmana {format(weekStart, 'wo', { locale: ca })} de l'any
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigateWeek('next')}
            >
              Setmana següent →
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayGuards = groupedGuards[dayKey] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={dayKey} className={`min-h-[300px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {format(day, 'EEEE', { locale: ca })}
                    </CardTitle>
                    <div className="flex items-center space-x-1 mt-1">
                      <CalendarDays className="w-3 h-3 text-text-secondary" />
                      <span className="text-xs text-text-secondary">
                        {format(day, 'dd MMM', { locale: ca })}
                      </span>
                    </div>
                  </div>
                  {dayGuards.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {dayGuards.length} guàrdies
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayGuards.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sense guàrdies</p>
                  </div>
                ) : (
                  dayGuards
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((guard) => (
                      <div
                        key={guard.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getGuardTypeColor(guard.tipusGuardia, guard.categoria)}>
                            {guard.tipusGuardia}
                          </Badge>
                          <div className="flex items-center text-xs text-text-secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {guard.hora}
                          </div>
                        </div>
                        
                        {guard.professor && (
                          <div className="flex items-center text-sm mb-1">
                            <User className="w-3 h-3 mr-1 text-text-secondary" />
                            <span className="font-medium">
                              {guard.professor.nom} {guard.professor.cognoms}
                            </span>
                          </div>
                        )}
                        
                        {guard.aula && (
                          <div className="flex items-center text-sm mb-1">
                            <MapPin className="w-3 h-3 mr-1 text-text-secondary" />
                            <span>{guard.aula.nom}</span>
                          </div>
                        )}
                        
                        {guard.categoria && (
                          <div className="text-xs text-text-secondary mt-1">
                            Categoria: {guard.categoria}
                          </div>
                        )}
                        
                        {guard.observacions && (
                          <div className="text-xs text-text-secondary mt-1 italic">
                            {guard.observacions}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Resum de la Setmana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weekGuards.length}</div>
              <div className="text-sm text-text-secondary">Total Guàrdies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weekGuards.filter(g => g.professor).length}
              </div>
              <div className="text-sm text-text-secondary">Assignades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {weekGuards.filter(g => !g.professor).length}
              </div>
              <div className="text-sm text-text-secondary">Pendents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {weekGuards.filter(g => g.categoria === 'Especial').length}
              </div>
              <div className="text-sm text-text-secondary">Especials</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}