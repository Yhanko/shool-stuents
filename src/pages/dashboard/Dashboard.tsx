import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from './StatsCard';
import { useStudent } from '@/contexts/StudentContext';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  TrendingUp,
  Clock,
  Calendar,
  MessageSquare,
  BookOpen,
  CreditCard
} from '../../lib/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { student, subjects, events, payments, messages, pautaData } = useStudent();

  const navigate = useNavigate();

  let averageGrade = 0;
  if (pautaData && pautaData.subjects) {
    const subjectsWithMfd = pautaData.subjects.filter((s: any) => s.final.mfd !== null);
    if (subjectsWithMfd.length > 0) {
      averageGrade = subjectsWithMfd.reduce((acc: number, s: any) => acc + s.final.mfd, 0) / subjectsWithMfd.length;
    }
  }
  const upcomingEvents = events.filter(event => new Date(event.date) > new Date()).slice(0, 3);
  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const recentMessages = messages.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Bem-vindo, {student.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-foreground/80">
              Aqui está um resumo das suas atividades acadêmicas
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-foreground/80">Turma</p>
            <p className="text-lg font-semibold">{student.class}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Média Geral (MFD)"
          value={averageGrade > 0 ? averageGrade.toFixed(1).replace('.', ',') : '-'}
          icon={GraduationCap}
          color="bg-blue-500"
          description={pautaData?.subjects?.some((s: any) => s.final.mfd !== null) ? "Baseado nas médias finais" : "Sem médias finais calculadas"}
        />
        <StatsCard
          title="Disciplinas"
          value={subjects.length}
          icon={BookOpen}
          color="bg-green-500"
          description="Disciplinas matriculadas"
        />
        <StatsCard
          title="Próximos Eventos"
          value={upcomingEvents.length}
          icon={Calendar}
          color="bg-orange-500"
          description="Eventos esta semana"
        />
        <StatsCard
          title="Mensagens"
          value={messages.filter(m => !m.read).length}
          icon={MessageSquare}
          color="bg-purple-500"
          description="Mensagens não lidas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Desempenho por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-gray-500">{subject.teacher}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{subject.currentGrade}</p>
                  <p className="text-sm text-gray-500">{subject.attendance}% freq.</p>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('performance')}
            >
              Ver Detalhes Completos
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  <Badge variant={event.type === 'exam' ? 'destructive' : 'secondary'}>
                    {event.type === 'exam' ? 'Prova' : 'Evento'}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(event.date), 'dd MMM, yyyy', { locale: ptBR })} às {event.time}
                  </p>
                  {event.location ? (
                    <p className="text-sm text-gray-400">{event.location}</p>
                  ) : null}
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('calendar')}
            >
              Ver Calendário Completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Mensagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {message.sender.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{message.sender}</p>
                    {!message.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(message.date), 'dd MMM', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('messages')}
            >
              Ver Todas as Mensagens
            </Button>
          </CardContent>
        </Card>

        {/* Financial Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Situação Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPayments.length > 0 ? (
              <>
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div>
                      <p className="font-medium text-orange-900">{payment.description}</p>
                      <p className="text-sm text-orange-700">
                        Vence em {format(new Date(payment.dueDate), 'dd MMM', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-900">KZ{payment.amount}</p>
                      <Badge variant="destructive" className="text-xs">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('payments')}
                >
                  Gerir Pagamentos
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-green-900">Situação em Dia</p>
                <p className="text-sm text-green-700 mt-1">
                  Não tem pagamentos pendentes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}