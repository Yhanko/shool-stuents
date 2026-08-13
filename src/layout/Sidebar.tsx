import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  GraduationCap,
  MessageSquare,
  Calendar,
  CreditCard,
  BookOpen,
  Bot,
  User,
  Bell,
  Menu,
  X,
  TrendingUp,
} from '../lib/icons';
import { useStudent } from '@/contexts/StudentContext';
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'notas', label: 'Notas', icon: GraduationCap },
  { id: 'performance', label: 'Desempenho', icon: TrendingUp },
  { id: 'chat', label: 'Mensagens', icon: MessageSquare, hasNotification: true },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'recursos', label: 'Recursos', icon: BookOpen },
  { id: 'assistente', label: 'IA Tutora', icon: Bot },
  { id: 'notificacoes', label: 'Notificações', icon: Bell, hasNotification: true },
  { id: 'perfil', label: 'Perfil', icon: User }
];

export function Sidebar({ currentPage, onPageChange, isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { student, unreadMessages, unreadNotifications, clearUnreadMessages } = useStudent();
  const navigate = useNavigate();
  const getNotificationCount = (itemId: string) => {
    if (itemId === 'chat') return unreadMessages;
    if (itemId === 'notificacoes') return unreadNotifications;
    return 0;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside className={cn(
        "fixed lg:sticky left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex-shrink-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-64 lg:w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Portal do Aluno</h2>
                    
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex bg-blue-600 text-white hover:bg-blue-500 hover:text-white"
              >
                {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="lg:hidden bg-white text-black hover:bg-gray-100 border border-gray-200"
              >
                <X className="w-5 h-5" style={{ stroke: '#000000', color: '#000000' }} />
              </Button>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const notificationCount = getNotificationCount(item.id);

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start relative bg-white text-black border border-blue-600",
                    isCollapsed ? "px-2" : "px-3",
                    isActive && "bg-blue-600 text-white hover:bg-blue-700 flex justify-center"
                  )}
                  onClick={
                    () => {
                      if (item.id === 'chat') {
                        clearUnreadMessages();
                      }
                      onPageChange(item.id);
                      navigate("/" + item.id);
                      onMobileClose(); // Close sidebar on mobile after clicking
                    }
                  }
                >
                  <Icon className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                  
                  {!isCollapsed && notificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {notificationCount}
                    </Badge>
                  )}
                  
                  {isCollapsed && notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      {notificationCount}
                    </div>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {!isCollapsed && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Ano Letivo</p>
                <p className="text-sm font-medium text-gray-900">{student.year}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}