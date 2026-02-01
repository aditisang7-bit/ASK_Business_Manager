import React, { useState } from 'react';
import { DB } from '../services/db';
import { Customer, Appointment } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(DB.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', phone: '', email: '', photo: '' });
  
  // History Modal State
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);

  const { t } = useTranslation();
  const { showToast } = useToast();

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ id: '', name: '', phone: '', email: '', photo: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEditMode(true);
    setFormData({ id: c.id, name: c.name, phone: c.phone, email: c.email || '', photo: c.photo || '' });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if(!formData.name || !formData.phone) return;
    
    let c: Customer;
    
    if (isEditMode) {
      const existing = customers.find(x => x.id === formData.id);
      if (!existing) return;
      c = {
        ...existing,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        photo: formData.photo
      };
      showToast("Customer details updated", "success");
    } else {
       c = {
         id: Date.now().toString(),
         name: formData.name,
         phone: formData.phone,
         email: formData.email,
         photo: formData.photo,
         totalVisits: 0,
         loyaltyPoints: 0
      };
      showToast("New customer added", "success");
    }
    
    DB.saveCustomer(c);
    setCustomers(DB.getCustomers());
    setIsModalOpen(false);
  };

  const openHistory = (customer: Customer) => {
    const allAppts = DB.getAppointments();
    const custAppts = allAppts
      .filter(a => a.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryAppointments(custAppts);
    setSelectedCustomerForHistory(customer);
  };

  const getServiceName = (id: string) => DB.getServices().find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('cust_title')}</h2>
        <button onClick={handleOpenAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow">
           <i className="fa-solid fa-plus mr-2"></i> {t('cust_add')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
           <div className="relative max-w-md">
             <input 
               type="text" 
               placeholder={t('common_search')} 
               className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
             <i className="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">{t('appt_customer')}</th>
                <th className="p-4">Contact</th>
                <th className="p-4">{t('cust_visits')}</th>
                <th className="p-4">{t('cust_loyalty')}</th>
                <th className="p-4">{t('cust_last_visit')}</th>
                <th className="p-4 text-right">{t('common_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {c.photo ? (
                        <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-900">{c.phone}</div>
                    <div className="text-xs text-gray-400">{c.email}</div>
                  </td>
                  <td className="p-4">{c.totalVisits}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-bold text-xs">
                      {c.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{c.lastVisit || 'N/A'}</td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button onClick={() => handleOpenEdit(c)} className="text-slate-500 hover:text-indigo-600" title="Edit">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onClick={() => openHistory(c)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50">
                      {t('cust_view_history')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Customer' : t('cust_add')}</h3>
            <div className="space-y-3">
              <div className="flex justify-center mb-4">
                 <div className="relative">
                    <img 
                      src={formData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'C')}&background=random`} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100" 
                      alt="Preview"
                    />
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-indigo-700 shadow-md">
                      <i className="fa-solid fa-camera text-xs"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_name')} <span className="text-red-500">*</span></label>
                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Customer Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_phone')} <span className="text-red-500">*</span></label>
                <input className="w-full border rounded p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_email')}</label>
                <input className="w-full border rounded p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="customer@mail.com" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">{t('common_cancel')}</button>
              <button onClick={handleSaveCustomer} className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">{t('common_save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-slate-800">{t('cust_history_title')} - {selectedCustomerForHistory.name}</h3>
              <button onClick={() => setSelectedCustomerForHistory(null)} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-times text-xl"></i></button>
            </div>
            
            <div className="flex-1 overflow-auto">
               {historyAppointments.length === 0 ? (
                 <p className="text-center text-gray-400 py-10">No history found for this customer.</p>
               ) : (
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3">{t('appt_date')}</th>
                        <th className="p-3">{t('appt_service')}</th>
                        <th className="p-3">{t('appt_status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {historyAppointments.map(appt => (
                        <tr key={appt.id}>
                          <td className="p-3 font-mono text-xs">{appt.date} <span className="text-gray-400 ml-1">{appt.time}</span></td>
                          <td className="p-3 font-medium">{getServiceName(appt.serviceId)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;