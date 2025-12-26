import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Lock, User } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const ModernAuthModalV2 = ({ isOpen, onClose, onSuccess, mode = 'customer', allowModeToggle = false }) => {
  // Tabs: 'login' or 'register'
  const [activeTab, setActiveTab] = useState('login');
  
  // Login State (Password Flow)
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [useOtpForLogin, setUseOtpForLogin] = useState(false); // Toggle for customers

  // Wizard State (OTP/Register Flow)
  // Step: 'identifier_input' -> 'otp_input' -> 'name_input'
  const [wizardStep, setWizardStep] = useState('identifier_input');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState(mode); // 'customer' or 'partner'

  // Refs
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Reset state when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setWizardStep('identifier_input');
      setUseOtpForLogin(false);
      setIdentifier('');
      setOtp(['', '', '', '']);
      setLoginData({ email: '', password: '' });
    }
  }, [isOpen, activeTab]);

  // Focus management
  useEffect(() => {
    if (wizardStep === 'otp_input' && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
    if (wizardStep === 'name_input') {
      setTimeout(() => {
        const nameInput = document.getElementById('auth-name-input');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  }, [wizardStep]);

  if (!isOpen) return null;

  const isEmail = identifier.includes('@');
  const isPhone = /^\d+$/.test(identifier);

  // --- PASSWORD LOGIN HANDLER (From AuthModal) ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: loginData.email,
        password: loginData.password,
        role: loginMode === 'partner' ? 'partner_owner' : 'customer' // Ensure role is passed if backend needs it, or handled by email
      });
      
      if (onSuccess) {
        onSuccess(response.data.access_token, response.data.user, false);
      }
      toast.success('Welcome back!');
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- OTP HANDLERS (Shared for Login & Signup) ---
  const handleSendOTP = async () => {
    if (!identifier || (!isEmail && !isPhone)) {
      toast.error('Please enter a valid email or phone number');
      return;
    }

    setLoading(true);
    try {
      // 1) Partner Logic Check
      if (loginMode === 'partner' && activeTab === 'login') {
         // Partners usually login via password, but if you allow OTP login for partners:
         const checkResponse = await axios.post(`${API}/auth/check-partner-exists`, { identifier });
         if (!checkResponse.data?.exists) {
            toast.error('Partner account not found.');
            setLoading(false);
            return;
         }
      }

      // 2) Send OTP
      const response = await axios.post(`${API}/auth/send-otp`, { identifier });
      const newUserFlag = response.data?.is_new_user || false;

      // 3) Logic Branching
      if (activeTab === 'register' && !newUserFlag && loginMode === 'partner') {
         // Prevent re-registering existing partners via OTP flow
         toast.error('Account exists. Please login.');
         setLoading(false);
         return;
      }

      setIsNewUser(newUserFlag);
      setWizardStep('otp_input');
      toast.success('OTP sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
    if (index === 3 && value && newOtp.every(d => d)) {
      setTimeout(() => handleVerifyOTP(newOtp.join('')), 100);
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const otpToVerify = otpCode || otp.join('');
    if (!otpToVerify || otpToVerify.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }

    // If Registering AND it's a new user, go to Name Step
    if (activeTab === 'register' && isNewUser) {
      setWizardStep('name_input');
      return;
    }
    
    // If Logging in OR (Registering but user exists), verify and login
    setLoading(true);
    try {
      const backendRole = loginMode === 'partner' ? 'partner_owner' : 'customer';
      const response = await axios.post(`${API}/auth/verify-otp`, {
        identifier,
        otp: otpToVerify,
        role: backendRole
      });
      
      if (onSuccess) {
        onSuccess(response.data.access_token, response.data.user, false);
      }
      onClose();
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const backendRole = loginMode === 'partner' ? 'partner_owner' : 'customer';
      const response = await axios.post(`${API}/auth/verify-otp`, {
        identifier,
        otp: otp.join(''),
        name,
        role: backendRole
      });
      
      if (onSuccess) {
        // Pass true for isNewUser to trigger onboarding
        onSuccess(response.data.access_token, response.data.user, true);
      }
      onClose();
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE AUTH ---
  const handleGoogleSignIn = () => {
    // STANDARD APPROACH: Redirect to your Backend Google Auth Endpoint
    // This endpoint should handle the OAuth flow and redirect back to your app with a token
    window.location.href = `${API}/auth/google`; 
    
    // ALTERNATIVE: If using Firebase or client-side Google SDK:
    // signInWithPopup(auth, provider).then(...)
  };

  const handleBack = () => {
    if (wizardStep === 'name_input') setWizardStep('otp_input');
    else if (wizardStep === 'otp_input') {
      setWizardStep('identifier_input');
      setOtp(['', '', '', '']);
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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header Section */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Back Button (Only in Wizard flow > step 1) */}
            {activeTab === 'register' && wizardStep !== 'identifier_input' && (
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}

            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl"
            >
              <Sparkles className="w-8 h-8 text-purple-600" />
            </motion.div>

            <h2 className="text-3xl font-bold text-white mb-1">
              {loginMode === 'partner' ? 'Partner Portal' : 'Welcome to Rayy'}
            </h2>
            <p className="text-white/80">
              {loginMode === 'partner' 
                ? 'Manage your listings and classes' 
                : 'Discover and book amazing activities'}
            </p>
          </div>

          {/* Custom Tab Switcher */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'login' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'register' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            
            {/* ================= LOGIN TAB ================= */}
            {activeTab === 'login' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Mode Toggle (Partner vs Customer) */}
                {allowModeToggle && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setLoginMode(loginMode === 'customer' ? 'partner' : 'customer')}
                      className="text-xs font-semibold text-purple-600 hover:underline"
                    >
                      Switch to {loginMode === 'customer' ? 'Partner' : 'Customer'} Login
                    </button>
                  </div>
                )}

                {/* Password Login Form (Default) */}
                {!useOtpForLogin ? (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                      {loading ? 'Logging in...' : 'Login'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  /* OTP Login Form (Customer Only) */
                  <div className="space-y-4">
                    {wizardStep === 'identifier_input' ? (
                      <>
                         <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Phone</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="email@example.com or 9876543210"
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleSendOTP}
                          disabled={loading || !identifier}
                          className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                          {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center space-y-6">
                        <p className="text-sm text-gray-600">Enter code sent to {identifier}</p>
                        <div className="flex gap-3 justify-center">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={otpRefs[index]}
                              type="text"
                              inputMode="numeric"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleOTPChange(index, e.target.value)}
                              onKeyDown={(e) => handleOTPKeyDown(index, e)}
                              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => handleVerifyOTP()}
                          disabled={loading}
                          className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
                        >
                          {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button onClick={() => setWizardStep('identifier_input')} className="text-sm text-purple-600">Change Number</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Switch between Password/OTP (Customer Only) */}
                {loginMode === 'customer' && (
                  <div className="text-center mt-4">
                    <p className="text-gray-500 text-sm">
                      {useOtpForLogin ? "Prefer using a password?" : "Forgot password or prefer OTP?"}
                    </p>
                    <button
                      onClick={() => {
                        setUseOtpForLogin(!useOtpForLogin);
                        setWizardStep('identifier_input');
                      }}
                      className="text-purple-600 font-semibold text-sm hover:underline mt-1"
                    >
                      {useOtpForLogin ? "Login with Password" : "Login with OTP"}
                    </button>
                  </div>
                )}
                
                {/* Google Login (Common) */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">Or continue with</span></div>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                   <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </motion.div>
            )}

            {/* ================= REGISTER TAB (Wizard Flow) ================= */}
            {activeTab === 'register' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Step 1: Identifier Input */}
                {wizardStep === 'identifier_input' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter Email or Phone
                      </label>
                      <div className="relative">
                        {isEmail ? (
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        ) : (
                          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                        <input
                          type="text"
                          placeholder="email@example.com or 9876543210"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        We'll send you a code to verify your contact info.
                      </p>
                    </div>

                    <button
                      onClick={handleSendOTP}
                      disabled={loading || !identifier}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending...' : 'Continue'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Step 2: OTP Input */}
                {wizardStep === 'otp_input' && (
                  <div className="space-y-6 text-center">
                     <div>
                      <h3 className="font-semibold text-gray-900">Enter Verification Code</h3>
                      <p className="text-sm text-gray-500 mt-1">Sent to {identifier}</p>
                     </div>

                    <div className="flex gap-3 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={otpRefs[index]}
                          type="text"
                          inputMode="numeric"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(index, e)}
                          className="w-14 h-16 text-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleVerifyOTP()}
                      disabled={loading || otp.some(d => !d)}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                )}

                {/* Step 3: Name Input (Only for New Users) */}
                {wizardStep === 'name_input' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="auth-name-input"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteSignup}
                      disabled={loading || !name.trim()}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Creating Account...' : 'Complete Sign Up'} <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            <p className="text-xs text-gray-400 text-center mt-6">
              By continuing, you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernAuthModalV2;