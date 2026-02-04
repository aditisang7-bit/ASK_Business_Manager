import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { generateMarketingMessage } from '../services/geminiService';
import { Appointment, Invoice, PaymentMethod, AppointmentStatus, Customer } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Billing: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  
  // Quick Bill State
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [quickBillData, setQuickBillData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceId: '',
    staffId: '',
    notes: ''
  });

  const [marketingMsg, setMarketingMsg] = useState('');
  const [marketingPhone, setMarketingPhone] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const availableStaff = DB.getStaff().filter(s => s.status === 'active' && s.attendanceToday);

  const loadData = () => {
    const allAppts = DB.getAppointments();
    const allInvoices = DB.getInvoices();
    const billedApptIds = new Set(allInvoices.map(i => i.appointmentId));
    
    setAppointments(allAppts.filter(a => !billedApptIds.has(a.id) && a.status !== AppointmentStatus.CANCELLED));
    setInvoices(allInvoices.sort((a,b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handlePhoneChange = (phone: string) => {
    const customer = DB.getCustomers().find(c => c.phone === phone);
    setQuickBillData(prev => ({
      ...prev,
      phone,
      name: customer ? customer.name : prev.name,
      email: customer ? (customer.email || '') : prev.email
    }));
  };

  const handleQuickBillSubmit = async () => {
    if (!quickBillData.name || !quickBillData.phone || !quickBillData.serviceId) {
      showToast("Please fill Name, Phone and Service.", "error");
      return;
    }

    if (!quickBillData.staffId) {
       showToast("Please select a staff member (or 'Unassigned').", "error");
       return;
    }

    let customer = DB.getCustomers().find(c => c.phone === quickBillData.phone);
    if (!customer) {
      customer = {
        id: Date.now().toString(),
        name: quickBillData.name,
        phone: quickBillData.phone,
        email: quickBillData.email,
        totalVisits: 1,
        loyaltyPoints: 10
      };
      DB.saveCustomer(customer);
    } else {
      customer.totalVisits += 1;
      customer.loyaltyPoints += 10;
      DB.saveCustomer(customer);
    }

    const service = DB.getServices().find(s => s.id === quickBillData.serviceId);
    if (!service) return;

    const newAppt: Appointment = {
      id: `WALKIN-${Date.now()}`,
      customerId: customer.id,
      staffId: quickBillData.staffId, 
      serviceId: service.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: false}),
      status: AppointmentStatus.COMPLETED,
      notes: 'Walk-in / Instant Bill'
    };
    DB.saveAppointment(newAppt);

    const amount = service.price;
    const tax = amount * 0.18; 
    const total = amount + tax;

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      appointmentId: newAppt.id,
      customerId: customer.id,
      date: new Date().toISOString().split('T')[0],
      amount,
      tax,
      total,
      method: paymentMethod,
      generatedAt: new Date().toISOString()
    };
    DB.saveInvoice(newInvoice);

    setIsQuickBillOpen(false);
    setQuickBillData({ name: '', phone: '', email: '', serviceId: '', staffId: '', notes: '' });
    loadData();
    showToast("Invoice Generated Successfully", "success");
    
    setTimeout(() => printInvoice(newInvoice), 500);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedAppt) return;

    const service = DB.getServices().find(s => s.id === selectedAppt.serviceId);
    if (!service) return;

    const amount = service.price;
    const tax = amount * 0.18; 
    const total = amount + tax;

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      appointmentId: selectedAppt.id,
      customerId: selectedAppt.customerId,
      date: new Date().toISOString().split('T')[0],
      amount,
      tax,
      total,
      method: paymentMethod,
      generatedAt: new Date().toISOString()
    };

    DB.saveInvoice(newInvoice);
    const apptUpdate = {...selectedAppt, status: AppointmentStatus.COMPLETED};
    DB.saveAppointment(apptUpdate);

    showToast("Invoice Generated Successfully", "success");

    setLoadingAi(true);
    const customer = DB.getCustomers().find(c => c.id === selectedAppt.customerId);
    if (customer && customer.phone) {
        setMarketingPhone(customer.phone.replace(/\D/g, ''));
    } else {
        setMarketingPhone('');
    }

    const msg = await generateMarketingMessage(customer?.name || 'Customer', service.name);
    setMarketingMsg(msg);
    setLoadingAi(false);

    loadData();
    setSelectedAppt(null); 
    
    setTimeout(() => printInvoice(newInvoice), 500);
  };

  const printInvoice = (invoice: Invoice) => {
    const customer = DB.getCustomers().find(c => c.id === invoice.customerId);
    const appt = DB.getAppointments().find(a => a.id === invoice.appointmentId);
    const service = DB.getServices().find(s => s.id === appt?.serviceId);
    const profile = DB.getProfile();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.name)}&am=${invoice.total}&cu=INR`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Professional Receipt Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 40px; margin: 0; }
          .invoice-box {
            max-width: 800px; margin: auto; padding: 40px; border: 1px solid #eee; background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); color: #333;
          }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: -0.5px; }
          .company-info { text-align: right; font-size: 13px; line-height: 1.5; color: #666; }
          
          .bill-to { margin-bottom: 40px; display: flex; justify-content: space-between; }
          .bill-section h3 { font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 8px 0; font-weight: 600; letter-spacing: 0.5px; }
          .bill-data { font-size: 14px; font-weight: 600; color: #111; line-height: 1.4; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 15px 10px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 15px 10px; border-bottom: 1px solid #eee; font-size: 14px; color: #444; }
          .amount-col { text-align: right; }
          
          .summary { display: flex; justify-content: flex-end; }
          .summary-table { width: 250px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
          .summary-total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: 700; font-size: 18px; color: #000; }
          
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
          .qr-box { text-align: center; }
          .qr-box img { width: 80px; height: 80px; }
          .notes { font-size: 12px; color: #888; max-width: 60%; }
          
          @media print {
            body { background: white; padding: 0; }
            .invoice-box { box-shadow: none; border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">${profile.name}</div>
              <div style="font-size: 12px; color: #888; margin-top: 5px;">Invoice #${invoice.id}</div>
            </div>
            <div class="company-info">
              ${profile.address}<br>
              ${profile.phone}<br>
              ${profile.email}<br>
              ${profile.gstIn ? `GSTIN: ${profile.gstIn}` : ''}
            </div>
          </div>

          <div class="bill-to">
             <div class="bill-section">
                <h3>Billed To</h3>
                <div class="bill-data">
                   ${customer?.name}<br>
                   <span style="font-weight: 400; color: #666;">${customer?.phone}</span>
                </div>
             </div>
             <div class="bill-section" style="text-align: right;">
                <h3>Date Issued</h3>
                <div class="bill-data">${invoice.date}</div>
                <h3 style="margin-top: 15px;">Payment Method</h3>
                <div class="bill-data">${invoice.method}</div>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="50%">Description</th>
                <th width="15%">Qty</th>
                <th width="20%" class="amount-col">Price</th>
                <th width="15%" class="amount-col">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span style="font-weight: 600; color: #000;">${service?.name}</span><br>
                  <span style="font-size: 12px; color: #888;">Professional Service</span>
                </td>
                <td>1</td>
                <td class="amount-col">${formatINR(invoice.amount)}</td>
                <td class="amount-col" style="font-weight: 600;">${formatINR(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
             <div class="summary-table">
                <div class="summary-row">
                   <span>Subtotal</span>
                   <span>${formatINR(invoice.amount)}</span>
                </div>
                <div class="summary-row">
                   <span>Tax (18%)</span>
                   <span>${formatINR(invoice.tax)}</span>
                </div>
                <div class="summary-row summary-total">
                   <span>Total</span>
                   <span>${formatINR(invoice.total)}</span>
                </div>
             </div>
          </div>

          <div class="footer">
             <div class="notes">
               <strong>Terms & Conditions:</strong><br>
               ${profile.invoiceTerms || 'Thank you for your business. No refunds on services rendered.'}
             </div>
             <div class="qr-box">
                <img src="${qrUrl}" alt="QR" />
                <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Scan to Pay</div>
             </div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getServicePrice = (id: string) => DB.getServices().find(s => s.id === id)?.price || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{t('bill_title')}</h2>
           <p className="text-slate-500 text-sm">Manage transactions and create invoices</p>
        </div>
        <button 
          onClick={() => setIsQuickBillOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold flex items-center gap-2 hover:shadow-indigo-500/30"
        >
          <i className="fa-solid fa-bolt"></i> {t('bill_quick')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Checkout List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
          <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
            <i className="fa-regular fa-clock text-orange-500"></i> {t('bill_pending')}
          </h3>
          {appointments.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
              <i className="fa-solid fa-check-circle text-2xl mb-2"></i>
              <p className="text-sm font-medium">{t('bill_no_pending')}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {appointments.map(apt => {
                const customer = DB.getCustomers().find(c => c.id === apt.customerId);
                const service = DB.getServices().find(s => s.id === apt.serviceId);
                return (
                  <li key={apt.id} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 rounded-xl border border-gray-100 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                         {customer?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{customer?.name}</p>
                        <p className="text-xs text-slate-500">{service?.name} • {apt.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAppt(apt)}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow hover:bg-slate-700 transition-all"
                    >
                      {t('bill_checkout')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Invoices List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
          <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
            <i className="fa-solid fa-receipt text-gray-400"></i> {t('bill_recent')}
          </h3>
           <div className="overflow-auto max-h-[400px] pr-2 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="p-3 text-left rounded-l-lg">ID</th>
                  <th className="p-3 text-left">{t('bill_total')}</th>
                  <th className="p-3 text-left">{t('bill_method')}</th>
                  <th className="p-3 text-right rounded-r-lg">{t('common_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-gray-500 font-mono text-xs">#{inv.id.slice(-6)}</td>
                    <td className="p-3 font-bold text-slate-800">{formatINR(inv.total)}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">{inv.method}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => printInvoice(inv)} className="w-8 h-8 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                        <i className="fa-solid fa-print"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        </div>
      </div>

      {/* Quick Bill Modal */}
      {isQuickBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{t('bill_quick')}</h3>
                <button onClick={() => setIsQuickBillOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-times text-xl"></i></button>
             </div>
             
             <div className="space-y-5">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t('bill_enter_phone')}</label>
                 <input 
                   type="tel"
                   value={quickBillData.phone}
                   onChange={e => handlePhoneChange(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                   placeholder="9876543210"
                   autoFocus
                 />
               </div>
               
               <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-400 mb-1">{t('common_name')}</label>
                      <input 
                        className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm"
                        value={quickBillData.name}
                        onChange={e => setQuickBillData({...quickBillData, name: e.target.value})}
                        placeholder="Guest Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-400 mb-1">{t('common_email')}</label>
                      <input 
                        className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm"
                        value={quickBillData.email}
                        onChange={e => setQuickBillData({...quickBillData, email: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{t('appt_service')}</label>
                   <select 
                     className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white"
                     value={quickBillData.serviceId}
                     onChange={e => setQuickBillData({...quickBillData, serviceId: e.target.value})}
                   >
                     <option value="">Select Service...</option>
                     {DB.getServices().map(s => (
                       <option key={s.id} value={s.id}>{s.name} - {formatINR(s.price)}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{t('appt_staff')}</label>
                   <select 
                     className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white"
                     value={quickBillData.staffId}
                     onChange={e => setQuickBillData({...quickBillData, staffId: e.target.value})}
                   >
                     <option value="">Select Staff...</option>
                     {availableStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     <option value="unassigned">Store (No Staff)</option>
                   </select>
                 </div>
               </div>
               
               {quickBillData.serviceId && (
                 <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                    <span className="font-medium text-slate-300">Total Payable</span>
                    <span className="text-xl font-bold">
                      {formatINR(getServicePrice(quickBillData.serviceId) * 1.18)}
                    </span>
                 </div>
               )}

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('bill_method')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(m => (
                      <button 
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-3 px-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === m 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-105' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <i className={`fa-solid ${m === 'CASH' ? 'fa-money-bill' : m === 'UPI' ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
                        {m}
                      </button>
                    ))}
                  </div>
               </div>

               <button onClick={handleQuickBillSubmit} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all text-lg mt-2">
                 {t('bill_confirm_print')}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Regular Checkout Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{t('bill_complete_payment')}</h3>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6 space-y-3">
               <div className="flex justify-between text-gray-600 text-sm">
                 <span>Service Cost</span>
                 <span className="font-medium">{formatINR(getServicePrice(selectedAppt.serviceId))}</span>
               </div>
               <div className="flex justify-between text-gray-600 text-sm">
                 <span>Tax (18% GST)</span>
                 <span className="font-medium">{formatINR(getServicePrice(selectedAppt.serviceId) * 0.18)}</span>
               </div>
               <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                 <span className="font-bold text-slate-800">Total</span>
                 <span className="font-extrabold text-2xl text-indigo-600">
                    {formatINR(getServicePrice(selectedAppt.serviceId) * 1.18)}
                 </span>
               </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">{t('bill_method')}</label>
              <div className="grid grid-cols-3 gap-3">
                {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-3 px-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === m 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`fa-solid ${m === 'CASH' ? 'fa-money-bill' : m === 'UPI' ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setSelectedAppt(null)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium transition-colors">{t('common_cancel')}</button>
              <button onClick={handleGenerateInvoice} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all">
                {t('bill_confirm_print')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;