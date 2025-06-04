import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Clock, MapPin, User, List, Grid3x3, ChevronLeft, ChevronRight } from "lucide-react";
import MobileGuardList from "@/components/calendar/mobile-guard-list";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ca } from "date-fns/locale";

interface GuardEvent {
  id: number | string;
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
  } | null;
  aula?: {
    id: number;
    nom: string;
  } | null;
}

export default function GuardCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday start
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

  // Fetch guards and substitutions
  const { data: guards = [], isLoading } = useQuery({
    queryKey: ['/api/guardies'],
    select: (data: any[]) => data.map(guard => ({
      id: guard.id,
      data: guard.data,
      hora: guard.horaInici,
      tipusGuardia: guard.tipusGuardia,
      categoria: guard.estat || 'Normal',
      observacions: guard.observacions,
      assignacioId: guard.assignacions?.[0]?.id,
      professor: guard.assignacions?.[0]?.professor ? {
        id: guard.assignacions[0].professor.id,
        nom: guard.assignacions[0].professor.nom,
        cognoms: guard.assignacions[0].professor.cognoms,
      } : null,
      aula: null
    })),
  });

  // Fetch substitutions for outings/activities
  const { data: substitucions = [] } = useQuery({
    queryKey: ['/api/substitucions-necessaries']
  });

  // Week navigation
  const navigateWeek = (direction: 'previous' | 'next') => {
    const daysToAdd = direction === 'next' ? 7 : -7;
    setSelectedWeek(addDays(selectedWeek, daysToAdd));
  };

  // Generate week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter guards for current week
  const weekGuards = guards.filter(guard => {
    const guardDate = parseISO(guard.data);
    return guardDate >= weekStart && guardDate <= weekEnd;
  });

  // Convert substitutions to guard events
  const substitutionEvents: GuardEvent[] = (substitucions as any[]).map(sub => ({
    id: `sub-${sub.id}`,
    data: sub.data,
    hora: sub.horaInici || '08:00',
    tipusGuardia: 'Substitució',
    categoria: sub.estat === 'pendent' ? 'Substitució Pendent' : 
               sub.estat === 'assignada' ? 'Substitució Assignada' : 
               sub.estat === 'confirmada' ? 'Substitució Confirmada' : 'Substitució',
    observacions: `${sub.sortida?.nomSortida || 'Sortida'} - ${sub.assignatura || 'Classe'} (${sub.grup || 'Grup'})`,
    assignacioId: sub.professorSubstitut?.id,
    professor: sub.professorSubstitut ? {
      id: sub.professorSubstitut.id,
      nom: sub.professorSubstitut.nom,
      cognoms: sub.professorSubstitut.cognoms
    } : sub.professorOriginal ? {
      id: sub.professorOriginal.id,
      nom: `${sub.professorOriginal.nom} (Original)`,
      cognoms: sub.professorOriginal.cognoms
    } : null,
    aula: sub.aula ? { id: 1, nom: sub.aula } : null
  }));

  // Filter substitution events for current week
  const weekSubstitutions = substitutionEvents.filter(sub => {
    const subDate = parseISO(sub.data);
    return subDate >= weekStart && subDate <= weekEnd;
  });

  // Combine all events
  const allEvents = [...weekGuards, ...weekSubstitutions];

  // Group all events by day
  const groupedGuards = allEvents.reduce((acc, guard) => {
    const dayKey = format(parseISO(guard.data), 'yyyy-MM-dd');
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(guard);
    return acc;
  }, {} as Record<string, GuardEvent[]>);

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendari de Guàrdies</h1>
          <p className="text-text-secondary">
            Visualització setmanal de les guàrdies assignades
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {!isMobile && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Calendari
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                Llista
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigateWeek('previous')}
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

      {/* Vista condicional: llista per mòbil, calendari per desktop */}
      {isMobile || viewMode === 'list' ? (
        <MobileGuardList 
          guardies={guards.map(guard => ({
            id: guard.id,
            data: guard.data,
            horaInici: guard.hora,
            horaFi: guard.hora,
            tipusGuardia: guard.tipusGuardia,
            estat: guard.categoria,
            lloc: guard.aula?.nom || null,
            observacions: guard.observacions || undefined,
            assignacions: guard.professor ? [{
              id: guard.assignacioId || 0,
              professor: {
                id: guard.professor.id,
                nom: guard.professor.nom,
                cognoms: guard.professor.cognoms,
                fullName: `${guard.professor.nom} ${guard.professor.cognoms}`
              }
            }] : []
          }))}
          onEditGuard={(guard) => {
            console.log('Edit guard:', guard);
          }}
          onViewAssignments={(guard) => {
            console.log('View assignments:', guard);
          }}
        />
      ) : (
        /* Vista de calendari per desktop */
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
                      .map(guard => (
                        <div key={guard.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">
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
      )}

      {/* Summary Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Resum de la Setmana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {weekGuards.length}
              </div>
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