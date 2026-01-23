import React, { useState } from 'react';
import { DB } from '../services/db';
import { Staff, Service, Customer, UserRole } from '../types';

const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'services' | 'customers'>('staff');
  const [staff, setStaff] = useState<Staff[]>(DB.getStaff());
  const [services, setServices] = useState<Service[]>(DB.getServices());
  const [customers, setCustomers] = useState<Customer[]>(DB.getCustomers());

  // Simple prompt-based adding for demo speed. Real app needs modals.
  const handleAddStaff = () => {
    const name = prompt("Staff Name:");
    if (!name) return;
    const newStaff: Staff = {
      id: Date.now().toString(),
      name,
      role: UserRole.STAFF,
      phone: '000-0000',
      commissionRate: 10,
      avatar: `https://picsum.photos/100/100?random=${Date.now()}`,
      status: 'active'
    };
    DB.saveStaff(newStaff);
    setStaff(DB.getStaff());
  };

  const handleAddService = () => {
    const name = prompt("Service Name:");
    if (!name) return;
    const price = Number(prompt("Price ($):", "20"));
    const newService: Service = {
      id: Date.now().toString(),
      name,
      price,
      durationMinutes: 30
    };
    DB.saveService(newService);
    setServices(DB.getServices());
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Management</h2>
      
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'staff' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Staff Members
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'services' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Services Menu
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'customers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Customer Database
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Staff List</h3>
              <button onClick={handleAddStaff} className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-700">Add Staff</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 border rounded-lg hover:border-indigo-200 transition-colors">
                  <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-800">{s.name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.role}</span>
                    <p className="text-xs text-gray-500 mt-1">Comm: {s.commissionRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
             <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Services</h3>
              <button onClick={handleAddService} className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-700">Add Service</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="p-3">Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">${s.price}</td>
                    <td className="p-3">{s.durationMinutes} min</td>
                    <td className="p-3 text-right">
                      <button className="text-red-500 hover:text-red-700" onClick={() => {
                        DB.deleteService(s.id);
                        setServices(DB.getServices());
                      }}><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Customers</h3>
              <div className="relative">
                <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 border rounded text-sm" />
                <i className="fa-solid fa-search absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="p-3">Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Visits</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">
                      <div className="text-xs">{c.phone}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </td>
                    <td className="p-3">{c.totalVisits}</td>
                    <td className="p-3 text-right">
                      <button className="text-indigo-600 hover:underline">History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Management;