import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Student, Subject, Grade, Message, Event, Payment, Notification, Attendance } from '@/types';
import { studentService } from '@/services/api/studentService';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface StudentContextType {
  student: Student;
  subjects: Subject[];
  grades: Grade[];
  messages: Message[];
  events: Event[];
  payments: Payment[];
  notifications: Notification[];
  attendances: Attendance[];
  unreadMessages: number;
  unreadNotifications: number;
  markMessageAsRead: (messageId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearUnreadMessages: () => void;
  updateStudentData: (data: Partial<Student>) => void;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const profile = await studentService.getProfile();
        const formattedProfile = {
          ...profile,
          studentId: profile.id,
          class: profile.classes && profile.classes.length > 0 ? profile.classes[0].name : 'Sem Turma',
          classId: profile.classes && profile.classes.length > 0 ? profile.classes[0].id : '',
          year: profile.classes && profile.classes.length > 0 ? profile.classes[0].period : 'N/A',
          enrollmentNumber: profile.enrollmentNumber || '2026' + profile.id.replace(/\D/g, '').padEnd(4, '0').substring(0, 4),
          avatar: profile.employeeProfile?.photoUrl || profile.avatar || localStorage.getItem(`yhanko_avatar_${profile.id}`),
        };
        
        setStudent(formattedProfile);

        // Fetch parallel requests for other data
        const [
          fetchedSubjects,
          fetchedContacts,
          fetchedEvents,
          fetchedPayments,
          fetchedNotifications
        ] = await Promise.all([
          studentService.getSubjects(),
          studentService.getContacts(),
          studentService.getEvents(),
          studentService.getPayments(formattedProfile.id),
          studentService.getNotifications()
        ]);

        setSubjects(fetchedSubjects || []);
        setEvents(fetchedEvents || []);
        setPayments(fetchedPayments || []);
        setNotifications(fetchedNotifications || []);
        
        if (fetchedContacts && fetchedContacts.length > 0) {
          const totalUnread = fetchedContacts.reduce((acc: number, contact: any) => acc + (contact.naoLidas > 0 ? 1 : 0), 0);
          setUnreadMessagesCount(totalUnread);
        }

        // Grades and Attendances require classId which we get from profile
        if (formattedProfile.classId) {
           const [fetchedGrades, fetchedAttendances] = await Promise.all([
             studentService.getGrades(formattedProfile.id, formattedProfile.classId),
             studentService.getAttendances(formattedProfile.id, formattedProfile.classId)
           ]);
           setGrades(fetchedGrades || []);
           setAttendances(fetchedAttendances || []);
        }

      } catch (error) {
        console.error("Erro ao carregar dados do aluno", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [token]);

  const unreadMessages = unreadMessagesCount;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markMessageAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  const clearUnreadMessages = () => {
    setUnreadMessagesCount(0);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // Atualização otimista local
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    try {
      await studentService.markNotificationAsRead(notificationId);
    } catch (e) {
      console.error("Erro ao marcar notificação como lida", e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    // Atualização otimista local
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    try {
      await studentService.markAllNotificationsAsRead();
    } catch (e) {
      console.error("Erro ao marcar todas as notificações como lidas", e);
    }
  };

  const updateStudentData = (data: Partial<Student>) => {
    if (student) {
      setStudent({ ...student, ...data });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver a carregar e não houver student, poderá ter falhado ou não estar autenticado
  // Como o AuthenticatedRoute já protege, isto só acontece se o token for inválido
  // Retornamos os children na mesma, os componentes poderão ter de lidar com student como partial
  // Para manter compatibilidade com os tipos estritos, fazemos um mock de fallback caso falhe (só para não crashar)
  const safeStudent = student || { id: '', name: 'Sem Nome', email: '' } as Student;

  return (
    <StudentContext.Provider value={{
      student: safeStudent,
      subjects,
      grades,
      messages,
      events,
      payments,
      notifications,
      attendances,
      unreadMessages,
      unreadNotifications,
      markMessageAsRead,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearUnreadMessages,
      updateStudentData,
      isLoading
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}