import { Service, Staff, Customer, Appointment, Invoice, BusinessProfile, AppointmentStatus, PaymentMethod, UserRole, BusinessType, InventoryItem } from '../types';
import { supabase } from './supabaseClient';

// Initial Mock Data (unchanged for fallback)
const INITIAL_DATA = {
  services: [
    { id: '1', name: 'Haircut (Men)', price: 15, durationMinutes: 30, description: 'Standard haircut with styling' },
    { id: '2', name: 'Haircut (Women)', price: 40, durationMinutes: 60, description: 'Cut, wash, and blow-dry' },
    { id: '3', name: 'Facial (Gold)', price: 50, durationMinutes: 45, description: 'Premium gold facial for glowing skin' },
    { id: '4', name: 'Manicure', price: 25, durationMinutes: 30, description: 'Classic manicure' },
    { id: '5', name: 'Hair Color (Global)', price: 80, durationMinutes: 120, description: 'Full head hair coloring' },
  ] as Service[],
  staff: [
    { id: '1', name: 'Sarah Jones', role: UserRole.OWNER, phone: '555-0101', commissionRate: 0, status: 'active', attendanceToday: true, avatar: 'https://picsum.photos/100/100?random=1' },
    { id: '2', name: 'Mike Ross', role: UserRole.STAFF, phone: '555-0102', commissionRate: 10, status: 'active', attendanceToday: true, avatar: 'https://picsum.photos/100/100?random=2' },
    { id: '3', name: 'Jessica Lee', role: UserRole.MANAGER, phone: '555-0103', commissionRate: 5, status: 'active', attendanceToday: false, avatar: 'https://picsum.photos/100/100?random=3' },
  ] as Staff[],
  customers: [
    { id: '1', name: 'Alice Smith', phone: '555-1000', email: 'alice@example.com', totalVisits: 5, loyaltyPoints: 50, lastVisit: '2023-10-15' },
    { id: '2', name: 'Bob Brown', phone: '555-1002', email: 'bob@example.com', totalVisits: 1, loyaltyPoints: 10, lastVisit: '2023-10-20' },
  ] as Customer[],
  inventory: [
    { id: '1', name: 'Loreal Shampoo', category: 'Hair Care', stock: 12, unit: 'Bottle', minStockAlert: 5, vendor: 'Beauty Supply Co' },
    { id: '2', name: 'Facial Kit', category: 'Skin Care', stock: 3, unit: 'Kit', minStockAlert: 5, vendor: 'Glow Vendors' },
    { id: '3', name: 'Hair Color Tubes', category: 'Chemicals', stock: 25, unit: 'Tube', minStockAlert: 10, vendor: 'Beauty Supply Co' }
  ] as InventoryItem[],
  profile: {
    id: 'biz_001',
    name: 'Luxe Salon & Spa',
    type: BusinessType.SALON,
    address: '123 Fashion Ave, Metro City',
    phone: '555-SALON-01',
    upiId: 'luxesalon@upi',
    email: 'askmultinationalcompany@gmail.com',
    isSubscribed: true,
    subscriptionPlan: 'starter',
    approved: true,
    gstIn: '',
    invoiceTerms: 'No returns on products. Services are non-refundable.',
    notificationSettings: {
      emailAppt: true,
      whatsappAppt: true,
      emailPayment: true,
      whatsappPayment: false
    }
  } as BusinessProfile
};

const DB_KEYS = {
  SERVICES: 'salon_services',
  STAFF: 'salon_staff',
  CUSTOMERS: 'salon_customers',
  APPOINTMENTS: 'salon_appointments',
  INVOICES: 'salon_invoices',
  PROFILE: 'salon_profile',
  INVENTORY: 'salon_inventory',
  AUTH_SESSION: 'salon_auth_session',
  AI_CONSULTS: 'salon_ai_consults',
  IS_ADMIN: 'salon_is_admin'
};

const ADMIN_EMAIL = 'askmultinationalcompany@gmail.com';

