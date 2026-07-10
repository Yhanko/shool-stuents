import api from './axios';
import { Student, Subject, Grade, Message, Event, Payment, Notification } from '@/types';

export const studentService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<Student>) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.patch('/users/me/password', data);
    return response.data;
  },

  getSubjects: async () => {
    try {
      const response = await api.get('/subjects');
      return response.data;
    } catch {
      return [];
    }
  },

  getGrades: async (studentId: string, classId: string) => {
    try {
      const response = await api.get(`/grades/student/${studentId}/class/${classId}`);
      return response.data.map((g: any) => ({
        ...g,
        grade: g.value,
        maxGrade: 20, // default scale 0-20 in Angola
        subject: g.subjectName || g.subject?.name || 'Desconhecida',
        teacher: g.teacherName || g.teacher?.name || 'Professor',
        period: g.term,
        date: g.createdAt || g.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  getAttendances: async (studentId: string, classId: string) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/class/${classId}`);
      return response.data;
    } catch {
      return [];
    }
  },

  getMessages: async () => {
    try {
      // The backend does not have a generic GET /messages yet. Returning empty array for now.
      return [];
    } catch {
      return [];
    }
  },

  sendMessage: async (data: { receiverId: string, content: string, subject?: string }) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  getContacts: async () => {
    try {
      const response = await api.get('/messages/contacts');
      return response.data;
    } catch {
      return [];
    }
  },

  getConversation: async (userId: string) => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    } catch {
      return [];
    }
  },

  markConversationAsRead: async (userId: string) => {
    try {
      const response = await api.patch(`/messages/conversation/${userId}/read`);
      return response.data;
    } catch {
      return { success: false };
    }
  },

  getEvents: async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch {
      return [];
    }
  },

  getSchedules: async () => {
    try {
      const response = await api.get('/schedules');
      return response.data;
    } catch {
      return [];
    }
  },

  getPayments: async (studentId?: string) => {
    try {
      if (studentId) {
        const response = await api.get(`/finance/payments/student/${studentId}`);
        return response.data.map((p: any) => ({
          ...p,
          description: p.description || (p.type === 'tuition' ? 'Propina' : p.type === 'enrollment' ? 'Matrícula' : 'Pagamento'),
          dueDate: p.dueDate || p.createdAt,
        }));
      }
      const response = await api.get('/finance/payments');
      return response.data.map((p: any) => ({
        ...p,
        description: p.description || (p.type === 'tuition' ? 'Propina' : p.type === 'enrollment' ? 'Matrícula' : 'Pagamento'),
        dueDate: p.dueDate || p.createdAt,
      }));
    } catch {
      return [];
    }
  },

  createPayment: async (data: any) => {
    const response = await api.post('/finance/payments', data);
    return response.data;
  },

  submitPaymentProof: async (paymentId: string, proofUrl: string, paymentMethod: string) => {
    const response = await api.patch(`/finance/payments/${paymentId}/submit-proof`, {
      proofUrl,
      paymentMethod
    });
    return response.data;
  },

  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data.map((n: any) => ({
        ...n,
        date: n.createdAt,
      }));
    } catch {
      return [];
    }
  },

  markNotificationAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  getResources: async () => {
    try {
      const response = await api.get('/resources');
      return response.data.map((r: any) => ({
        ...r,
        subject: r.subject?.name || 'Geral',
        className: r.class?.name || 'Geral',
      }));
    } catch {
      return [];
    }
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads/cloudinary', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getAiAnalysis: async (studentId: string, classId: string = '') => {
    const response = await api.get(`/ai/student-analysis/${studentId}?classId=${classId}`);
    return response.data;
  },

  chatWithAi: async (question: string, studentId: string) => {
    const response = await api.post('/ai/chat', { question, studentId });
    return response.data;
  },

  getAiSuggestions: async () => {
    try {
      const response = await api.get('/ai/suggestions');
      return response.data;
    } catch {
      return [];
    }
  }
};

