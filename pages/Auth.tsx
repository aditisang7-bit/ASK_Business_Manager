import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DB } from '../services/db';
import { BusinessProfile, BusinessType } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Login State
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 

  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    type: BusinessType.SALON,
    password: '' // Password field added
  });

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      
      // --- SUPER ADMIN SECURITY CHECK ---
      if (email.trim().toLowerCase() === 'askmultinationalcompany@gmail.com') {
         if (password === 'Admin@123') { // STRICT PASSWORD CHECK
             DB.login(email);
             showToast("Welcome, Super Admin! Access Granted.", "success");
             navigate('/admin');
         } else {
             showToast("Security Alert: Invalid Admin Password.", "error");
             return;
         }
      } 
      // --- REGULAR BUSINESS CLIENT LOGIN ---
      else {
          // In a real app, verify password against DB here.
          // For MVP, we simulate successful login for business owners.
          DB.login(email);
          showToast("Login Successful! Loading Dashboard...", "success");
          navigate('/dashboard');
      }
    }
  };

  const handleGuestLogin = () => {
    DB.loginAsGuest();
    showToast("Welcome Guest! Entering Demo Mode...", "info");
    navigate('/dashboard');
  };

  // Step 1: Initiate Registration - Send OTP
  const initiateRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.password || regData.password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }
    
    // Simulate OTP Generation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsVerifying(true);
    
    // Simulate sending OTP (In prod this would be an API call)
    console.log(`[DEMO] Verification Code: ${code}`);
    setTimeout(() => {
        alert(`DEMO: Your verification code is ${code}`);
    }, 1000);
    showToast(`Verification code sent to ${regData.email} and ${regData.phone}`, "info");
  };

  // Step 2: Verify OTP and Create Account
  const verifyAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== generatedOtp) {
        showToast("Invalid Verification Code. Please try again.", "error");
        return;
    }

    const newProfile: BusinessProfile = {
      id: `biz_${Date.now()}`,
      name: regData.name,
      type: regData.type,
      address: '',
      phone: regData.phone,
      email: regData.email,
      upiId: '',
      isSubscribed: false,
      subscriptionPlan: 'trial',
      approved: false, 
      notificationSettings: {
        emailAppt: true,
        whatsappAppt: false,
        emailPayment: true,
        whatsappPayment: false
      }
    };
    DB.register(newProfile);
    showToast("Account Verified & Created Successfully!", "success");
    navigate('/dashboard');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    // Simulate API call
    setTimeout(() => {
        setIsResetting(false);
        if (forgotEmail === 'askmultinationalcompany@gmail.com') {
            showToast("Admin Recovery: Contact System Developer.", "info");
        } else {
            showToast("Password reset link sent to your email.", "success");
        }
        setShowForgot(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Forgot Password Modal */}
      {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                  <h3 className="text-xl font-bold mb-2">Recover Account</h3>
                  <p className="text-sm text-gray-500 mb-4">Enter your registered email to receive a password reset link.</p>
                  <form onSubmit={handleForgotPassword}>
                      <input 
                        type="email" 
                        required 
                        className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                      />
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setShowForgot(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                          <button type="submit" disabled={isResetting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                             {isResetting ? 'Sending...' : 'Send Link'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        
        {/* Left Side: Brand */}
        <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-700 p-10 flex flex-col justify-center text-white relative">
          <Link to="/" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center gap-2 text-sm font-bold">
            <i className="fa-solid fa-arrow-left"></i> {t('auth_back_home')}
          </Link>
          <h1 className="text-4xl font-bold mb-4">{t('auth_platform_title')}</h1>
          <p className="text-indigo-100 mb-8">
            {t('auth_platform_desc')}
          </p>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
               <span>{t('auth_feat_salon')}</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><i className="fa-solid fa-lock"></i></div>
               <span>{t('auth_feat_medical')}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
                {isVerifying ? "Verify Account" : (isLogin ? t('auth_welcome_back') : t('auth_register_biz'))}
            </h2>
            <p className="text-sm text-gray-500">
              {isVerifying 
                ? `Enter the code sent to ${regData.email}` 
                : (isLogin ? t('auth_login_subtitle') : t('auth_join_subtitle'))}
            </p>
          </div>

          {/* Login Form */}
          {isLogin && !isVerifying && (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_email')}</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="owner@business.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">{t('auth_password')}</label>
                    <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-indigo-600 hover:underline">Forgot Password?</button>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                  {t('auth_login_btn')}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button onClick={handleGuestLogin} className="w-full bg-white text-gray-700 border border-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                 <i className="fa-regular fa-id-card"></i> Try Demo as Guest
              </button>
            </div>
          )}

          {/* Registration Form (Step 1) */}
          {!isLogin && !isVerifying && (
            <form onSubmit={initiateRegistration} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_biz_name')}</label>
                <input 
                  type="text" 
                  required
                  value={regData.name}
                  onChange={e => setRegData({...regData, name: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="e.g. Luxe Salon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_biz_type')}</label>
                <select 
                  className="w-full border rounded-lg px-4 py-2 bg-white"
                  value={regData.type}
                  onChange={e => setRegData({...regData, type: e.target.value as BusinessType})}
                >
                  <option value={BusinessType.SALON}>Salon & Spa</option>
                  <option value={BusinessType.MEDICAL} disabled>Medical Clinic (Waitlist)</option>
                  <option value={BusinessType.SCHOOL} disabled>School (Waitlist)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_email')}</label>
                  <input 
                    type="email" 
                    required
                    value={regData.email}
                    onChange={e => setRegData({...regData, email: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_phone')}</label>
                   <input 
                    type="tel" 
                    required
                    value={regData.phone}
                    onChange={e => setRegData({...regData, phone: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                   />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_password')}</label>
                 <input 
                   type="password" 
                   required
                   minLength={6}
                   value={regData.password}
                   onChange={e => setRegData({...regData, password: e.target.value})}
                   className="w-full border rounded-lg px-4 py-2"
                   placeholder="Create a strong password"
                 />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                 Send Verification Code
              </button>
            </form>
          )}

          {/* Verification OTP Form (Step 2) */}
          {isVerifying && (
              <form onSubmit={verifyAndRegister} className="space-y-4 animate-fade-in">
                  <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-800 mb-4">
                     <i className="fa-solid fa-envelope mr-2"></i> 
                     We sent a 6-digit code to <strong>{regData.email}</strong> and <strong>{regData.phone}</strong>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                        className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="000000"
                        autoFocus
                    />
                  </div>
                  <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md">
                     Verify & Create Account
                  </button>
                  <button type="button" onClick={() => setIsVerifying(false)} className="w-full text-gray-500 text-sm hover:underline">
                      Go Back / Edit Details
                  </button>
              </form>
          )}

          {!isVerifying && (
            <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">
                {isLogin ? t('auth_no_account') : t('auth_has_account')}
                </span>
                <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-indigo-600 font-bold hover:underline"
                >
                {isLogin ? t('auth_register_now') : t('auth_login_btn')}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;