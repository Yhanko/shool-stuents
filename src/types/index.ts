export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  class: string;
  year: string;
  avatar?: string;
  enrollmentNumber: string;
}

export interface Attendance {
  id: string;
  subjectId: string | null;
  date: string;
  status: string; // 'present', 'absent', 'late', 'excused'
}

export interface Grade {
  id: string;
  subject: string;
  grade: number;
  maxGrade: number;
  type: 'test' | 'exam' | 'assignment' | 'project';
  date: string;
  teacher: string;
  period: string;
}

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  teacherId: string;
  code: string;
  color: string;
  description: string;
  currentGrade: number;
  attendance: number;
}

export interface Message {
  id: string;
  sender: string;
  senderType: 'teacher' | 'parent' | 'school' | 'system';
  subject: string;
  content: string;
  date: string;
  read: boolean;
  attachments?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'exam' | 'event' | 'meeting' | 'deadline' | 'holiday';
  subject?: string;
  location?: string;
}

export interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'processing' | 'paid' | 'overdue';
  type: 'tuition' | 'fee' | 'material' | 'transport';
  proofUrl?: string;
  paymentMethod?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'game';
  subject: string;
  url: string;
  description: string;
  uploadDate: string;
}

export interface AIConversation {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  subject?: string;
  helpful?: boolean;
}