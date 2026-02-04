import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../services/db';
import { generateBusinessInsights } from '../services/geminiService';
import { Appointment, DashboardStats, Invoice, AppointmentStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../services/i18n';

// Skeleton Component for Premium Loading State
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-32 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full skeleton"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3 w-20 skeleton rounded"></div>
      <div className="h-8 w-32 skeleton rounded"></div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAppts, setRecentAppts] = useState<Appointment[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile] = useState(DB.getProfile());
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Setup Progress Logic
  const setupProgress = [
    { label: "Add Services", done: DB.getServices().length > 0, link: '/services' },
    { label: "Add Staff", done: DB.getStaff().length > 0, link: '/staff' },
    { label: "Book First Appt", done: DB.getAppointments().length > 0, link: '/appointments' },
    { label: "Set UPI ID", done: !!profile.upiId, link: '/settings' }
  ];
  const progressPercent = Math.round((setupProgress.filter(p => p.done).length / setupProgress.length) * 100);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  useEffect(() => {
    // Simulate a slight network delay to show off the skeleton loaders (improves perceived quality)
    setTimeout(() => {
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
      setIsLoading(false);

      // AI Insight (Async)
      generateBusinessInsights(invoices, appointments).then(setInsight);
    }, 800); // 800ms "premium feel" delay
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Header with Glass Effect */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('nav_dashboard')}</h2>
          <p className="text-slate-500 mt-1">
            {t('dash_welcome')}, <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{profile.name}</span> 
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <div className="bg-white/80 px-4 py-2 rounded-full border border-gray-100 text-sm font-semibold shadow-sm flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             {t('dash_online')}
           </div>
           <button onClick={() => window.location.reload()} className="p-2.5 bg-white rounded-full text-slate-500 hover:text-indigo-600 hover:shadow-md transition-all">
             <i className="fa-solid fa-rotate"></i>
           </button>
        </div>
        {/* Background Blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      {/* Onboarding / Progress Widget (Only shows if incomplete) */}
      {progressPercent < 100 && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-4 relative z-10">
              <div>
                <h3 className="font-bold text-lg">Complete Your Setup</h3>
                <p className="text-indigo-200 text-sm">Finish these steps to unlock full potential.</p>
              </div>
              <span className="text-2xl font-bold">{progressPercent}%</span>
           </div>
           <div className="w-full bg-indigo-900/50 rounded-full h-2 mb-4 relative z-10">
              <div className="bg-indigo-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              {setupProgress.map((step, i) => (
                <Link to={step.link} key={i} className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${step.done ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                   <i className={`fa-solid ${step.done ? 'fa-check-circle' : 'fa-circle-notch'}`}></i> {step.label}
                </Link>
              ))}
           </div>
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dash_new_appt'), icon: 'fa-plus', color: 'bg-indigo-600 text-white', link: '/appointments' },
          { label: t('dash_create_bill'), icon: 'fa-file-invoice-dollar', color: 'bg-white text-slate-700 hover:text-indigo-600', link: '/billing' },
          { label: t('dash_add_customer'), icon: 'fa-user-plus', color: 'bg-white text-slate-700 hover:text-indigo-600', link: '/customers' },
          { label: t('dash_check_stock'), icon: 'fa-box-open', color: 'bg-white text-slate-700 hover:text-indigo-600', link: '/inventory' },
        ].map((btn, i) => (
          <button 
            key={i} 
            onClick={() => navigate(btn.link)} 
            className={`p-4 rounded-2xl shadow-sm transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-2 border border-transparent ${btn.color} ${btn.color.includes('bg-white') ? 'border-gray-100' : ''}`}
          >
            <i className={`fa-solid ${btn.icon} text-xl`}></i>
            <span className="font-bold text-sm">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Cards (With Skeleton Support) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
             <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-sack-dollar"></i>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('dash_revenue_today')}</p>
                <h3 className="text-2xl font-extrabold text-slate-900">{formatINR(stats?.revenueToday || 0)}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('dash_appointments_today')}</p>
                <h3 className="text-2xl font-extrabold text-slate-900">{stats?.appointmentsToday}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('dash_pending_payments')}</p>
                <h3 className="text-2xl font-extrabold text-slate-900">{stats?.pendingPayments}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-users"></i>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('dash_staff_duty')}</p>
                <h3 className="text-2xl font-extrabold text-slate-900">{stats?.staffOnDuty}</h3>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">{t('dash_weekly_rev')}</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+12% vs last week</span>
          </div>
          <div className="h-72">
            {isLoading ? (
               <div className="w-full h-full skeleton rounded-xl"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    formatter={(value: number) => [formatINR(value), 'Revenue']}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                    cursor={{stroke: '#6366f1', strokeWidth: 1}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: AI & Schedule */}
        <div className="space-y-6">
          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group hover:shadow-indigo-500/30 transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-3xl opacity-30 -mr-10 -mt-10 animate-pulse"></div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-yellow-400"></i> {t('dash_smart_insight')}
            </h3>
            {insight ? (
              <p className="text-indigo-100 text-sm leading-relaxed relative z-10 font-medium">
                "{insight}"
              </p>
            ) : (
               <div className="space-y-2">
                  <div className="h-2 w-full bg-white/10 rounded animate-pulse"></div>
                  <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse"></div>
               </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-800">{t('dash_todays_schedule')}</h3>
               <Link to="/appointments" className="text-xs font-bold text-indigo-600 hover:underline">{t('dash_view_all')}</Link>
            </div>
            {isLoading ? (
               <div className="space-y-3">
                 <div className="h-10 w-full skeleton rounded"></div>
                 <div className="h-10 w-full skeleton rounded"></div>
               </div>
            ) : recentAppts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i className="fa-regular fa-calendar text-2xl text-slate-300 mb-2 block"></i>
                <span className="text-sm text-slate-500">{t('dash_no_bookings')}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppts.map(apt => {
                  const customer = DB.getCustomers().find(c => c.id === apt.customerId);
                  const service = DB.getServices().find(s => s.id === apt.serviceId);
                  return (
                    <div key={apt.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="text-center w-12 bg-indigo-50 rounded-lg p-2 text-indigo-700">
                        <span className="block font-bold text-xs">{apt.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 truncate">{service?.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${
                        apt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                        apt.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {apt.status === AppointmentStatus.SCHEDULED ? 'Booked' : apt.status}
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