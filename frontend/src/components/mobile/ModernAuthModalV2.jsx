import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Lock, User } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const ModernAuthModalV2 = ({ isOpen, onClose, onSuccess, mode = 'customer', allowModeToggle = false }) => {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login State
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [useOtpForLogin, setUseOtpForLogin] = useState(true);

  // Register / Wizard State
  const [wizardStep, setWizardStep] = useState('identifier_input');
  const [identifier, setIdentifier] = useState(''); // Mobile number
  const [otp, setOtp] = useState(['', '', '', '','', '']);
  
  // Signup Form Data
  const [registerData, setRegisterData] = useState({ name: '', password: '', email: '' });

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState(mode);

  const otpRefs = [useRef(null), useRef(null), useRef(null), 
  useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (isOpen) {
      setWizardStep('identifier_input');
      setUseOtpForLogin(true);
      setIdentifier('');
      setOtp(['', '', '', '', '', '']);
      setLoginData({ identifier: '', password: '' });
      setRegisterData({ name: '', password: '', email: '' });
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (wizardStep === 'otp_input' && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, [wizardStep]);

  if (!isOpen) return null;

  // Helper to validate mobile number (10 digits)
  const isValidMobile = (text) => /^\d{10}$/.test(text);

  // Handle mobile input - only allow numbers up to 10 digits
  const handleMobileChange = (value, setter) => {
    // Only allow numbers
    const numbersOnly = value.replace(/\D/g, '');
    // Limit to 10 digits
    if (numbersOnly.length <= 10) {
      setter(numbersOnly);
    }
  };

  // --- 1. CHECK USER (Modified to skip OTP for Register) ---
  const handleContinue = async () => {
    if (!isValidMobile(identifier)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    // --- MODIFICATION: Skip OTP/Check for Register Flow ---
    // If we are registering, we go straight to the form.
    // The backend register endpoint will handle "User already exists" errors.
    if (activeTab === 'register') {
      setWizardStep('signup_form');
      return;
    }

    setLoading(true);
    try {
      // Use send-otp to check status (returns is_new_user)
      const response = await axios.post(`${API}/auth/send-otp`, { identifier });
      const isNewUser = response.data?.is_new_user;

      // --- LOGIN FLOW (OTP) ---
      if (isNewUser) {
        toast.error('Account not found. Please sign up.');
        setLoading(false);
        return;
      }
      // Existing User -> Go to OTP Input
      setWizardStep('otp_input');
      toast.success('OTP sent successfully!');

    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || 'Failed to verify account');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SIGNUP (Name + Password + Email) ---
  const handleCompleteSignup = async () => {
    // Validation
    if (!registerData.name.trim() || !registerData.password || !registerData.email) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: registerData.name,
        password: registerData.password,
        email: registerData.email,
        phone: identifier, // 10-digit mobile number
        role: loginMode === 'partner' ? 'partner_owner' : 'customer'
      };

      const response = await axios.post(`${API}/auth/register`, payload);

      if (onSuccess) onSuccess(response.data.access_token, response.data.user, true);
      toast.success('Account created successfully!');
      onClose();
    } catch (error) {
      // This will now catch "User already exists" errors since we skipped the initial check
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LOGIN (Password) ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!isValidMobile(loginData.identifier)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        identifier: loginData.identifier, 
        password: loginData.password,
        role: loginMode === 'partner' ? 'partner_owner' : 'customer'
      });
      
      if (onSuccess) onSuccess(response.data.access_token, response.data.user, false);
      toast.success('Welcome back!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. LOGIN (OTP Verification) ---
  const handleOTPChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-otp`, {
        identifier,
        otp: otpCode,
        role: loginMode === 'partner' ? 'partner_owner' : 'customer'
      });
      console.log(response)
      if (onSuccess) onSuccess(response.data.access_token, response.data.user, false);
      toast.success('Login successful!');
      onClose();
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API}/auth/google`; 
  };

  const handleBack = () => {
    setWizardStep('identifier_input');
    setOtp(['', '', '', '', '', '']);
    setRegisterData({ name: '', password: '', email: '' });
  };

  // Resend OTP function
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { identifier });
      toast.success('OTP sent successfully!');
      setOtp(['', '', '', '', '', '']); // Clear existing OTP
      if (otpRefs[0].current) {
        otpRefs[0].current.focus();
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10">
              <X className="w-5 h-5 text-white" />
            </button>
            {wizardStep !== 'identifier_input' && (
              <button onClick={handleBack} className="absolute top-4 left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-1">
              {loginMode === 'partner' ? 'Partner Portal' : 'Welcome to Rayy'}
            </h2>
            <p className="text-white/80">
              {activeTab === 'register' ? 'Create your account' : 'Login to continue'}
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('login')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Login
              </button>
              <button onClick={() => setActiveTab('register')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Sign Up
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            
            {/* ---------------- LOGIN TAB ---------------- */}
            {activeTab === 'login' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {!useOtpForLogin ? (
                  // Password Login
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="tel" 
                          required
                          value={loginData.identifier}
                          onChange={(e) => handleMobileChange(e.target.value, (val) => setLoginData({...loginData, identifier: val}))}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                      </div>
                      {loginData.identifier && !isValidMobile(loginData.identifier) && (
                        <p className="text-xs text-red-500 mt-1">Please enter exactly 10 digits</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="password" 
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading || !isValidMobile(loginData.identifier)} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? 'Logging in...' : 'Login'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  // OTP Login
                  <div className="space-y-4">
                    {wizardStep === 'identifier_input' ? (
                      <>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="tel"
                            value={identifier}
                            onChange={(e) => handleMobileChange(e.target.value, setIdentifier)}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                          />
                        </div>
                        {identifier && !isValidMobile(identifier) && (
                          <p className="text-xs text-red-500">Please enter exactly 10 digits</p>
                        )}
                        <button onClick={handleContinue} disabled={loading || !isValidMobile(identifier)} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading ? 'Sending OTP...' : 'Send Login OTP'}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4 text-center">
                        <p className="text-gray-600">Enter 6-digit OTP sent to +91 {identifier}</p>
                        <div className="flex gap-2 justify-center">
                           {otp.map((d, i) => (
                             <input key={i} ref={otpRefs[i]} value={d} maxLength={1} onChange={(e) => handleOTPChange(i, e.target.value)} className="w-12 h-14 border-2 rounded-lg text-center text-xl font-bold focus:border-purple-500 outline-none" />
                           ))}
                        </div>
                        <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50">
                          {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button onClick={handleResendOTP} disabled={loading} className="text-purple-600 text-sm font-semibold hover:underline">
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Mode Toggle */}
                <button onClick={() => { setUseOtpForLogin(!useOtpForLogin); setWizardStep('identifier_input'); }} className="block w-full text-center text-purple-600 text-sm font-semibold mt-4 hover:underline">
                  {useOtpForLogin ? "Use Password" : "Use OTP"}
                </button>
              </motion.div>
            )}

            {/* ---------------- REGISTER TAB ---------------- */}
            {activeTab === 'register' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                
                {/* Step 1: Input Mobile Number */}
                {wizardStep === 'identifier_input' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={identifier}
                          onChange={(e) => handleMobileChange(e.target.value, setIdentifier)}
                          placeholder="10-digit mobile number"
                          className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all"
                          maxLength={10}
                        />
                      </div>
                      {identifier && !isValidMobile(identifier) && (
                        <p className="text-xs text-red-500 mt-1">Please enter exactly 10 digits</p>
                      )}
                    </div>
                    <button
                      onClick={handleContinue}
                      disabled={loading || !isValidMobile(identifier)}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? 'Checking...' : 'Continue'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Step 2: OTP Input (for existing users trying to signup) */}
                {wizardStep === 'otp_input' && (
                  <div className="space-y-4 text-center">
                    <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg mb-2">
                      Account already exists! Please verify with OTP to login.
                    </div>
                    <p className="text-gray-600">Enter 6-digit OTP sent to +91 {identifier}</p>
                    <div className="flex gap-2 justify-center">
                       {otp.map((d, i) => (
                         <input key={i} ref={otpRefs[i]} value={d} maxLength={1} onChange={(e) => handleOTPChange(i, e.target.value)} className="w-12 h-14 border-2 rounded-lg text-center text-xl font-bold focus:border-purple-500 outline-none" />
                       ))}
                    </div>
                    <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button onClick={handleResendOTP} disabled={loading} className="text-purple-600 text-sm font-semibold hover:underline">
                      Resend OTP
                    </button>
                  </div>
                )}

                {/* Step 3: Signup Form (Name/Email/Password) - Only for new users */}
                {wizardStep === 'signup_form' && (
                  <div className="space-y-4">
                     <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg mb-2">
                        You are new here! Please complete your profile.
                     </div>
                     
                     {/* Read-Only Mobile Number */}
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Verified Mobile
                        </label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                           <input type="text" value={identifier} disabled className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-2 border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
                        </div>
                     </div>

                     {/* Email (Required) */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className='text-red-500'>*</span></label>
                       <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type="email"
                           placeholder="your.email@example.com"
                           value={registerData.email}
                           onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                           className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                         />
                       </div>
                     </div>

                     {/* Name */}
                     <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className='text-red-500'>*</span></label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Create Password <span className='text-red-500'>*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="Create a strong password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteSignup}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Sign Up'} <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Google Footer */}
            <div className="mt-6">
              <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">Or continue with</span></div>
              </div>
              <button onClick={handleGoogleSignIn} className="w-full py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                 Google
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernAuthModalV2;