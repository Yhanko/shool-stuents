import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { Bell, Search, CheckCircle, AlertTriangle, Info, Award, Calendar, GraduationCap, MessageSquare, CreditCard } from '../../lib/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationsView() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStudent();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allNotifications = notifications || [];

  const filteredNotifications = allNotifications.filter(notification => {
    const searchMatch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = typeFilter === 'all' || notification.type === typeFilter;
    const statusMatch = statusFilter === 'all' ||
      (statusFilter === 'read' && notification.read) ||
      (statusFilter === 'unread' && !notification.read);
    return searchMatch && typeMatch && statusMatch;
  });

  const getNotificationIcon = (type: string, category?: string) => {
    if (category) {
      switch (category) {
        case 'academic':
          return <GraduationCap className="w-5 h-5" />;
        case 'event':
          return <Calendar className="w-5 h-5" />;
        case 'message':
          return <MessageSquare className="w-5 h-5" />;
        case 'financial':
          return <CreditCard className="w-5 h-5" />;
        default:
          break;
      }
    }

    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'academic':
        return 'Acadêmico';
      case 'event':
        return 'Evento';
      case 'message':
        return 'Mensagem';
      case 'financial':
        return 'Financeiro';
      default:
        return 'Geral';
    }
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;
  const todayCount = allNotifications.filter(n =>
    n.date ? format(new Date(n.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false
  ).length;

  const markAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600">Mantenha-se atualizado com todas as novidades</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={markAllAsRead}>
            Marcar Todas como Lidas
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{allNotifications.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Não Lidas</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Importantes</p>
              <p className="text-2xl font-bold text-gray-900">
                {allNotifications.filter(n => n.type === 'warning' || n.type === 'error').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="info">Informação</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map(notification => (
          <Card
            key={notification.id}
            className={`transition-all hover:shadow-md cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            onClick={() => markNotificationAsRead(notification.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type, (notification as any).category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(notification as any).category ? (
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel((notification as any).category)}
                        </Badge>
                      ) : null}
                      <span className="text-xs text-gray-500">
                        {notification.date ? format(new Date(notification.date), 'dd MMM, HH:mm', { locale: ptBR }) : null}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{notification.message}</p>
                  {notification.actionUrl ? (
                    <Button variant="link" className="p-0 h-auto mt-2 text-blue-600">
                      Ver detalhes →
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de pesquisa para encontrar as notificações desejadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}