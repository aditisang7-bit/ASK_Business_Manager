import React, { useEffect, useState } from 'react';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // SECURITY CHECK: Redirect if not Super Admin
    if (!DB.isAdmin()) {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [bizData, custData] = await Promise.all([
          DB.getAllBusinesses(),
          DB.getAllGlobalCustomers()
        ]);
        setBusinesses(bizData || []);
        setCustomers(custData || []);
      } catch (e) {
        console.error("Failed to load admin data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const totalRevenue = businesses.filter(b => b.is_subscribed).length * 999; // Mock calculation based on subs

  if (isLoading) return <div className="p-10 text-center">Loading Admin Data...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2"><i className="fa-solid fa-user-shield mr-2"></i>Super Admin Panel</h1>
            <p className="text-slate-400">ASK Multinational Company • Master Control</p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full opacity-20 filter blur-3xl -mr-16 -mt-16"></div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 font-bold uppercase">Total Businesses</p>
           <h3 className="text-3xl font-bold text-slate-800">{businesses.length}</h3>
           <div className="mt-2 text-green-600 text-xs font-bold"><i className="fa-solid fa-arrow-up"></i> Active on Platform</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 font-bold uppercase">Total Customers</p>
           <h3 className="text-3xl font-bold text-slate-800">{customers.length}</h3>
           <div className="mt-2 text-blue-600 text-xs font-bold"><i className="fa-solid fa-users"></i> Across all salons</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 font-bold uppercase">Platform Revenue</p>
           <h3 className="text-3xl font-bold text-indigo-600">₹{totalRevenue}</h3>
           <div className="mt-2 text-gray-400 text-xs">Est. Monthly Recurring</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 font-bold uppercase">System Health</p>
           <h3 className="text-3xl font-bold text-green-600">100%</h3>
           <div className="mt-2 text-gray-400 text-xs">Supabase Connected</div>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-lg text-slate-800">Registered Businesses</h3>
           <button className="text-indigo-600 text-sm font-bold hover:underline">Download CSV</button>
        </div>
        <table className="w-full text-left">
           <thead className="bg-white text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Business Name</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Type</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 text-sm">
              {businesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-slate-50">
                   <td className="p-4 font-bold text-slate-800">{biz.name}</td>
                   <td className="p-4 font-mono text-xs">{biz.email}</td>
                   <td className="p-4">{biz.phone}</td>
                   <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{biz.type}</span></td>
                   <td className="p-4 text-capitalize">{biz.subscription_plan || 'Trial'}</td>
                   <td className="p-4">
                     {biz.is_subscribed ? (
                       <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Paid</span>
                     ) : (
                       <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">Free</span>
                     )}
                   </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No businesses synced to Admin Panel yet.</td>
                </tr>
              )}
           </tbody>
        </table>
      </div>

      {/* Global Customer Data Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 bg-slate-50">
           <h3 className="font-bold text-lg text-slate-800">Recent Global Customers</h3>
        </div>
        <table className="w-full text-left">
           <thead className="bg-white text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Linked Business ID</th>
                <th className="p-4">Created At</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 text-sm">
              {customers.slice(0, 10).map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50">
                   <td className="p-4 font-medium">{cust.name}</td>
                   <td className="p-4">{cust.phone}</td>
                   <td className="p-4 font-mono text-xs text-gray-400">{cust.business_id}</td>
                   <td className="p-4 text-gray-500">{new Date(cust.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">No customer data synced yet.</td>
                </tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;