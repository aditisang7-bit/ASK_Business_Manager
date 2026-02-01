import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/i18n';

type BillingCycle = 'monthly' | 'yearly';

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  const plans = [
    {
      id: 'free',
      name: 'Free Forever',
      description: 'Perfect for freelancers & small home setups.',
      prices: { monthly: 0, yearly: 0 },
      features: [
        '50 Appointments per month',
        '1 Staff Login',
        'Basic Booking System',
        'Limited Reports'
      ],
      highlight: false,
      badge: null
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For growing salons requiring automation.',
      prices: { monthly: 999, yearly: 9999 },
      features: [
        'Unlimited Appointments',
        '3 Staff Logins',
        'GST Invoicing & Billing',
        'Basic AI Business Insights',
        'Email Support'
      ],
      highlight: true,
      badge: 'Best Value'
    },
    {
      id: 'pro',
      name: 'Pro Business',
      description: 'Full-scale management for busy salons.',
      prices: { monthly: 2499, yearly: 24999 },
      features: [
        'Unlimited Everything',
        'Unlimited Staff',
        'Inventory & Stock Management',
        'Staff Commission Calculator',
        'Advanced AI Consultant (Face Analysis)',
        'Priority Phone Support'
      ],
      highlight: false,
      badge: 'Power User'
    }
  ];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ASK Business Manager</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600"><i className="fa-solid fa-arrow-left mr-1"></i> {t('auth_back_home')}</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-slate-50 py-16 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          {t('price_title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          {t('price_subtitle')}
        </p>

        {/* Cycle Toggle */}
        <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-4">
           <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
           >
             Monthly
           </button>
           <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
           >
             Yearly <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1 rounded">-20%</span>
           </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10">
        <div className="grid md:grid-cols-3 gap-8">
           {plans.map((plan) => (
             <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 flex flex-col ${
                  plan.highlight 
                  ? 'border-indigo-600 shadow-2xl scale-105 z-10 ring-4 ring-indigo-50' 
                  : 'border-gray-200 shadow-lg hover:border-indigo-200 hover:shadow-xl'
                }`}
             >
               {plan.badge && (
                 <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                   <i className="fa-solid fa-star mr-1"></i> {plan.badge}
                 </div>
               )}

               <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
               <p className="text-sm text-slate-500 mb-6 h-10">{plan.description}</p>
               
               <div className="mb-8">
                 <span className="text-4xl font-extrabold text-slate-900">{formatPrice(plan.prices[billingCycle])}</span>
                 <span className="text-slate-400 font-medium text-sm ml-2">
                    / {billingCycle === 'monthly' ? 'mo' : 'yr'}
                 </span>
               </div>

               <Link 
                 to="/auth"
                 className={`block w-full text-center py-3 rounded-xl font-bold transition-colors mb-8 ${
                   plan.highlight 
                   ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' 
                   : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                 }`}
               >
                 {plan.id === 'free' ? 'Get Started Free' : 'Start Free Trial'}
               </Link>

               <div className="space-y-4 flex-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">What's Included</p>
                 {plan.features.map((feat, i) => (
                   <div key={i} className="flex items-start gap-3">
                     <i className="fa-solid fa-check text-green-500 mt-1 flex-shrink-0"></i>
                     <span className="text-sm text-slate-600">{feat}</span>
                   </div>
                 ))}
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-50 py-20 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold text-slate-900 mb-8">{t('price_cta_title')}</h2>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all">
                {t('price_start_now')}
              </Link>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-8 text-center text-slate-400 text-sm">
         <p>&copy; {new Date().getFullYear()} A.S.K. Multinational Company.</p>
      </div>

    </div>
  );
};

export default Pricing;