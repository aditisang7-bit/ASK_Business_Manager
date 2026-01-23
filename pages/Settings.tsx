import React, { useState } from 'react';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState(DB.getProfile());
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleSave = () => {
    DB.saveProfile(profile);
    showToast(t('common_saved'), "success");
  };

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    const amount = plan === 'monthly' ? 999 : 9999;
    const confirm = window.confirm(`Proceed to Razorpay to pay ₹${amount} for ${plan} plan?`);
    if (confirm) {
      const updated = { ...profile, isSubscribed: true, subscriptionPlan: plan };
      setProfile(updated);
      DB.saveProfile(updated);
      showToast("Payment Successful! Plan Upgraded.", "success");
    }
  };

  const toggleNotify = (key: keyof typeof profile.notificationSettings) => {
    setProfile({
      ...profile,
      notificationSettings: {
        ...profile.notificationSettings,
        [key]: !profile.notificationSettings[key]
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">{t('set_title')}</h2>

      {/* Subscription / Pricing Plans */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <i className="fa-solid fa-crown text-amber-500"></i> {t('set_plan_title')}
        </h3>
        
        {profile.isSubscribed ? (
           <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
               <h4 className="text-xl font-bold text-green-800 text-capitalize">{profile.subscriptionPlan} Plan Active</h4>
               <p className="text-green-700 text-sm mt-1">{t('set_next_bill')}: Dec 31, 2024</p>
               <span className="inline-block mt-2 bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded">{t('set_paid')}</span>
             </div>
             <button onClick={() => {
                if(window.confirm("Cancel subscription?")) {
                   const updated = {...profile, isSubscribed: false, subscriptionPlan: 'trial' as any};
                   setProfile(updated);
                   DB.saveProfile(updated);
                }
             }} className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm">
               Manage / Cancel
             </button>
           </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors bg-gray-50/50">
               <h4 className="text-lg font-bold text-slate-800">Freelancer</h4>
               <p className="text-3xl font-bold mt-2">₹0</p>
               <p className="text-sm text-gray-500 mb-6">Forever free for small setups.</p>
               <ul className="space-y-3 text-sm text-gray-600 mb-6">
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Max 50 Appts/mo</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Basic Invoicing</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> 1 Staff Member</li>
                 <li className="flex gap-2 items-center text-gray-400"><i className="fa-solid fa-xmark"></i> No AI Features</li>
               </ul>
               <button className="w-full py-2 bg-gray-200 text-gray-600 font-bold rounded-lg cursor-not-allowed">Current Plan</button>
            </div>

            {/* Monthly Plan */}
            <div className="border border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-all relative bg-white">
               <h4 className="text-lg font-bold text-indigo-900">Growth (Monthly)</h4>
               <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-slate-900">₹999</p>
                  <span className="text-gray-500 text-sm ml-1">/ month</span>
               </div>
               <p className="text-sm text-gray-500 mb-6">Perfect for growing salons.</p>
               <ul className="space-y-3 text-sm text-gray-600 mb-6">
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Unlimited Appts</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Up to 5 Staff</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> WhatsApp Reminders</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> AI Consultant (10/mo)</li>
               </ul>
               <button onClick={() => handleSubscribe('monthly')} className="w-full py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200">
                 Subscribe Monthly
               </button>
            </div>

            {/* Yearly Plan */}
            <div className="border-2 border-indigo-600 rounded-xl p-6 relative overflow-hidden bg-gradient-to-b from-white to-indigo-50 transform hover:-translate-y-1 transition-transform">
               <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">BEST VALUE</div>
               <h4 className="text-lg font-bold text-indigo-900">Enterprise (Yearly)</h4>
               <div className="flex items-baseline mt-2">
                  <p className="text-3xl font-bold text-slate-900">₹9,999</p>
                  <span className="text-gray-500 text-sm ml-1">/ year</span>
               </div>
               <p className="text-sm text-gray-500 mb-6">Full power for serious business.</p>
               <ul className="space-y-3 text-sm text-gray-600 mb-6">
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> <b>Unlimited Everything</b></li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Priority Support</li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> <b>Unlimited AI Analysis</b></li>
                 <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Multi-branch ready</li>
               </ul>
               <button onClick={() => handleSubscribe('yearly')} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">
                 Upgrade Yearly
               </button>
            </div>
          </div>
        )}
      </section>

      {/* Business Profile */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-store text-indigo-500"></i> {t('set_profile')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_salon_name')}</label>
            <input 
              className="w-full border rounded-lg p-2"
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_phone')}</label>
            <input 
              className="w-full border rounded-lg p-2"
              value={profile.phone} 
              onChange={e => setProfile({...profile, phone: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_address')}</label>
            <input 
              className="w-full border rounded-lg p-2"
              value={profile.address} 
              onChange={e => setProfile({...profile, address: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_upi')}</label>
            <input 
              className="w-full border rounded-lg p-2 bg-slate-50 font-mono"
              value={profile.upiId} 
              onChange={e => setProfile({...profile, upiId: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_gst')}</label>
            <input 
              className="w-full border rounded-lg p-2"
              value={profile.gstIn || ''} 
              onChange={e => setProfile({...profile, gstIn: e.target.value})}
              placeholder="GSTIN12345"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('set_terms')}</label>
            <textarea 
              className="w-full border rounded-lg p-2 text-sm h-20"
              value={profile.invoiceTerms || ''} 
              onChange={e => setProfile({...profile, invoiceTerms: e.target.value})}
              placeholder="Thank you for visiting..."
            />
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-bell text-indigo-500"></i> {t('set_notifications')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
             <input type="checkbox" checked={profile.notificationSettings.emailAppt} onChange={() => toggleNotify('emailAppt')} className="h-5 w-5 text-indigo-600 rounded" />
             <span className="text-sm font-medium text-gray-700">{t('set_notify_email_appt')}</span>
           </label>
           <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
             <input type="checkbox" checked={profile.notificationSettings.whatsappAppt} onChange={() => toggleNotify('whatsappAppt')} className="h-5 w-5 text-indigo-600 rounded" />
             <span className="text-sm font-medium text-gray-700">{t('set_notify_wa_appt')}</span>
           </label>
           <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
             <input type="checkbox" checked={profile.notificationSettings.emailPayment} onChange={() => toggleNotify('emailPayment')} className="h-5 w-5 text-indigo-600 rounded" />
             <span className="text-sm font-medium text-gray-700">{t('set_notify_email_pay')}</span>
           </label>
           <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
             <input type="checkbox" checked={profile.notificationSettings.whatsappPayment} onChange={() => toggleNotify('whatsappPayment')} className="h-5 w-5 text-indigo-600 rounded" />
             <span className="text-sm font-medium text-gray-700">{t('set_notify_wa_pay')}</span>
           </label>
        </div>
      </section>

      <div className="flex justify-end">
         <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors font-bold shadow-lg">
            {t('common_save')}
          </button>
      </div>
    </div>
  );
};

export default Settings;