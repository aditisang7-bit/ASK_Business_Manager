import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Appointment, Customer, Service, Staff, AppointmentStatus } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    staffId: '',
    serviceId: '',
    time: '09:00',
    notes: ''
  });

  // New Customer State
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const loadData = () => {
    const all = DB.getAppointments();
    setAppointments(all.filter(a => a.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time)));
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleDateChange = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = () => {
    setError('');
    
    let finalCustomerId = formData.customerId;

    // Handle New Customer Creation
    if (isNewCustomer) {
      if (!newCustomerData.name || !newCustomerData.phone) {
        setError('Please enter Name and Phone for the new customer.');
        return;
      }
      
      const newCust: Customer = {
        id: Date.now().toString(),
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        totalVisits: 0,
        loyaltyPoints: 0,
        email: ''
      };
      
      DB.saveCustomer(newCust);
      finalCustomerId = newCust.id;
      showToast("New customer registered!", "success");
    } else {
      if (!finalCustomerId) {
        setError('Please select a customer.');
        return;
      }
    }

    // Validation
    if (!finalCustomerId || !formData.staffId || !formData.serviceId) {
      setError('Please fill all fields');
      return;
    }

    const service = DB.getServices().find(s => s.id === formData.serviceId);
    if (!service) return;

    // Check conflict
    const isAvailable = DB.checkAvailability(formData.staffId, selectedDate, formData.time, service.durationMinutes);
    
    const newAppt: Appointment = {
      id: Date.now().toString(),
      date: selectedDate,
      status: AppointmentStatus.SCHEDULED,
      ...formData,
      customerId: finalCustomerId // Use the resolved customer ID
    };

    DB.saveAppointment(newAppt);
    loadData();
    closeModal();
    showToast("Appointment booked successfully!", "success");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ customerId: '', staffId: '', serviceId: '', time: '09:00', notes: '' });
    setIsNewCustomer(false);
    setNewCustomerData({ name: '', phone: '' });
    setError('');
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    const appt = DB.getAppointments().find(a => a.id === id);
    if (appt) {
      appt.status = status;
      DB.saveAppointment(appt);
      loadData();
      showToast(`Status updated to ${status}`, "info");
    }
  };

  const customers = DB.getCustomers();
  const allStaff = DB.getStaff();
  // Filter staff: Only Active AND Present staff can be selected for new appointments
  const availableStaff = allStaff.filter(s => s.status === 'active' && s.attendanceToday);
  
  const services = DB.getServices();
  
  const getSelectedService = () => services.find(s => s.id === formData.serviceId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('appt_title')}</h2>
          <p className="text-sm text-slate-500">{t('appt_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border rounded-lg shadow-sm">
             <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-50 text-gray-600 border-r"><i className="fa-solid fa-chevron-left"></i></button>
             <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm outline-none w-36 text-center"
            />
             <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-50 text-gray-600 border-l"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
          <button onClick={goToToday} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 text-gray-600 font-medium">Today</button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors"
          >
            <i className="fa-solid fa-plus mr-2"></i> {t('dash_new_appt')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fa-regular fa-calendar-xmark text-4xl mb-3 block opacity-30 mx-auto"></i>
            <p className="text-lg font-medium">{t('dash_no_bookings')}</p>
            <p className="text-sm mt-1 text-gray-400">Click "New Appointment" to book a slot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t('appt_time')}</th>
                  <th className="p-4 font-semibold">{t('appt_customer')}</th>
                  <th className="p-4 font-semibold">{t('appt_service')}</th>
                  <th className="p-4 font-semibold">{t('appt_staff')}</th>
                  <th className="p-4 font-semibold">{t('appt_status')}</th>
                  <th className="p-4 font-semibold text-right">{t('common_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {appointments.map(appt => {
                  const customer = customers.find(c => c.id === appt.customerId);
                  const staff = allStaff.find(s => s.id === appt.staffId); // Show all staff in history, even absent ones
                  const service = services.find(s => s.id === appt.serviceId);
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{appt.time}</td>
                      <td className="p-4">
                        <div className="font-medium">{customer?.name}</div>
                        <div className="text-xs text-gray-500">{customer?.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100">
                          {service?.name}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">{service?.durationMinutes} min</div>
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        {staff?.avatar && <img src={staff.avatar} className="w-6 h-6 rounded-full" alt="" />}
                        <span>{staff?.name}</span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={appt.status}
                          onChange={(e) => handleStatusChange(appt.id, e.target.value as AppointmentStatus)}
                          className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer ${
                            appt.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-800' :
                            appt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                         <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                           <i className="fa-solid fa-pen-to-square"></i>
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t('appt_book_modal')}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
            </div>
            {error && <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded flex items-center gap-2"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}
            
            <div className="space-y-4">
              {/* Customer Selection / Registration */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">{t('appt_customer')}</label>
                  <button 
                    onClick={() => setIsNewCustomer(!isNewCustomer)}
                    className="text-xs text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-0.5 rounded"
                  >
                    {isNewCustomer ? 'Select Existing' : 'Add New +'}
                  </button>
                </div>
                
                {isNewCustomer ? (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-fade-in">
                    <div className="col-span-2 text-xs font-bold text-slate-500 uppercase">New Customer Details</div>
                    <input 
                      className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Full Name"
                      value={newCustomerData.name}
                      onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                      autoFocus
                    />
                    <input 
                      className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Phone Number"
                      value={newCustomerData.phone}
                      onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                    />
                  </div>
                ) : (
                  <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.customerId}
                    onChange={e => setFormData({...formData, customerId: e.target.value})}
                  >
                    <option value="">{t('appt_select_customer')}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('appt_date')}</label>
                  <input type="date" disabled value={selectedDate} className="w-full border rounded-lg p-2 bg-gray-50" />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('appt_time')}</label>
                  <input 
                    type="time" 
                    className="w-full border rounded-lg p-2"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appt_service')}</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={formData.serviceId}
                  onChange={e => setFormData({...formData, serviceId: e.target.value})}
                >
                  <option value="">{t('appt_select_service')}</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({formatINR(s.price)})</option>)}
                </select>
                {formData.serviceId && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {getSelectedService()?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appt_staff')}</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={formData.staffId}
                  onChange={e => setFormData({...formData, staffId: e.target.value})}
                >
                  <option value="">{t('appt_select_staff')}</option>
                  {availableStaff.length === 0 && <option disabled>No staff present today</option>}
                  {availableStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {availableStaff.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    <i className="fa-solid fa-circle-exclamation"></i> Staff must be marked 'Present' in Staff Management to be assigned.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common_cancel')}</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow">{t('appt_confirm')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;