import React, { useState } from 'react';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

type SettingsTab = 'plans' | 'profile' | 'notifications';
type BillingCycle = 'monthly' | 'yearly';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('plans');
  const [profile, setProfile] = useState(DB.getProfile());
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleSaveProfile = () => {
    DB.saveProfile(profile);
    showToast(t('common_saved'), "success");
  };

  const handleSubscribe = (planName: string, amount: number) => {
    if (amount === 0) {
        const updated = { ...profile, isSubscribed: false, subscriptionPlan: 'free' as any };
        setProfile(updated);
        DB.saveProfile(updated);
        showToast("Switched to Free Plan.", "success");
        return;
    }

    const confirm = window.confirm(`Upgrade to ${planName} Plan for ₹${amount}/${billingCycle === 'monthly' ? 'mo' : 'yr'}? \n\nSecure Payment via Razorpay.`);
    if (confirm) {
      const updated = { ...profile, isSubscribed: true, subscriptionPlan: planName.toLowerCase() as any };
      setProfile(updated);
      DB.saveProfile(updated);
      showToast(`Successfully upgraded to ${planName}!`, "success");
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

  // Competitive Indian Market Pricing
  const PLANS = [
    {
      id: 'free',
      name: 'Free Forever',
      price: { monthly: 0, yearly: 0 },
      features: ['50 Appointments/mo', '1 Staff Member', 'Basic Reports', 'Manual Reminders'],
      color: 'gray',
      recommended: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: { monthly: 999, yearly: 9999 },
      features: ['Unlimited Appointments', '3 Staff Members', 'WhatsApp Reminders', 'GST Invoicing', 'Basic AI Insights'],
      color: 'blue',
      recommended: true
    },
    {
      id: 'pro',
      name: 'Pro Business',
      price: { monthly: 2499, yearly: 24999 },
      features: ['Unlimited Everything', 'Advanced AI Consultant', 'Inventory Tracking', 'Staff Commission Calc', 'Priority Support'],
      color: 'purple',
      recommended: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('set_title')}</h2>
      <p className="text-slate-500 mb-8">Manage your subscription, business details, and preferences.</p>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <i className="fa-solid fa-crown w-5 text-center"></i> Plans & Billing
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <i className="fa-solid fa-store w-5 text-center"></i> Business Profile
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <i className="fa-solid fa-bell w-5 text-center"></i> Notifications
          </button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1">
          
          {/* --- PLANS TAB --- */}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-fade-in">
              {/* Current Status Card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Active Plan</p>
                  <h3 className="text-2xl font-bold capitalize">{profile.subscriptionPlan || 'Free Trial'}</h3>
                  <p className="text-sm text-slate-300 mt-2">
                    {profile.isSubscribed 
                      ? 'Next billing date: Dec 31, 2024' 
                      : 'You are on a limited free tier.'}
                  </p>
                </div>
                {profile.isSubscribed && (
                   <div className="relative z-10 bg-green-500/20 border border-green-500/50 text-green-300 px-3 py-1 rounded text-xs font-bold">
                     ACTIVE
                   </div>
                )}
                <div className="absolute right-0 top-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
              </div>

              {/* Toggle & Plans */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex justify-center mb-8">
                  <div className="bg-slate-100 p-1 rounded-xl inline-flex relative">
                    <button 
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2 text-sm font-bold rounded-lg transition-all z-10 ${billingCycle === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-2 text-sm font-bold rounded-lg transition-all z-10 ${billingCycle === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Yearly <span className="text-[10px] text-green-600 ml-1 bg-green-100 px-1 rounded">-20%</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map(plan => {
                    const price = plan.price[billingCycle];
                    const isCurrent = (profile.subscriptionPlan || 'free') === plan.id;
                    
                    return (
                      <div 
                        key={plan.id} 
                        className={`relative rounded-2xl p-6 border-2 transition-all flex flex-col ${
                          isCurrent ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100' : 
                          plan.recommended ? 'border-purple-200 bg-white shadow-xl scale-105 z-10' : 
                          'border-slate-100 bg-white hover:border-indigo-100 hover:shadow-lg'
                        }`}
                      >
                        {plan.recommended && (
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                            Best Value
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <h4 className={`text-lg font-bold ${plan.id === 'pro' ? 'text-purple-700' : 'text-slate-800'}`}>{plan.name}</h4>
                          <div className="mt-2 flex items-baseline">
                             <span className="text-3xl font-extrabold text-slate-900">{formatPrice(price)}</span>
                             <span className="text-slate-500 text-sm ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                              <i className={`fa-solid fa-check mt-1 ${plan.id === 'free' ? 'text-slate-400' : 'text-green-500'}`}></i>
                              {feat}
                            </li>
                          ))}
                        </ul>

                        <button 
                          onClick={() => handleSubscribe(plan.name, price)}
                          disabled={isCurrent}
                          className={`w-full py-3 rounded-xl font-bold transition-colors ${
                            isCurrent ? 'bg-green-100 text-green-700 cursor-default' :
                            plan.id === 'pro' ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg' :
                            plan.id === 'starter' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' :
                            'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <i className="fa-solid fa-store text-indigo-600"></i> Business Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Salon / Business Name</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Owner Phone</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Address</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={profile.address} 
                    onChange={e => setProfile({...profile, address: e.target.value})}
                    placeholder="Shop No, Street, City, State, Pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">UPI ID <span className="text-xs font-normal text-gray-500">(For QR Codes)</span></label>
                  <div className="relative">
                    <i className="fa-brands fa-google-pay absolute left-3 top-2.5 text-gray-400 text-lg"></i>
                    <input 
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                      value={profile.upiId} 
                      onChange={e => setProfile({...profile, upiId: e.target.value})}
                      placeholder="business@upi"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">GSTIN <span className="text-xs font-normal text-gray-500">(Optional)</span></label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                    value={profile.gstIn || ''} 
                    onChange={e => setProfile({...profile, gstIn: e.target.value})}
                    placeholder="27ABCDE1234F1Z5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Invoice Terms / Footer</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={profile.invoiceTerms || ''} 
                    onChange={e => setProfile({...profile, invoiceTerms: e.target.value})}
                    placeholder="e.g. Thank you for visiting. No refunds on services."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={handleSaveProfile} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === 'notifications' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
               <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <i className="fa-solid fa-bell text-indigo-600"></i> Alert Preferences
               </h3>

               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                       <p className="font-bold text-slate-800">Email: Appointment Confirmations</p>
                       <p className="text-xs text-gray-500">Receive emails when appointments are booked or cancelled.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile.notificationSettings.emailAppt} onChange={() => toggleNotify('emailAppt')} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                       <p className="font-bold text-slate-800">WhatsApp: Appointment Alerts</p>
                       <p className="text-xs text-gray-500">Receive WhatsApp messages for bookings (Requires Starter Plan).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile.notificationSettings.whatsappAppt} onChange={() => toggleNotify('whatsappAppt')} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                       <p className="font-bold text-slate-800">Email: Payment Receipts</p>
                       <p className="text-xs text-gray-500">Get a copy of every invoice generated.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile.notificationSettings.emailPayment} onChange={() => toggleNotify('emailPayment')} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
               </div>
               
               <div className="mt-8 flex justify-end">
                <button onClick={handleSaveProfile} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg">
                  Save Preferences
                </button>
              </div>
             </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Settings;