import React, { useState } from 'react';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

type BillingCycle = 'monthly' | '3month' | '6month' | 'yearly';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState(DB.getProfile());
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleSave = () => {
    DB.saveProfile(profile);
    showToast(t('common_saved'), "success");
  };

  const handleSubscribe = (tier: string, amount: number) => {
    const confirm = window.confirm(`Proceed to Razorpay to pay ₹${amount} for ${tier} (${billingCycle}) plan?`);
    if (confirm) {
      // Cast billingCycle to the union type expected by profile if needed, or update profile type definition
      // For now, assuming profile.subscriptionPlan allows string or matches this logic
      const updated = { ...profile, isSubscribed: true, subscriptionPlan: billingCycle as any };
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

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const plans = {
    starter: { monthly: 3999, '3month': 10999, '6month': 20999, yearly: 39999 },
    growth: { monthly: 7999, '3month': 21999, '6month': 41999, yearly: 79999 },
    premium: { monthly: 14999, '3month': 42999, '6month': 84999, yearly: 149999 }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
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
          <>
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
               <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                 {(['monthly', '3month', '6month', 'yearly'] as BillingCycle[]).map(c => (
                   <button
                     key={c}
                     onClick={() => setBillingCycle(c)}
                     className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                        billingCycle === c ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     {c === 'monthly' ? 'Monthly' : c === '3month' ? '3 Months' : c === '6month' ? '6 Months' : 'Yearly'}
                   </button>
                 ))}
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors bg-white flex flex-col">
                <h4 className="text-lg font-bold text-slate-800">Starter</h4>
                <p className="text-3xl font-bold mt-2 text-slate-800">{formatPrice(plans.starter[billingCycle])}</p>
                <p className="text-xs text-gray-500 mb-6 font-medium">/ {billingCycle === 'monthly' ? 'mo' : 'term'}</p>
                <p className="text-sm text-gray-500 mb-4">Best for small businesses.</p>
                <ul className="space-y-2 text-xs text-gray-600 mb-6 flex-1">
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Basic Website</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Booking System</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Basic AI Chatbot</li>
                </ul>
                <button onClick={() => handleSubscribe('Starter', plans.starter[billingCycle])} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 text-sm">
                  Choose Starter
                </button>
              </div>

              {/* Growth Plan */}
              <div className="border border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-all relative bg-white ring-2 ring-indigo-50 flex flex-col">
                <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">POPULAR</div>
                <h4 className="text-lg font-bold text-indigo-900">Growth</h4>
                <p className="text-3xl font-bold mt-2 text-indigo-900">{formatPrice(plans.growth[billingCycle])}</p>
                <p className="text-xs text-gray-500 mb-6 font-medium">/ {billingCycle === 'monthly' ? 'mo' : 'term'}</p>
                <p className="text-sm text-gray-500 mb-4">Scale fast with automation.</p>
                <ul className="space-y-2 text-xs text-gray-600 mb-6 flex-1">
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Website + App (MVP)</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> AI Calling Agent</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> WhatsApp Auto</li>
                </ul>
                <button onClick={() => handleSubscribe('Growth', plans.growth[billingCycle])} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                  Choose Growth
                </button>
              </div>

              {/* Premium Plan */}
              <div className="border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all relative bg-gradient-to-b from-white to-purple-50 flex flex-col">
                <h4 className="text-lg font-bold text-purple-900">Premium</h4>
                <p className="text-3xl font-bold mt-2 text-purple-900">{formatPrice(plans.premium[billingCycle])}</p>
                <p className="text-xs text-gray-500 mb-6 font-medium">/ {billingCycle === 'monthly' ? 'mo' : 'term'}</p>
                <p className="text-sm text-gray-500 mb-4">Dominate your niche.</p>
                <ul className="space-y-2 text-xs text-gray-600 mb-6 flex-1">
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Custom AI Website</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Adv. Calling Agent</li>
                  <li className="flex gap-2 items-center"><i className="fa-solid fa-check text-green-500"></i> Priority Support</li>
                </ul>
                <button onClick={() => handleSubscribe('Premium', plans.premium[billingCycle])} className="w-full py-2 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200 text-sm">
                  Choose Premium
                </button>
              </div>
            </div>
          </>
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