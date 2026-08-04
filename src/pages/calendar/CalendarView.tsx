import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Unused import removed
import { Calendar, Clock, MapPin, Users, BookOpen, Trophy, AlertTriangle } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getEvents();
        // Add fake time properties if missing for UI
        const eventsWithUiProps = data.map((e: any) => ({
          ...e,
          time: format(new Date(e.date), 'HH:mm'),
        }));
        setEvents(eventsWithUiProps);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredEvents = events.filter(event => {
    const typeMatch = filterType === 'all' || event.type === filterType;
    return typeMatch;
  });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.date), date));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <BookOpen className="w-4 h-4" />;
      case 'event':
        return <Users className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'deadline':
        return <AlertTriangle className="w-4 h-4" />;
      case 'holiday':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'event':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'deadline':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'holiday':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário Escolar</h1>
          <p className="text-gray-600">Acompanhe todos os eventos e atividades</p>
        </div>

        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              <SelectItem value="exam">Provas</SelectItem>
              <SelectItem value="event">Eventos</SelectItem>
              <SelectItem value="meeting">Reuniões</SelectItem>
              <SelectItem value="deadline">Prazos</SelectItem>
              <SelectItem value="holiday">Feriados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[80px] p-1 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
                        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                        ${isToday(day) ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}
                        ${!isCurrentMonth ? 'opacity-50' : ''}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded border ${getEventColor(event.type)}`}
                          >
                            {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'dd MMMM, yyyy', { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className={`p-3 rounded-lg border ${getEventColor(event.type)}`}>
                        <div className="flex items-start gap-2">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{event.title}</h4>
                            <p className="text-sm opacity-80 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </div>
                              {event.location ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum evento nesta data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(event.date), 'dd MMM', { locale: ptBR })} às {event.time}
                      </p>
                      {event.location ? (
                        <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                      ) : null}
                    </div>
                    <Badge variant={event.type === 'exam' ? 'destructive' : 'secondary'}>
                      {event.type === 'exam' ? 'Prova' :
                        event.type === 'event' ? 'Evento' :
                          event.type === 'meeting' ? 'Reunião' :
                            event.type === 'deadline' ? 'Prazo' : 'Feriado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Types Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: 'exam', label: 'Provas', color: 'bg-red-100 text-red-700' },
                  { type: 'event', label: 'Eventos', color: 'bg-blue-100 text-blue-700' },
                  { type: 'meeting', label: 'Reuniões', color: 'bg-purple-100 text-purple-700' },
                  { type: 'deadline', label: 'Prazos', color: 'bg-orange-100 text-orange-700' },
                  { type: 'holiday', label: 'Feriados', color: 'bg-green-100 text-green-700' }
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}