export const DB = {
  // --- Auth ---
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(DB_KEYS.AUTH_SESSION);
  },
  isAdmin: (): boolean => {
    return localStorage.getItem(DB_KEYS.IS_ADMIN) === 'true';
  },
  login: (email: string) => {
    localStorage.setItem(DB_KEYS.AUTH_SESSION, email);
    if (email === ADMIN_EMAIL) {
      localStorage.setItem(DB_KEYS.IS_ADMIN, 'true');
    } else {
      localStorage.removeItem(DB_KEYS.IS_ADMIN);
    }
  },
  loginAsGuest: () => {
    const guestEmail = 'guest@demo.com';
    localStorage.setItem(DB_KEYS.AUTH_SESSION, guestEmail);
    localStorage.removeItem(DB_KEYS.IS_ADMIN);
    
    // Ensure a default profile exists for the guest
    const currentProfile = localStorage.getItem(DB_KEYS.PROFILE);
    if (!currentProfile) {
        const guestProfile = { ...INITIAL_DATA.profile, name: 'Guest Salon Demo', email: guestEmail, id: 'guest_biz' };
        localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(guestProfile));
    }
  },
  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_SESSION);
    localStorage.removeItem(DB_KEYS.IS_ADMIN);
  },
  register: async (profile: BusinessProfile) => {
    localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.setItem(DB_KEYS.AUTH_SESSION, profile.email);

    // Sync to Supabase for Admin visibility
    try {
      await supabase.from('business_profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        type: profile.type,
        subscription_plan: profile.subscriptionPlan,
        is_subscribed: profile.isSubscribed
      });
    } catch (e) {
      console.error("Supabase Sync Error", e);
    }
  },

  // --- Services ---
  getServices: (): Service[] => {
    const data = localStorage.getItem(DB_KEYS.SERVICES);
    return data ? JSON.parse(data) : INITIAL_DATA.services;
  },
  saveService: (service: Service) => {
    const list = DB.getServices();
    const existing = list.findIndex(s => s.id === service.id);
    if (existing >= 0) list[existing] = service;
    else list.push(service);
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(list));
  },
  deleteService: (id: string) => {
    const list = DB.getServices().filter(s => s.id !== id);
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(list));
  },

  // --- Staff ---
  getStaff: (): Staff[] => {
    const data = localStorage.getItem(DB_KEYS.STAFF);
    return data ? JSON.parse(data) : INITIAL_DATA.staff;
  },
  saveStaff: (staff: Staff) => {
    const list = DB.getStaff();
    const existing = list.findIndex(s => s.id === staff.id);
    if (existing >= 0) list[existing] = staff;
    else list.push(staff);
    localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(list));
  },
  deleteStaff: (id: string) => {
    const list = DB.getStaff().filter(s => s.id !== id);
    localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(list));
  },

  // --- Customers ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : INITIAL_DATA.customers;
  },
  saveCustomer: async (customer: Customer) => {
    // Save locally
    const list = DB.getCustomers();
    const existing = list.findIndex(s => s.id === customer.id);
    if (existing >= 0) list[existing] = customer;
    else list.push(customer);
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(list));

    // Sync to Supabase for Admin visibility
    try {
      const profile = DB.getProfile();
      await supabase.from('all_customers').upsert({
          id: customer.id,
          business_id: profile.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
      });
    } catch (e) {
        console.warn("Supabase sync failed", e);
    }
  },

  // --- Inventory ---
  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(DB_KEYS.INVENTORY);
    return data ? JSON.parse(data) : INITIAL_DATA.inventory;
  },
  saveInventoryItem: (item: InventoryItem) => {
    const list = DB.getInventory();
    const existing = list.findIndex(i => i.id === item.id);
    if (existing >= 0) list[existing] = item;
    else list.push(item);
    localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(list));
  },

  // --- Appointments ---
  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(DB_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveAppointment: (apt: Appointment) => {
    const list = DB.getAppointments();
    const existing = list.findIndex(a => a.id === apt.id);
    if (existing >= 0) list[existing] = apt;
    else list.push(apt);
    localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(list));
  },
  checkAvailability: (staffId: string, date: string, time: string, durationMinutes: number, excludeId?: string): boolean => {
    return true; 
  },

  // --- Invoices ---
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(DB_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  saveInvoice: (invoice: Invoice) => {
    const list = DB.getInvoices();
    list.push(invoice);
    localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(list));
  },

  // --- AI Consultations ---
  saveAIConsultation: async (data: any) => {
      // Local Save
      const existing = localStorage.getItem(DB_KEYS.AI_CONSULTS);
      const arr = existing ? JSON.parse(existing) : [];
      arr.push(data);
      localStorage.setItem(DB_KEYS.AI_CONSULTS, JSON.stringify(arr));

      // Supabase Save
      try {
          await supabase.from('ai_consultations').insert({
              customer_name: 'Guest', 
              recommended_services: data.result,
              skin_type: data.result.skinTone,
              age_group: data.result.ageGroup
          });
      } catch (e) {
          console.warn("Supabase AI Sync failed", e);
      }
  },

  // --- Profile ---
  getProfile: (): BusinessProfile => {
    const data = localStorage.getItem(DB_KEYS.PROFILE);
    if (!data) return INITIAL_DATA.profile;
    const profile = JSON.parse(data);
    // Ensure nested objects exist to prevent crashes
    if (!profile.notificationSettings) profile.notificationSettings = INITIAL_DATA.profile.notificationSettings;
    if (!profile.invoiceTerms) profile.invoiceTerms = INITIAL_DATA.profile.invoiceTerms;
    if (profile.gstIn === undefined) profile.gstIn = '';
    return profile;
  },
  saveProfile: async (profile: BusinessProfile) => {
    localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profile));
    // Sync updates to Admin Panel
    try {
      await supabase.from('business_profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        type: profile.type,
        subscription_plan: profile.subscriptionPlan,
        is_subscribed: profile.isSubscribed
      });
    } catch(e) { console.error(e); }
  },

  // --- Admin Methods ---
  getAllBusinesses: async () => {
    const { data, error } = await supabase.from('business_profiles').select('*');
    if (error) throw error;
    return data;
  },
  getAllGlobalCustomers: async () => {
    const { data, error } = await supabase.from('all_customers').select('*');
    if (error) throw error;
    return data;
  }
};

// Initialize if empty
if (!localStorage.getItem(DB_KEYS.SERVICES)) {
  localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(INITIAL_DATA.services));
  localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(INITIAL_DATA.staff));
  localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(INITIAL_DATA.customers));
  localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(INITIAL_DATA.profile));
  localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(INITIAL_DATA.inventory));
}