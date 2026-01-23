import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/i18n';

type BillingCycle = 'monthly' | '3month' | '6month' | 'yearly';

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Best for small businesses & startups',
      prices: {
        monthly: 3999,
        '3month': 10999,
        '6month': 20999,
        yearly: 39999
      },
      features: [
        'AI-powered website or landing page',
        'Booking or inquiry system',
        'Basic AI chatbot',
        'Payment gateway integration',
        'Maintenance & support'
      ],
      highlight: false,
      badge: 'Best Value (6 mo)'
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'Everything you need to scale fast.',
      prices: {
        monthly: 7999,
        '3month': 21999,
        '6month': 41999,
        yearly: 79999
      },
      features: [
        'Website + App (MVP)',
        'Booking & slot system',
        'AI chatbot + basic calling agent',
        'WhatsApp & email automation',
        'Payment gateway',
        'Basic SEO',
        'Monthly optimization & support'
      ],
      highlight: true,
      badge: 'Most Popular'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For serious businesses dominating their niche.',
      prices: {
        monthly: 14999,
        '3month': 42999,
        '6month': 84999,
        yearly: 149999
      },
      features: [
        'Custom AI website & app',
        'Advanced AI calling agent',
        'CRM & lead tracking',
        'Advanced automation',
        'Priority support',
        'Strategy & growth assistance'
      ],
      highlight: false,
      badge: 'Premium'
    }
  ];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getSavingsNote = () => {
     if (billingCycle === 'monthly') return "Switch to Yearly to save ~16%";
     if (billingCycle === 'yearly') return "You are saving the most!";
     return "Excellent choice!";
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
        <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
           {(['monthly', '3month', '6month', 'yearly'] as BillingCycle[]).map((cycle) => (
             <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  billingCycle === cycle 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
             >
               {cycle === 'monthly' ? t('price_cycle_1') : 
                cycle === '3month' ? t('price_cycle_3') :
                cycle === '6month' ? t('price_cycle_6') : t('price_cycle_12')}
             </button>
           ))}
        </div>
        
        {billingCycle !== 'monthly' && (
           <p className="text-green-600 font-bold text-sm animate-bounce mb-4">
             <i className="fa-solid fa-tags mr-1"></i> {t('price_save_note')}
           </p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10">
        <div className="grid md:grid-cols-3 gap-8">
           {plans.map((plan) => (
             <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlight 
                  ? 'border-indigo-600 shadow-2xl scale-105 z-10 ring-4 ring-indigo-50' 
                  : 'border-gray-200 shadow-lg hover:border-indigo-200 hover:shadow-xl'
                }`}
             >
               {plan.highlight && (
                 <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                   <i className="fa-solid fa-star mr-1"></i> {t('price_popular')}
                 </div>
               )}
               {/* 6 Month Badge Logic for Starter/Growth if selected */}
               {!plan.highlight && billingCycle === '6month' && plan.id === 'starter' && (
                 <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                   {t('price_best_value')}
                 </div>
               )}

               <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
               <p className="text-sm text-slate-500 mb-6 h-10">{plan.description}</p>
               
               <div className="mb-8">
                 <span className="text-4xl font-extrabold text-slate-900">{formatPrice(plan.prices[billingCycle])}</span>
                 <span className="text-slate-400 font-medium text-sm ml-2">/ {billingCycle === 'monthly' ? 'mo' : 'period'}</span>
               </div>

               <Link 
                 to="/auth"
                 className={`block w-full text-center py-3 rounded-xl font-bold transition-colors mb-8 ${
                   plan.highlight 
                   ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' 
                   : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                 }`}
               >
                 {plan.highlight ? t('price_start_now') : t('price_contact_sales')}
               </Link>

               <div className="space-y-4">
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

      {/* Comparison Note */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-20">
        <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="text-left">
             <h3 className="text-xl font-bold mb-2">Long-term plans save up to 25%</h3>
             <p className="text-indigo-200">Most businesses choose 6-month or yearly plans for better results and ROI.</p>
           </div>
           <button onClick={() => setBillingCycle('yearly')} className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap">
             View Yearly Pricing
           </button>
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
              <button onClick={() => window.open('mailto:askmultinationalcompany@gmail.com')} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all">
                {t('price_contact_sales')}
              </button>
           </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
           {[
             { q: "Can I upgrade my plan later?", a: "Yes, you can upgrade your plan at any time. The remaining balance of your current plan will be adjusted." },
             { q: "Is customer support included?", a: "Absolutely! All plans come with support. The Growth and Premium plans include priority and dedicated support." },
             { q: "Do you offer refunds?", a: "We offer refunds for subscription cancellations if requested within 48 hours of the payment." },
             { q: "Is payment secure?", a: "Yes, we use Razorpay, a PCI-DSS compliant payment gateway, to handle all transactions securely." }
           ].map((faq, i) => (
             <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h4 className="font-bold text-slate-800 mb-2">{faq.q}</h4>
               <p className="text-slate-600 text-sm">{faq.a}</p>
             </div>
           ))}
        </div>
      </div>
      
      {/* Simple Footer */}
      <div className="border-t border-gray-100 py-8 text-center text-slate-400 text-sm">
         <p>&copy; {new Date().getFullYear()} A.S.K. Multinational Company.</p>
      </div>

    </div>
  );
};

export default Pricing;