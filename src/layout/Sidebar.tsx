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
  LogOut,
} from '../lib/icons';
import { useStudent } from '@/contexts/StudentContext';
import { useAuthStore } from '@/store/authStore';
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
  const logout = useAuthStore((state) => state.logout);
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
        "fixed lg:sticky left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 flex-shrink-0 shadow-lg shadow-black/20",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-64 lg:w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center space-x-3">
                  <div>
                    <h2 className="font-semibold text-foreground tracking-tight">Portal do Aluno</h2>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="lg:hidden bg-card text-foreground hover:bg-muted border border-border"
              >
                <X className="w-5 h-5" />
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
                  variant="ghost"
                  className={cn(
                    "w-full justify-start relative text-foreground border-transparent hover:bg-gray-100 hover:text-foreground transition-all",
                    isCollapsed ? "px-2" : "px-3",
                    isActive ? "bg-white border-l-[3px] border-l-primary shadow-sm" : "bg-transparent"
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
                  <div className={cn("relative flex items-center justify-center", isCollapsed ? "mx-auto" : "mr-3")}>
                    <Icon className={cn("w-5 h-5 relative z-10", isActive && "text-primary")} />
                  </div>
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
          <div className="p-4 border-t border-border bg-card">
            {!isCollapsed && (
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground label-caps uppercase tracking-wider">Ano Letivo</p>
                <p className="text-sm font-medium text-foreground mt-1 data-mono">{student.year}</p>
              </div>
            )}
            <Button
              variant="outline"
              className={cn(
                "w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors",
                isCollapsed ? "px-2 py-2" : "gap-2"
              )}
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}