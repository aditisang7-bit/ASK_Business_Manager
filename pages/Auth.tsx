import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { DB } from '../services/db';
import { BusinessProfile, BusinessType } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Login State
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    type: BusinessType.SALON,
    password: '' 
  });

  // Password Recovery State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Update Password State (Recovery Flow)
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // -----------------------------------------------------------
  // 1. Check for Session & Recovery flow on Mount
  // -----------------------------------------------------------
  useEffect(() => {
    // Check if we have an access token in URL (Magic Link flow)
    if (location.hash && location.hash.includes('access_token')) {
        setIsVerifying(true);
    }

    // Listener for Auth Changes (Magic Link clicks, Password Resets)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth Event:", event);
        
        if (event === "PASSWORD_RECOVERY") {
            setIsVerifying(false);
            setShowUpdatePassword(true);
        } 
        else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
            // Logic: If Supabase says we are signed in, but our App's local storage is empty,
            // we must sync them. This happens when clicking a Magic Link.
            if (session?.user.email) {
                 const userEmail = session.user.email;
                 
                 // If we are already logged in locally as this user, do nothing
                 if (DB.isAuthenticated() && localStorage.getItem('salon_auth_session') === userEmail) {
                     navigate('/dashboard');
                     return;
                 }

                 console.log("Syncing Supabase Session to Local App State...");
                 localStorage.setItem('salon_auth_session', userEmail);
                 
                 // Fetch full profile from DB
                 const { data: profile } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .eq('email', userEmail)
                    .maybeSingle();
                 
                 if (profile) {
                     localStorage.setItem('salon_profile', JSON.stringify(profile));
                     await DB.syncDataFromCloud(profile.id);
                     setIsVerifying(false);
                     navigate('/dashboard');
                     showToast("Verified & Logged In Successfully", "success");
                 } else {
                     console.warn("User authenticated but no profile found.");
                     setIsVerifying(false);
                 }
            }
        }
        else if (event === "SIGNED_OUT") {
            setIsVerifying(false);
        }
    });

    // Also check URL parameters for manual detection of recovery
    if (location.hash && location.hash.includes('type=recovery')) {
        setShowUpdatePassword(true);
    }

    // Cleanup subscription
    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [navigate, location, showToast]);

  // -----------------------------------------------------------
  // 2. Handlers
  // -----------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        showToast("Please enter your email.", "error");
        return;
    }

    setIsLoggingIn(true);
    
    try {
      if (useMagicLink) {
        // --- Magic Link Login ---
        const { success, error } = await DB.sendMagicLink(email);
        if (success) {
            showToast("Magic Link sent! Check your email to log in.", "success");
        } else {
            showToast(`Failed to send link: ${error}`, "error");
        }
      } else {
        // --- Password Login ---
        if (!password) {
            showToast("Please enter password.", "error");
            setIsLoggingIn(false);
            return;
        }

        const result = await DB.verifyUser(email, password);
        
        if (result.success) {
            if (email === 'askmultinationalcompany@gmail.com') {
                showToast("Welcome, Super Admin!", "success");
                navigate('/admin');
            } else {
                showToast("Login Successful! Syncing data...", "success");
                navigate('/dashboard');
            }
        } else {
            showToast(result.message || "Invalid Credentials.", "error");
        }
      }
    } catch (err) {
      showToast("Login Failed. Network Error.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.password || regData.password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }
    if (!regData.name || !regData.email || !regData.phone) {
        showToast("All fields are required.", "error");
        return;
    }

    const exists = await DB.checkUserExists(regData.email);
    if (exists) {
        showToast("Email already exists. Please login.", "error");
        setIsLogin(true);
        return;
    }

    const newProfile: BusinessProfile = {
      id: `biz_${Date.now()}`,
      name: regData.name,
      type: regData.type,
      address: '',
      phone: regData.phone,
      email: regData.email,
      password: regData.password, 
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

    try {
        await DB.register(newProfile);
        showToast("Registration Successful! Please check your email to verify your account.", "success");
        // We do not auto-navigate to dashboard to encourage verification, unless in demo mode
        // But for UX, we switch to login tab
        setIsLogin(true);
        setEmail(regData.email);
    } catch(err: any) {
        showToast("Registration Failed. " + (err.message || ''), "error");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsResetting(true);
    
    const { success, error } = await DB.sendPasswordReset(forgotEmail);
    
    setIsResetting(false);
    if (success) {
        showToast(`Password reset link sent to ${forgotEmail}`, "success");
        setShowForgot(false);
    } else {
        showToast(`Failed: ${error}`, "error");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
        showToast("Password too short.", "error");
        return;
    }
    
    const { success, error } = await DB.updateUserPassword(newPassword);
    if (success) {
        showToast("Password updated successfully! Please login.", "success");
        setShowUpdatePassword(false);
        setIsLogin(true);
    } else {
        showToast(`Update failed: ${error}`, "error");
    }
  };

  const handleGuestLogin = () => {
    DB.loginAsGuest();
    showToast("Welcome Guest! Entering Demo Mode...", "info");
    navigate('/dashboard');
  };

  if (isVerifying) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center animate-fade-in text-center max-w-sm w-full">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Verifying Login...</h2>
                  <p className="text-sm text-slate-500">Please wait while we authenticate your session and sync your data.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Forgot Password Modal */}
      {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                  <h3 className="text-xl font-bold mb-2">Recover Account</h3>
                  <p className="text-sm text-gray-500 mb-4">Enter your registered email to receive a verification link.</p>
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

      {/* Update Password Modal (triggered from email link) */}
      {showUpdatePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                  <h3 className="text-xl font-bold mb-2">Set New Password</h3>
                  <p className="text-sm text-gray-500 mb-4">Secure your account with a new password.</p>
                  <form onSubmit={handleUpdatePassword}>
                      <input 
                        type="password" 
                        required 
                        className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                      <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                         Update Password
                      </button>
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
                {isLogin ? t('auth_welcome_back') : t('auth_register_biz')}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? t('auth_login_subtitle') : t('auth_join_subtitle')}
            </p>
          </div>

          {/* Login Form */}
          {isLogin && (
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
                
                {!useMagicLink && (
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
                )}

                <button type="submit" disabled={isLoggingIn} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex justify-center items-center">
                  {isLoggingIn ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (useMagicLink ? 'Send Magic Link' : t('auth_login_btn'))}
                </button>

                <div className="text-center">
                   <button 
                     type="button" 
                     onClick={() => setUseMagicLink(!useMagicLink)} 
                     className="text-xs text-slate-500 hover:text-indigo-600 underline"
                   >
                     {useMagicLink ? "Login with Password instead" : "Login via Email Link (Passwordless)"}
                   </button>
                </div>
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

          {/* Registration Form */}
          {!isLogin && (
            <form onSubmit={handleRegister} className="space-y-4">
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
                 Create Account
              </button>
              <p className="text-xs text-gray-500 text-center">
                We will send a verification link to your email.
              </p>
            </form>
          )}

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
        </div>
      </div>
    </div>
  );
};

export default Auth;