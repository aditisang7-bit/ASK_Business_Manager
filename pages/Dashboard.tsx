import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../services/db';
import { generateBusinessInsights } from '../services/geminiService';
import { Appointment, DashboardStats, Invoice, AppointmentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../services/i18n';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAppts, setRecentAppts] = useState<Appointment[]>([]);
  const [insight, setInsight] = useState<string>("Analyzing your business data...");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const profile = DB.getProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  useEffect(() => {
    // Load Data
    const appointments = DB.getAppointments();
    const invoices = DB.getInvoices();
    const staff = DB.getStaff();

    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayAppts = appointments.filter(a => a.date === todayStr);
    const todayRev = invoices
      .filter(i => i.date === todayStr)
      .reduce((sum, i) => sum + i.total, 0);
    
    const pending = invoices.filter(i => i.method === 'PENDING').length;
    const staffOnDuty = staff.filter(s => s.status === 'active' && s.attendanceToday).length;

    setStats({
      appointmentsToday: todayAppts.length,
      revenueToday: todayRev,
      pendingPayments: pending,
      staffOnDuty: staffOnDuty
    });

    // Recent appointments
    const sorted = [...todayAppts].sort((a, b) => a.time.localeCompare(b.time));
    setRecentAppts(sorted.slice(0, 5));

    // Chart Data (Last 7 days)
    const chartData = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const rev = invoices.filter(inv => inv.date === dateStr).reduce((s, inv) => s + inv.total, 0);
      return { name: dateStr.slice(8) + '/' + dateStr.slice(5, 7), revenue: rev };
    });
    setRevenueData(chartData);

    // AI Insight
    generateBusinessInsights(invoices, appointments).then(setInsight);

  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-500">{t('common_loading')}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t('nav_dashboard')}</h2>
          <p className="text-slate-500 mt-1">
            {t('dash_welcome')}, <span className="font-semibold text-slate-800">{profile.name}</span> 
            <span className="mx-2 text-slate-300">|</span> 
            {profile.type} Edition
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
             <i className="fa-solid fa-rotate"></i>
           </button>
           <span className="bg-white px-3 py-1 rounded-full border text-sm text-slate-600 shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500"></div> {t('dash_online')}
           </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/appointments')} className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all transform hover:-translate-y-1 flex flex-col items-center gap-2">
          <i className="fa-solid fa-plus-circle text-2xl"></i>
          <span className="font-bold text-sm text-center">{t('dash_new_appt')}</span>
        </button>
        <button onClick={() => navigate('/billing')} className="p-4 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex flex-col items-center gap-2">
          <i className="fa-solid fa-file-invoice-dollar text-2xl"></i>
          <span className="font-bold text-sm text-center">{t('dash_create_bill')}</span>
        </button>
        <button onClick={() => navigate('/customers')} className="p-4 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex flex-col items-center gap-2">
          <i className="fa-solid fa-user-plus text-2xl"></i>
          <span className="font-bold text-sm text-center">{t('dash_add_customer')}</span>
        </button>
        <button onClick={() => navigate('/inventory')} className="p-4 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex flex-col items-center gap-2">
          <i className="fa-solid fa-box-open text-2xl"></i>
          <span className="font-bold text-sm text-center">{t('dash_check_stock')}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-full">
            <i className="fa-solid fa-sack-dollar text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{t('dash_revenue_today')}</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatINR(stats.revenueToday)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <i className="fa-solid fa-calendar-check text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{t('dash_appointments_today')}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.appointmentsToday}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
            <i className="fa-solid fa-clock text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{t('dash_pending_payments')}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.pendingPayments}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-full">
            <i className="fa-solid fa-users text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{t('dash_staff_duty')}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.staffOnDuty}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-lg mb-4 text-slate-800">{t('dash_weekly_rev')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  formatter={(value: number) => [formatINR(value), 'Revenue']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: AI & Schedule */}
        <div className="space-y-6">
          {/* AI Insight Card */}
          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <i className="fa-solid fa-robot text-indigo-400"></i> {t('dash_smart_insight')}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed relative z-10">
              "{insight}"
            </p>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-800">{t('dash_todays_schedule')}</h3>
               <Link to="/appointments" className="text-xs font-bold text-indigo-600 hover:underline">{t('dash_view_all')}</Link>
            </div>
            {recentAppts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <i className="fa-regular fa-calendar text-2xl mb-2 block opacity-50"></i>
                {t('dash_no_bookings')}
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppts.map(apt => {
                  const customer = DB.getCustomers().find(c => c.id === apt.customerId);
                  const service = DB.getServices().find(s => s.id === apt.serviceId);
                  return (
                    <div key={apt.id} className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="text-center w-12 bg-slate-50 rounded p-1">
                        <span className="block font-bold text-slate-700 text-xs">{apt.time}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{service?.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                        apt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                        apt.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;