import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../services/db';
import { useTranslation } from '../services/i18n';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuth = DB.isAuthenticated();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (isAuth) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="font-sans text-slate-800 bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ASK Business Manager</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
              <button onClick={() => scrollToSection('about')} className="hover:text-indigo-600 transition-colors">{t('land_nav_about')}</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors">{t('land_nav_features')}</button>
              <Link to="/pricing" className="hover:text-indigo-600 transition-colors">{t('nav_pricing')}</Link>
              <button onClick={() => scrollToSection('industries')} className="hover:text-indigo-600 transition-colors">{t('land_nav_industries')}</button>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-indigo-600">{t('land_nav_login')}</Link>
              <button 
                onClick={handleGetStarted}
                className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
              >
                {t('land_get_started')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-indigo-600 p-2">
                <i className={`fa-solid ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 top-16 z-40 animate-fade-in-up">
            <div className="px-4 py-4 space-y-3 flex flex-col">
              <button onClick={() => scrollToSection('about')} className="block text-left px-3 py-2 text-slate-600 font-medium hover:bg-indigo-50 rounded-lg">{t('land_nav_about')}</button>
              <button onClick={() => scrollToSection('features')} className="block text-left px-3 py-2 text-slate-600 font-medium hover:bg-indigo-50 rounded-lg">{t('land_nav_features')}</button>
              <Link to="/pricing" className="block text-left px-3 py-2 text-slate-600 font-medium hover:bg-indigo-50 rounded-lg">{t('nav_pricing')}</Link>
              <button onClick={() => scrollToSection('industries')} className="block text-left px-3 py-2 text-slate-600 font-medium hover:bg-indigo-50 rounded-lg">{t('land_nav_industries')}</button>
              <div className="border-t border-gray-100 my-2 pt-2">
                <Link to="/auth" className="block w-full text-center px-4 py-2 text-slate-600 font-bold mb-2">{t('land_nav_login')}</Link>
                <button onClick={handleGetStarted} className="block w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg text-center shadow">{t('land_get_started')}</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 1. Hero Section */}
      <header className="relative pt-20 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-6">
            {t('land_hero_badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            {t('land_hero_title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('land_hero_desc')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button onClick={handleGetStarted} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all">
              {t('land_get_started')}
            </button>
            <button onClick={() => scrollToSection('features')} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all">
              {t('land_see_features')}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-2"><i className="fa-solid fa-shield-halved text-green-500"></i> {t('land_secure_pay')}</span>
            <span className="flex items-center gap-2"><i className="fa-solid fa-file-invoice text-blue-500"></i> {t('land_gst_ready')}</span>
            <span className="flex items-center gap-2"><i className="fa-solid fa-flag text-orange-500"></i> {t('land_made_india')}</span>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
           <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
           <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </header>

      {/* 2. About Us */}
      <section id="about" className="py-20 bg-slate-50 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('land_about_title')}</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            {t('land_about_text')}
          </p>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-indigo-700 mb-3">{t('land_mission_title')}</h3>
            <p className="text-slate-600">
              {t('land_mission_text')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Problem & Solution */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-red-500 font-bold tracking-wide uppercase text-sm">{t('land_challenge_label')}</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">{t('land_challenge_title')}</h2>
              <ul className="space-y-4">
                {[
                  t('land_challenge_1'),
                  t('land_challenge_2'),
                  t('land_challenge_3'),
                  t('land_challenge_4'),
                  t('land_challenge_5')
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 min-w-[20px] text-red-500"><i className="fa-solid fa-xmark"></i></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-indigo-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 -mr-16 -mt-16"></div>
              <span className="text-indigo-300 font-bold tracking-wide uppercase text-sm">{t('land_solution_label')}</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">{t('land_solution_title')}</h2>
              <p className="text-indigo-100 mb-6">{t('land_solution_desc')}</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                   t('nav_appointments'), t('nav_billing'), 'Payments', t('nav_customers'), t('nav_staff'), 'Reports'
                ].map(feat => (
                  <div key={feat} className="flex items-center gap-2 bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50">
                    <i className="fa-solid fa-check text-green-400"></i> <span className="text-sm font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Industries */}
      <section id="industries" className="py-20 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">{t('land_ind_title')}</h2>
            <p className="text-slate-600 mt-4">{t('land_ind_desc')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Live */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 relative">
              <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">{t('land_ind_live')}</span>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 text-2xl mb-4">
                <i className="fa-solid fa-scissors"></i>
              </div>
              <h3 className="font-bold text-lg mb-2">{t('land_ind_salon')}</h3>
              <p className="text-sm text-slate-500">{t('land_ind_salon_desc')}</p>
            </div>

            {/* Coming Soon */}
            {[
              { icon: 'fa-user-doctor', title: t('land_ind_clinic'), desc: t('land_ind_clinic_desc'), color: 'blue' },
              { icon: 'fa-school', title: t('land_ind_school'), desc: t('land_ind_school_desc'), color: 'indigo' },
              { icon: 'fa-dumbbell', title: t('land_ind_gym'), desc: t('land_ind_gym_desc'), color: 'orange' }
            ].map((industry, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative opacity-75 grayscale hover:grayscale-0 transition-all">
                 <span className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">{t('land_ind_coming')}</span>
                 <div className={`w-12 h-12 bg-${industry.color}-50 rounded-lg flex items-center justify-center text-${industry.color}-600 text-2xl mb-4`}>
                    <i className={`fa-solid ${industry.icon}`}></i>
                 </div>
                 <h3 className="font-bold text-lg mb-2">{industry.title}</h3>
                 <p className="text-sm text-slate-500">{industry.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">{t('land_feat_title')}</h2>
            <p className="text-slate-600 mt-4">{t('land_feat_desc')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: t('land_feat_appt_title'), desc: t('land_feat_appt_desc'), icon: "fa-calendar-check" },
              { title: t('land_feat_gst_title'), desc: t('land_feat_gst_desc'), icon: "fa-file-invoice-dollar" },
              { title: t('land_feat_pay_title'), desc: t('land_feat_pay_desc'), icon: "fa-credit-card" },
              { title: t('land_feat_cust_title'), desc: t('land_feat_cust_desc'), icon: "fa-users" },
              { title: t('land_feat_staff_title'), desc: t('land_feat_staff_desc'), icon: "fa-id-badge" },
              { title: t('land_feat_inv_title'), desc: t('land_feat_inv_desc'), icon: "fa-boxes-stacked" }
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center text-xl">
                  <i className={`fa-solid ${f.icon}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Razorpay / Security */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
               <h2 className="text-3xl font-bold mb-6">{t('land_trust_title')}</h2>
               <p className="text-slate-300 mb-8 leading-relaxed">
                 {t('land_trust_text')}
               </p>
               <div className="space-y-6">
                 <div className="flex gap-4">
                   <div className="mt-1"><i className="fa-solid fa-lock text-green-400 text-xl"></i></div>
                   <div>
                     <h4 className="font-bold text-lg">{t('land_trust_pay_title')}</h4>
                     <p className="text-slate-400 text-sm">{t('land_trust_pay_desc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="mt-1"><i className="fa-solid fa-database text-blue-400 text-xl"></i></div>
                   <div>
                     <h4 className="font-bold text-lg">{t('land_trust_data_title')}</h4>
                     <p className="text-slate-400 text-sm">{t('land_trust_data_desc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="mt-1"><i className="fa-solid fa-file-contract text-orange-400 text-xl"></i></div>
                   <div>
                     <h4 className="font-bold text-lg">{t('land_trust_comp_title')}</h4>
                     <p className="text-slate-400 text-sm">{t('land_trust_comp_desc')}</p>
                   </div>
                 </div>
               </div>
            </div>
            <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl">
               <div className="text-center mb-6">
                 <p className="text-sm font-bold text-slate-500 uppercase">Trusted Partner</p>
                 <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-10 mx-auto mt-2" />
               </div>
               <div className="border-t border-gray-100 pt-6">
                 <div className="flex justify-between items-center mb-4 text-sm">
                   <span>Encryption</span>
                   <span className="font-bold text-green-600"><i className="fa-solid fa-check-circle"></i> 256-bit SSL</span>
                 </div>
                 <div className="flex justify-between items-center mb-4 text-sm">
                   <span>Fraud Protection</span>
                   <span className="font-bold text-green-600"><i className="fa-solid fa-check-circle"></i> Active</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span>Uptime</span>
                   <span className="font-bold text-green-600"><i className="fa-solid fa-check-circle"></i> 99.9%</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
               <h3 className="text-white text-lg font-bold mb-4">A.S.K. Multinational Company</h3>
               <p className="text-sm leading-relaxed mb-6 max-w-sm">
                 {t('land_footer_desc')}
               </p>
               <div className="space-y-2 text-sm">
                 <div className="flex items-center gap-2"><i className="fa-solid fa-envelope text-indigo-400"></i> askmultinationalcompany@gmail.com</div>
                 <div className="flex items-center gap-2"><i className="fa-solid fa-phone text-indigo-400"></i> +91 7249074350</div>
               </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white">{t('land_nav_about')}</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">{t('land_nav_features')}</button></li>
                <li><Link to="/pricing" className="hover:text-white">{t('nav_pricing')}</Link></li>
                <li><Link to="/auth" className="hover:text-white">{t('land_nav_login')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/legal/privacy" className="hover:text-white">{t('legal_privacy')}</Link></li>
                <li><Link to="/legal/terms" className="hover:text-white">{t('legal_terms')}</Link></li>
                <li><Link to="/legal/refund" className="hover:text-white">{t('legal_refund')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} A.S.K. Multinational Company. {t('land_footer_rights')}</p>
            <p className="mt-2">{t('land_footer_made')} <i className="fa-solid fa-heart text-red-500"></i> in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;