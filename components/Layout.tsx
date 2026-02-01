import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DB } from '../services/db';
import { BusinessType } from '../types';
import { useTranslation, SUPPORTED_LANGUAGES } from '../services/i18n';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profile = DB.getProfile();
  const isAuth = DB.isAuthenticated();
  const isAdmin = DB.isAdmin();
  const { t, language, changeLanguage } = useTranslation();

  // Logic Update: Legal pages are only "Public Layout" if the user is NOT logged in.
  // If logged in, they show up inside the Dashboard sidebar.
  const isPublicPage = 
    location.pathname === '/' || 
    location.pathname === '/auth' || 
    location.pathname === '/pricing' ||
    (location.pathname.startsWith('/legal') && !isAuth);

  useEffect(() => {
    // If not authenticated and trying to access a protected route, go to Auth
    if (!isAuth && !isPublicPage) {
      navigate('/auth');
    }
    // If Admin tries to go to user dashboard, redirect to admin dash
    if (isAuth && isAdmin && location.pathname === '/dashboard') {
        navigate('/admin');
    }
  }, [isAuth, isAdmin, location.pathname, navigate, isPublicPage]);

  const handleLogout = () => {
    DB.logout();
    navigate('/');
  };

  // If it's a public page, just render children without the dashboard shell
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Dynamic Navigation based on Role
  const getNavItems = () => {
    if (isAdmin) {
        return [
            { name: "Admin Overview", path: '/admin', icon: 'fa-user-shield' },
            { name: "Global Settings", path: '/settings', icon: 'fa-cog' }
        ];
    }

    const baseItems = [
      { name: t('nav_dashboard'), path: '/dashboard', icon: 'fa-chart-line' },
    ];

    if (profile.type === BusinessType.SALON) {
      return [
        ...baseItems,
        { name: t('nav_appointments'), path: '/appointments', icon: 'fa-calendar-alt' },
        { name: "AI Consultant", path: '/ai-consult', icon: 'fa-wand-magic-sparkles' },
        { name: t('nav_billing'), path: '/billing', icon: 'fa-cash-register' },
        { name: t('nav_services'), path: '/services', icon: 'fa-scissors' },
        { name: t('nav_customers'), path: '/customers', icon: 'fa-user-group' },
        { name: t('nav_staff'), path: '/staff', icon: 'fa-id-badge' },
        { name: t('nav_inventory'), path: '/inventory', icon: 'fa-boxes-stacked' },
        { name: "Management", path: '/management', icon: 'fa-list-check' },
        { name: t('nav_settings'), path: '/settings', icon: 'fa-cog' },
      ];
    }
    
    return [ ...baseItems, { name: t('nav_settings'), path: '/settings', icon: 'fa-cog' }];
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col w-64 ${isAdmin ? 'bg-slate-900' : 'bg-slate-900'} text-white shadow-xl transition-all duration-300 h-full`}>
        <div className="p-6 border-b border-slate-700 bg-slate-950 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
             <div className={`w-8 h-8 ${isAdmin ? 'bg-red-600' : 'bg-indigo-500'} rounded flex items-center justify-center text-white font-bold`}>
               {isAdmin ? 'A' : profile.name.charAt(0)}
             </div>
             <h1 className="text-xl font-bold truncate">{isAdmin ? 'Super Admin' : profile.name}</h1>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {isAdmin ? 'System Control' : `${profile.type} Module`}
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white shadow-lg translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
          
          {/* Legal Links in Sidebar for logged in users */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Legal & Support</p>
            <Link to="/legal/privacy" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-sm">
               <i className="fa-solid fa-shield-halved w-5 text-center"></i> Privacy
            </Link>
            <Link to="/legal/terms" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-sm">
               <i className="fa-solid fa-file-contract w-5 text-center"></i> Terms
            </Link>
          </div>
        </nav>
        
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 flex-shrink-0">
          <div className="relative">
            <i className="fa-solid fa-language absolute left-3 top-2.5 text-slate-400 text-sm"></i>
            <select 
              value={language} 
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="w-full bg-slate-800 text-slate-200 text-xs py-2 pl-9 pr-2 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-white w-full px-4 py-2 hover:bg-slate-800 rounded transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="text-sm">{t('nav_signout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
           <aside className="w-64 h-full bg-slate-900 text-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-6 border-b border-slate-700 flex-shrink-0">
                <span className="text-xl font-bold">{isAdmin ? 'Super Admin' : profile.name}</span>
             </div>
             <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isActive(item.path) ? 'bg-indigo-600' : 'text-slate-300'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5`}></i>
                    {item.name}
                  </Link>
                ))}
             </nav>
             <div className="p-4 border-t border-slate-800 flex-shrink-0">
               <button onClick={handleLogout} className="text-slate-400 text-sm flex items-center gap-2">
                 <i className="fa-solid fa-right-from-bracket"></i> {t('nav_signout')}
               </button>
             </div>
           </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 mr-2">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 className="text-lg font-bold text-slate-800">{isAdmin ? 'Admin Panel' : profile.name}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;