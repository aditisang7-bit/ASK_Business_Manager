import { Service, Staff, Customer, Appointment, Invoice, BusinessProfile, AppointmentStatus, PaymentMethod, UserRole, BusinessType, InventoryItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Initial Mock Data (unchanged for fallback)
const INITIAL_DATA = {
  services: [
    { id: '1', name: 'Haircut (Men)', price: 550, durationMinutes: 30, description: 'Standard haircut with styling' },
    { id: '2', name: 'Haircut (Women)', price: 950, durationMinutes: 60, description: 'Cut, wash, and blow-dry' },
    { id: '3', name: 'Facial (Gold)', price: 2500, durationMinutes: 45, description: 'Premium gold facial for glowing skin' },
    { id: '4', name: 'Manicure', price: 800, durationMinutes: 30, description: 'Classic manicure' },
    { id: '5', name: 'Hair Color (Global)', price: 4500, durationMinutes: 120, description: 'Full head hair coloring' },
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

// --- Helper: Mappers for Supabase (Snake Case) to App (Camel Case) ---
const mapService = (s: any): Service => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.duration_minutes,
    description: s.description || '',
    image: s.image || ''
});

const mapStaff = (s: any): Staff => ({
    id: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    commissionRate: s.commission_rate,
    status: s.status,
    avatar: s.avatar || '',
    attendanceToday: false // Default to false on sync
});

const mapCustomer = (c: any): Customer => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    totalVisits: c.total_visits || 0,
    loyaltyPoints: c.loyalty_points || 0
});

const mapInventory = (i: any): InventoryItem => ({
    id: i.id,
    name: i.name,
    category: i.category,
    stock: i.stock,
    unit: i.unit,
    minStockAlert: i.min_stock_alert,
    vendor: i.vendor || '',
    image: i.image || ''
});

const mapAppointment = (a: any): Appointment => ({
    id: a.id,
    customerId: a.customer_id,
    staffId: a.staff_id,
    serviceId: a.service_id,
    date: a.date,
    time: a.time,
    status: a.status,
    notes: a.notes || ''
});

const mapInvoice = (i: any): Invoice => ({
    id: i.id,
    appointmentId: i.appointment_id,
    customerId: i.customer_id,
    date: i.date,
    amount: i.amount,
    tax: i.tax,
    total: i.total,
    method: i.method,
    generatedAt: i.generated_at || new Date().toISOString()
});

