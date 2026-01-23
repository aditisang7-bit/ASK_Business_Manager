export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum BusinessType {
  SALON = 'SALON',
  MEDICAL = 'MEDICAL', // Future
  SCHOOL = 'SCHOOL',   // Future
  GYM = 'GYM'          // Future
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  PENDING = 'PENDING'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NOSHOW = 'NOSHOW'
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  image?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  commissionRate: number; // percentage
  avatar?: string;
  status: 'active' | 'inactive';
  attendanceToday?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalVisits: number;
  loyaltyPoints: number;
  lastVisit?: string;
  photo?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStockAlert: number;
  vendor?: string;
  lastRestocked?: string;
  image?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  customerId: string;
  date: string;
  amount: number;
  tax: number;
  total: number;
  method: PaymentMethod;
  generatedAt: string;
}

export interface NotificationSettings {
  emailAppt: boolean;
  whatsappAppt: boolean;
  emailPayment: boolean;
  whatsappPayment: boolean;
}

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessType;
  address: string;
  phone: string;
  email: string; // Owner email
  upiId: string;
  isSubscribed: boolean;
  subscriptionPlan: 'trial' | 'monthly' | '3month' | '6month' | 'yearly';
  gstIn?: string;
  logo?: string;
  approved: boolean;
  invoiceTerms?: string;
  notificationSettings: NotificationSettings;
}

// Stats for dashboard
export interface DashboardStats {
  revenueToday: number;
  appointmentsToday: number;
  pendingPayments: number;
  staffOnDuty: number;
}