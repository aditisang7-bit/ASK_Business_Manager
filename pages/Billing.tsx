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
  const [loadingAi, setLoadingAi] = useState(false);
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Invoice creation state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Available Staff for Quick Bill (Only active & present)
  const availableStaff = DB.getStaff().filter(s => s.status === 'active' && s.attendanceToday);

  const loadData = () => {
    // Only show scheduled or completed but unbilled appointments
    const allAppts = DB.getAppointments();
    const allInvoices = DB.getInvoices();
    const billedApptIds = new Set(allInvoices.map(i => i.appointmentId));
    
    setAppointments(allAppts.filter(a => !billedApptIds.has(a.id) && a.status !== AppointmentStatus.CANCELLED));
    setInvoices(allInvoices.sort((a,b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format INR
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handlePhoneChange = (phone: string) => {
    // Auto-fill if customer exists
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

    // 1. Check or Create Customer
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
      // Update visits
      customer.totalVisits += 1;
      customer.loyaltyPoints += 10;
      DB.saveCustomer(customer);
    }

    // 2. Create a "Ghost" Appointment (Completed) to track history
    const service = DB.getServices().find(s => s.id === quickBillData.serviceId);
    if (!service) return;

    const newAppt: Appointment = {
      id: `WALKIN-${Date.now()}`,
      customerId: customer.id,
      staffId: quickBillData.staffId, // Could be 'unassigned'
      serviceId: service.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: false}),
      status: AppointmentStatus.COMPLETED,
      notes: 'Walk-in / Instant Bill'
    };
    DB.saveAppointment(newAppt);

    // 3. Generate Invoice
    const amount = service.price;
    const tax = amount * 0.18; // 18% GST standard
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

    // 4. Cleanup
    setIsQuickBillOpen(false);
    setQuickBillData({ name: '', phone: '', email: '', serviceId: '', staffId: '', notes: '' });
    loadData();
    showToast("Invoice Generated Successfully", "success");
    
    // 5. Print
    setTimeout(() => printInvoice(newInvoice), 500);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedAppt) return;

    const service = DB.getServices().find(s => s.id === selectedAppt.serviceId);
    if (!service) return;

    const amount = service.price;
    const tax = amount * 0.18; // 18% GST
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
    
    // Auto-update appointment status to completed
    const apptUpdate = {...selectedAppt, status: AppointmentStatus.COMPLETED};
    DB.saveAppointment(apptUpdate);

    showToast("Invoice Generated Successfully", "success");

    // AI Marketing Trigger
    setLoadingAi(true);
    const customer = DB.getCustomers().find(c => c.id === selectedAppt.customerId);
    const msg = await generateMarketingMessage(customer?.name || 'Customer', service.name);
    setMarketingMsg(msg);
    setLoadingAi(false);

    loadData();
    setSelectedAppt(null); 
    
    // Open Print Window immediately
    setTimeout(() => printInvoice(newInvoice), 500);
  };

  const printInvoice = (invoice: Invoice) => {
    const customer = DB.getCustomers().find(c => c.id === invoice.customerId);
    const appt = DB.getAppointments().find(a => a.id === invoice.appointmentId);
    const service = DB.getServices().find(s => s.id === appt?.serviceId);
    const profile = DB.getProfile();
    
    // QR Code for UPI
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.name)}&am=${invoice.total}&cu=INR`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
      <head>
        <title>Invoice #${invoice.id}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .logo-text { font-size: 28px; font-weight: bold; color: #2c3e50; text-transform: uppercase; letter-spacing: 2px; }
          .sub-header { color: #7f8c8d; font-size: 14px; }
          .meta-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .meta-box { width: 48%; }
          .meta-box h4 { margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #7f8c8d; font-size: 12px; text-transform: uppercase; }
          .meta-content { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8f9fa; text-align: left; padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .total-section { float: right; width: 40%; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
          .clear { clear: both; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #eee; padding-top: 20px; }
          .qr-section { margin-top: 30px; text-align: center; }
          .qr-img { width: 100px; height: 100px; border: 1px solid #eee; padding: 5px; }
          .terms { font-size: 11px; color: #7f8c8d; margin-top: 20px; text-align: left; background: #f9f9f9; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-text">${profile.name}</div>
          <div class="sub-header">${profile.address} | ${profile.phone}</div>
          ${profile.email ? `<div class="sub-header">${profile.email}</div>` : ''}
          ${profile.gstIn ? `<div class="sub-header"><strong>GSTIN:</strong> ${profile.gstIn}</div>` : ''}
        </div>
        
        <div class="meta-container">
          <div class="meta-box">
            <h4>Bill To</h4>
            <div class="meta-content">
              <strong>${customer?.name}</strong><br/>
              ${customer?.phone}<br/>
              ${customer?.email || ''}
            </div>
          </div>
          <div class="meta-box" style="text-align: right;">
             <h4>Invoice Details</h4>
             <div class="meta-content">
               <strong>Invoice #:</strong> ${invoice.id}<br/>
               <strong>Date:</strong> ${invoice.date}<br/>
               <strong>Status:</strong> Paid (${invoice.method})
             </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Service Description</th>
              <th width="10%">Qty</th>
              <th width="20%">Price</th>
              <th width="20%">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${service?.name}</strong><br/>
                <span style="font-size: 12px; color: #777;">${service?.description || ''}</span>
              </td>
              <td>1</td>
              <td>${formatINR(invoice.amount)}</td>
              <td>${formatINR(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
             <span>Subtotal:</span>
             <span>${formatINR(invoice.amount)}</span>
          </div>
          <div class="total-row">
             <span>GST (18%):</span>
             <span>${formatINR(invoice.tax)}</span>
          </div>
          <div class="total-row grand-total">
             <span>Grand Total:</span>
             <span>${formatINR(invoice.total)}</span>
          </div>
        </div>
        
        <div class="clear"></div>

        <div class="qr-section">
           <img src="${qrUrl}" class="qr-img" alt="UPI QR" />
           <p style="font-size: 10px; margin-top: 5px;">Scan to pay via UPI</p>
        </div>

        ${profile.invoiceTerms ? `<div class="terms"><strong>Terms & Conditions:</strong><br/>${profile.invoiceTerms}</div>` : ''}

        <div class="footer">
          <p>Thank you for choosing ${profile.name}!</p>
          <p>Disclaimer: Customer payments are received directly by the salon. ASK Multinational Company does not process customer money.</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getServicePrice = (id: string) => DB.getServices().find(s => s.id === id)?.price || 0;
  const getService = (id: string) => DB.getServices().find(s => s.id === id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('bill_title')}</h2>
        <button 
          onClick={() => setIsQuickBillOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors font-bold"
        >
          <i className="fa-solid fa-bolt mr-2"></i> {t('bill_quick')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Checkout List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-700">{t('bill_pending')}</h3>
          {appointments.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('bill_no_pending')}</p>
          ) : (
            <ul className="space-y-3">
              {appointments.map(apt => {
                const customer = DB.getCustomers().find(c => c.id === apt.customerId);
                const service = DB.getServices().find(s => s.id === apt.serviceId);
                return (
                  <li key={apt.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{customer?.name}</p>
                      <p className="text-xs text-slate-500">{service?.name} - {apt.time}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedAppt(apt)}
                      className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-700">{t('bill_recent')}</h3>
           <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">{t('bill_total')}</th>
                  <th className="p-2 text-left">{t('bill_method')}</th>
                  <th className="p-2 text-right">{t('common_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="p-2 text-gray-700 font-mono text-xs">{inv.id}</td>
                    <td className="p-2 font-bold">{formatINR(inv.total)}</td>
                    <td className="p-2"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{inv.method}</span></td>
                    <td className="p-2 text-right">
                      <button onClick={() => printInvoice(inv)} className="text-indigo-600 hover:underline text-xs">
                        <i className="fa-solid fa-download"></i> PDF
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-slate-800">{t('bill_quick')}</h3>
                <button onClick={() => setIsQuickBillOpen(false)} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-times text-xl"></i></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">{t('bill_enter_phone')}</label>
                 <input 
                   type="tel"
                   value={quickBillData.phone}
                   onChange={e => handlePhoneChange(e.target.value)}
                   className="w-full border-2 border-indigo-100 rounded-lg px-4 py-2 focus:border-indigo-500 focus:outline-none"
                   placeholder="9876543210"
                   autoFocus
                 />
               </div>
               
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                 <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{t('bill_cust_details')}</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('common_name')}</label>
                      <input 
                        className="w-full border rounded p-2 text-sm"
                        value={quickBillData.name}
                        onChange={e => setQuickBillData({...quickBillData, name: e.target.value})}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('common_email')}</label>
                      <input 
                        className="w-full border rounded p-2 text-sm"
                        value={quickBillData.email}
                        onChange={e => setQuickBillData({...quickBillData, email: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>
                 </div>
                 <p className="text-[10px] text-indigo-600 mt-2"><i className="fa-solid fa-circle-info"></i> {t('bill_new_cust_note')}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">{t('appt_service')}</label>
                   <select 
                     className="w-full border rounded-lg px-2 py-2 text-sm"
                     value={quickBillData.serviceId}
                     onChange={e => setQuickBillData({...quickBillData, serviceId: e.target.value})}
                   >
                     <option value="">{t('appt_select_service')}</option>
                     {DB.getServices().map(s => (
                       <option key={s.id} value={s.id}>{s.name} - {formatINR(s.price)}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">{t('appt_staff')}</label>
                   <select 
                     className="w-full border rounded-lg px-2 py-2 text-sm"
                     value={quickBillData.staffId}
                     onChange={e => setQuickBillData({...quickBillData, staffId: e.target.value})}
                   >
                     <option value="">{t('appt_select_staff')}</option>
                     {availableStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     {availableStaff.length === 0 && <option value="unassigned">Store / Unassigned (No staff present)</option>}
                   </select>
                 </div>
               </div>
               
               {quickBillData.serviceId && (
                 <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-indigo-800 font-bold">Total Payable (inc. Tax)</span>
                    <span className="text-xl font-bold text-indigo-700">
                      {formatINR(getServicePrice(quickBillData.serviceId) * 1.18)}
                    </span>
                 </div>
               )}

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('bill_method')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(m => (
                      <button 
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 ${
                          paymentMethod === m 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <i className={`fa-solid ${m === 'CASH' ? 'fa-money-bill' : m === 'UPI' ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
                        {m}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex gap-3 mt-4">
                  <button onClick={() => setIsQuickBillOpen(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">{t('common_cancel')}</button>
                  <button onClick={handleQuickBillSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700">
                    {t('bill_confirm_print')}
                  </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Regular Checkout Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold mb-4">{t('bill_complete_payment')}</h3>
            
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
               <div className="flex justify-between mb-2">
                 <span className="text-gray-600">{t('bill_service_cost')}</span>
                 <span className="font-bold">{formatINR(getServicePrice(selectedAppt.serviceId))}</span>
               </div>
               <div className="flex justify-between mb-2">
                 <span className="text-gray-600">{t('bill_tax')} (18%)</span>
                 <span className="font-bold">{formatINR(getServicePrice(selectedAppt.serviceId) * 0.18)}</span>
               </div>
               <div className="border-t pt-2 flex justify-between text-lg">
                 <span className="font-bold text-slate-800">{t('bill_total')}</span>
                 <span className="font-bold text-indigo-600">
                    {formatINR(getServicePrice(selectedAppt.serviceId) * 1.18)}
                 </span>
               </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('bill_method')}</label>
              <div className="grid grid-cols-3 gap-3">
                {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD].map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 ${
                      paymentMethod === m 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`fa-solid ${m === 'CASH' ? 'fa-money-bill' : m === 'UPI' ? 'fa-mobile-screen' : 'fa-credit-card'}`}></i>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === PaymentMethod.UPI && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg text-center">
                 <p className="text-xs text-orange-800 mb-2">{t('bill_scan_qr')}</p>
                 <div className="w-24 h-24 bg-white mx-auto border p-2 flex items-center justify-center">
                   <i className="fa-solid fa-qrcode text-4xl text-gray-800"></i>
                 </div>
                 <p className="text-xs font-mono mt-2">{DB.getProfile().upiId}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelectedAppt(null)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">{t('common_cancel')}</button>
              <button onClick={handleGenerateInvoice} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700">
                {t('bill_confirm_print')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Marketing Result Modal */}
      {marketingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg"><i className="fa-brands fa-whatsapp text-green-500 mr-2"></i> Marketing Assistant</h3>
               <button onClick={() => setMarketingMsg('')} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
             </div>
             <p className="text-sm text-gray-600 mb-4">Send this follow-up to the customer:</p>
             <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-sm text-gray-800 italic mb-4">
               {marketingMsg}
             </div>
             <div className="flex gap-3">
                <button 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(marketingMsg)}`, '_blank')}
                  className="w-full py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <i className="fa-brands fa-whatsapp"></i> Send via WhatsApp
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;