export const DB = {
  // --- Auth ---
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(DB_KEYS.AUTH_SESSION);
  },
  isAdmin: (): boolean => {
    return localStorage.getItem(DB_KEYS.IS_ADMIN) === 'true';
  },
  
  // Basic Local Login (Fallback)
  login: (email: string) => {
    localStorage.setItem(DB_KEYS.AUTH_SESSION, email);
    if (email === ADMIN_EMAIL) {
      localStorage.setItem(DB_KEYS.IS_ADMIN, 'true');
    } else {
      localStorage.removeItem(DB_KEYS.IS_ADMIN);
    }
  },

  // Check if user exists (for registration)
  checkUserExists: async (email: string): Promise<boolean> => {
      if (!isSupabaseConfigured) return false;
      try {
        const { data, error } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        return !!data;
      } catch (e) {
          console.warn("Check user failed", e);
          return false;
      }
  },

  // --- New: Email Magic Link & Recovery ---
  sendMagicLink: async (email: string) => {
    if (!isSupabaseConfigured) return { success: false, error: "Cloud setup incomplete" };
    try {
      const redirectUrl = window.location.origin + '/auth';
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl, 
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  sendPasswordReset: async (email: string) => {
    if (!isSupabaseConfigured) return { success: false, error: "Cloud setup incomplete" };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/auth?type=recovery', 
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateUserPassword: async (newPassword: string) => {
    if (!isSupabaseConfigured) return { success: false, error: "Cloud setup incomplete" };
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Real Cloud Login & Data Sync
  verifyUser: async (email: string, password?: string): Promise<{success: boolean, message?: string}> => {
    if (email === ADMIN_EMAIL && password === 'Admin@123') {
        DB.login(email);
        return { success: true };
    }

    if (!isSupabaseConfigured) {
        return { success: false, message: "Cloud login unavailable (Env vars missing). Try Guest/Admin login." };
    }

    if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (authData.user && !authError) {
             console.log("Supabase Auth Login Successful");
             localStorage.setItem(DB_KEYS.AUTH_SESSION, email);
             const { data: profileData } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('email', email)
                .maybeSingle();

             if (profileData) {
                 localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profileData));
                 DB.syncDataFromCloud(profileData.id);
                 return { success: true };
             }
        } else {
             console.warn("Supabase Auth Login Failed", authError?.message);
             if (authError?.message.includes("Email not confirmed")) {
                 return { success: false, message: "Please verify your email address before logging in." };
             }
        }
    }

    try {
        const { data, error } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .maybeSingle();

        if (error || !data) {
            return { success: false, message: "Invalid credentials." };
        }

        localStorage.setItem(DB_KEYS.AUTH_SESSION, data.email);
        localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(data));
        localStorage.removeItem(DB_KEYS.IS_ADMIN);

        DB.syncDataFromCloud(data.id);
        return { success: true };
    } catch (e) {
        console.error("Login Exception", e);
    }

    return { success: false, message: "Login failed." };
  },

  syncDataFromCloud: async (businessId: string) => {
      if (!isSupabaseConfigured) return;
      console.log("Syncing data for business:", businessId);
      try {
          const [
              { data: services },
              { data: staff },
              { data: customers },
              { data: inventory },
              { data: appointments },
              { data: invoices }
          ] = await Promise.all([
              supabase.from('services').select('*').eq('business_id', businessId),
              supabase.from('staff').select('*').eq('business_id', businessId),
              supabase.from('all_customers').select('*').eq('business_id', businessId),
              supabase.from('inventory').select('*').eq('business_id', businessId),
              supabase.from('appointments').select('*').eq('business_id', businessId),
              supabase.from('invoices').select('*').eq('business_id', businessId)
          ]);

          if (Array.isArray(services)) localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(services.map(mapService)));
          if (Array.isArray(staff)) localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(staff.map(mapStaff)));
          if (Array.isArray(customers)) localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers.map(mapCustomer)));
          if (Array.isArray(inventory)) localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(inventory.map(mapInventory)));
          if (Array.isArray(appointments)) localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(appointments.map(mapAppointment)));
          if (Array.isArray(invoices)) localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(invoices.map(mapInvoice)));

          console.log("Sync Complete");
      } catch (e) {
          console.error("Failed to sync data from cloud", e);
      }
  },

  loginAsGuest: () => {
    const guestEmail = 'guest@demo.com';
    localStorage.setItem(DB_KEYS.AUTH_SESSION, guestEmail);
    localStorage.removeItem(DB_KEYS.IS_ADMIN);
    
    const currentProfile = localStorage.getItem(DB_KEYS.PROFILE);
    if (!currentProfile) {
        const guestProfile = { ...INITIAL_DATA.profile, name: 'Guest Salon Demo', email: guestEmail, id: 'guest_biz' };
        localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(guestProfile));
        localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(INITIAL_DATA.services));
        localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(INITIAL_DATA.staff));
        localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(INITIAL_DATA.customers));
    }
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_SESSION);
    localStorage.removeItem(DB_KEYS.PROFILE);
    localStorage.removeItem(DB_KEYS.IS_ADMIN);
    
    localStorage.removeItem(DB_KEYS.SERVICES);
    localStorage.removeItem(DB_KEYS.STAFF);
    localStorage.removeItem(DB_KEYS.CUSTOMERS);
    localStorage.removeItem(DB_KEYS.APPOINTMENTS);
    localStorage.removeItem(DB_KEYS.INVOICES);
    localStorage.removeItem(DB_KEYS.INVENTORY);
    localStorage.removeItem(DB_KEYS.AI_CONSULTS);

    if (isSupabaseConfigured) {
        supabase.auth.signOut().then(() => console.log("Signed out from Supabase"));
    }
  },

  register: async (profile: BusinessProfile) => {
    if (isSupabaseConfigured && profile.email && profile.password) {
        const { data, error: authError } = await supabase.auth.signUp({
            email: profile.email,
            password: profile.password,
            options: {
                data: {
                    full_name: profile.name,
                    phone: profile.phone,
                    type: profile.type
                }
            }
        });
        
        if (authError) {
             console.warn("Supabase Auth Registration Warning:", authError.message);
             if (!authError.message.includes("User already registered")) {
                throw authError; 
             }
        }
    }

    localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.setItem(DB_KEYS.AUTH_SESSION, profile.email);

    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.STAFF, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify([]));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('business_profiles').upsert({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          type: profile.type,
          subscription_plan: profile.subscriptionPlan,
          is_subscribed: profile.isSubscribed,
          password: profile.password 
        });

        if (error) throw error;

        const defaultServices = INITIAL_DATA.services.map(s => ({
            id: `${profile.id}_${s.id}`,
            business_id: profile.id,
            name: s.name,
            price: s.price,
            duration_minutes: s.durationMinutes,
            description: s.description
        }));

        const { error: seedError } = await supabase.from('services').insert(defaultServices);
        if (seedError) console.warn("Failed to seed services", seedError);
        
        const formattedServices = defaultServices.map(mapService);
        localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(formattedServices));

      } catch (e) {
        console.error("Supabase Register Error", e);
      }
    }
  },

  // --- Services ---
  getServices: (): Service[] => {
    const data = localStorage.getItem(DB_KEYS.SERVICES);
    return data ? JSON.parse(data) : [];
  },
  saveService: (service: Service) => {
    const list = DB.getServices();
    const existing = list.findIndex(s => s.id === service.id);
    if (existing >= 0) list[existing] = service;
    else list.push(service);
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(list));

    if (isSupabaseConfigured) {
      try {
          const profile = DB.getProfile();
          supabase.from('services').upsert({
              id: service.id,
              business_id: profile.id,
              name: service.name,
              price: service.price,
              duration_minutes: service.durationMinutes,
              description: service.description,
              image: service.image
          }).then(({ error }) => { if(error) console.warn("Supabase Service Sync Error", error); });
      } catch(e) {}
    }
  },
  deleteService: (id: string) => {
    const list = DB.getServices().filter(s => s.id !== id);
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(list));
    if (isSupabaseConfigured) {
      try { supabase.from('services').delete().eq('id', id).then(() => {}); } catch(e){}
    }
  },

  // --- Staff ---
  getStaff: (): Staff[] => {
    const data = localStorage.getItem(DB_KEYS.STAFF);
    return data ? JSON.parse(data) : [];
  },
  saveStaff: (staff: Staff) => {
    const list = DB.getStaff();
    const existing = list.findIndex(s => s.id === staff.id);
    if (existing >= 0) list[existing] = staff;
    else list.push(staff);
    localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(list));

    if (isSupabaseConfigured) {
      try {
          const profile = DB.getProfile();
          supabase.from('staff').upsert({
              id: staff.id,
              business_id: profile.id,
              name: staff.name,
              role: staff.role,
              phone: staff.phone,
              commission_rate: staff.commissionRate,
              status: staff.status,
              avatar: staff.avatar
          }).then(({ error }) => { if(error) console.warn("Supabase Staff Sync Error", error); });
      } catch(e) {}
    }
  },
  deleteStaff: (id: string) => {
    const list = DB.getStaff().filter(s => s.id !== id);
    localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(list));
    if (isSupabaseConfigured) {
      try { supabase.from('staff').delete().eq('id', id).then(() => {}); } catch(e){}
    }
  },

  // --- Customers ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: async (customer: Customer) => {
    const list = DB.getCustomers();
    const existing = list.findIndex(s => s.id === customer.id);
    if (existing >= 0) list[existing] = customer;
    else list.push(customer);
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(list));

    if (isSupabaseConfigured) {
      try {
        const profile = DB.getProfile();
        await supabase.from('all_customers').upsert({
            id: customer.id,
            business_id: profile.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            total_visits: customer.totalVisits,
            loyalty_points: customer.loyaltyPoints
        });
      } catch (e) {
        console.warn("Supabase Customer Sync Error", e);
      }
    }
  },

  // --- Profile ---
  getProfile: (): BusinessProfile => {
      const data = localStorage.getItem(DB_KEYS.PROFILE);
      return data ? JSON.parse(data) : INITIAL_DATA.profile;
  },
  saveProfile: (profile: BusinessProfile) => {
      localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profile));
      if (isSupabaseConfigured) {
          supabase.from('business_profiles').upsert({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              address: profile.address,
              upi_id: profile.upiId,
              gst_in: profile.gstIn,
              invoice_terms: profile.invoiceTerms,
              is_subscribed: profile.isSubscribed,
              subscription_plan: profile.subscriptionPlan,
              notification_settings: profile.notificationSettings
          }).then(({error}) => { if(error) console.warn("Profile Sync Error", error)});
      }
  },

  // --- Appointments ---
  getAppointments: (): Appointment[] => {
      const data = localStorage.getItem(DB_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [];
  },
  saveAppointment: (appt: Appointment) => {
      const list = DB.getAppointments();
      const existing = list.findIndex(a => a.id === appt.id);
      if (existing >= 0) list[existing] = appt;
      else list.push(appt);
      localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(list));

      if (isSupabaseConfigured) {
          const profile = DB.getProfile();
          supabase.from('appointments').upsert({
              id: appt.id,
              business_id: profile.id,
              customer_id: appt.customerId,
              staff_id: appt.staffId,
              service_id: appt.serviceId,
              date: appt.date,
              time: appt.time,
              status: appt.status,
              notes: appt.notes
          }).then(({error}) => { if(error) console.warn("Appt Sync Error", error)});
      }
  },
  checkAvailability: (staffId: string, date: string, time: string, durationMinutes: number): boolean => {
      const appts = DB.getAppointments().filter(a => a.staffId === staffId && a.date === date && a.status !== AppointmentStatus.CANCELLED);
      // Simplified: check if exact start time is taken
      const isBusy = appts.some(a => a.time === time); 
      return !isBusy;
  },

  // --- Invoices ---
  getInvoices: (): Invoice[] => {
      const data = localStorage.getItem(DB_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
  },
  saveInvoice: (invoice: Invoice) => {
      const list = DB.getInvoices();
      const existing = list.findIndex(i => i.id === invoice.id);
      if (existing >= 0) list[existing] = invoice;
      else list.push(invoice);
      localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(list));

      if (isSupabaseConfigured) {
          const profile = DB.getProfile();
          supabase.from('invoices').upsert({
              id: invoice.id,
              business_id: profile.id,
              appointment_id: invoice.appointmentId,
              customer_id: invoice.customerId,
              date: invoice.date,
              amount: invoice.amount,
              tax: invoice.tax,
              total: invoice.total,
              method: invoice.method,
              generated_at: invoice.generatedAt
          }).then(({error}) => { if(error) console.warn("Invoice Sync Error", error)});
      }
  },

  // --- Inventory ---
  getInventory: (): InventoryItem[] => {
      const data = localStorage.getItem(DB_KEYS.INVENTORY);
      return data ? JSON.parse(data) : [];
  },
  saveInventoryItem: (item: InventoryItem) => {
      const list = DB.getInventory();
      const existing = list.findIndex(i => i.id === item.id);
      if (existing >= 0) list[existing] = item;
      else list.push(item);
      localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(list));

      if (isSupabaseConfigured) {
          const profile = DB.getProfile();
          supabase.from('inventory').upsert({
              id: item.id,
              business_id: profile.id,
              name: item.name,
              category: item.category,
              stock: item.stock,
              unit: item.unit,
              min_stock_alert: item.minStockAlert,
              vendor: item.vendor,
              image: item.image
          }).then(({error}) => { if(error) console.warn("Inventory Sync Error", error)});
      }
  },

  // --- AI Consults (Local Only for now) ---
  saveAIConsultation: (data: any) => {
      const history = JSON.parse(localStorage.getItem(DB_KEYS.AI_CONSULTS) || '[]');
      history.push(data);
      localStorage.setItem(DB_KEYS.AI_CONSULTS, JSON.stringify(history));
  },

  // --- Admin ---
  getAllBusinesses: async () => {
      if (!isSupabaseConfigured) return [];
      const { data } = await supabase.from('business_profiles').select('*');
      return data || [];
  },
  getAllGlobalCustomers: async () => {
      if (!isSupabaseConfigured) return [];
      const { data } = await supabase.from('all_customers').select('*').order('created_at', { ascending: false });
      return data || [];
  }
};
