import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const ModernAuthModalV2 = ({ isOpen, onClose, onSuccess, mode = 'customer', allowModeToggle = false, isSignupFlow = false }) => {
  // Step: 'phone_input' -> 'otp_input' -> 'name_input' (only for new users after OTP verified)
  const [step, setStep] = useState('phone_input');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loginMode, setLoginMode] = useState(mode); // 'customer' or 'partner'

  // Refs for OTP inputs
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    // Focus first OTP box when entering OTP step
    if (step === 'otp_input' && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
    // Focus name input when entering name step
    if (step === 'name_input' && isNewUser) {
      setTimeout(() => {
        const nameInput = document.getElementById('auth-name-input');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  }, [step, isNewUser]);

  if (!isOpen) return null;

  const isEmail = identifier.includes('@');
  const isPhone = /^\d+$/.test(identifier);

  const handleSendOTP = async () => {
    if (!identifier || (!isEmail && !isPhone)) {
      toast.error('Please enter a valid email or phone number');
      return;
    }

    setLoading(true);
    try {
      // 1) For partner LOGIN (not signup), make sure a partner exists
      if (loginMode === 'partner' && !isSignupFlow) {
        const checkResponse = await axios.post(`${API}/auth/check-partner-exists`, {
          identifier
        });

        if (!checkResponse.data?.exists) {
          toast.error('No partner account found. Please use "Become a Partner" to sign up.');
          setLoading(false);
          return;
        }
      }

      // 2) Send OTP
      const response = await axios.post(`${API}/auth/send-otp`, {
        identifier
      });

      const newUserFlag = response.data?.is_new_user || false;

      // 3) For partner SIGNUP, block if this number is already registered
      if (loginMode === 'partner' && isSignupFlow && !newUserFlag) {
        toast.error('This number is already registered. Please use "Login as Partner" instead.');
        setLoading(false);
        return;
      }

      setIsNewUser(newUserFlag);
      setStep('otp_input');
      toast.success('OTP sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (index === 3 && value && newOtp.every(digit => digit)) {
      setTimeout(() => {
        handleVerifyOTP(newOtp.join(''));
      }, 100);
    }
  };

  const handleOTPKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs[3].current?.focus();
      // Auto-verify
      setTimeout(() => {
        handleVerifyOTP(pastedData);
      }, 100);
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (!otpToVerify || otpToVerify.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }

    // If new user, just move to name input step (don't verify OTP yet)
    if (isNewUser) {
      setStep('name_input');
      return;
    }

    // For existing users, verify OTP and complete login
    setLoading(true);
    try {
      const roleMapping = {
        'customer': 'customer',
        'partner': 'partner_owner'
      };
      const backendRole = roleMapping[loginMode] || 'customer';
      
      const response = await axios.post(`${API}/auth/verify-otp`, {
        identifier: identifier,
        otp: otpToVerify,
        role: backendRole
      });
      
      if (onSuccess) {
        // For login (not signup), pass false for isNewUser to prevent onboarding
        onSuccess(response.data.access_token, response.data.user, false);
      }
      onClose();
      toast.success(loginMode === 'partner' ? 'Welcome back, Partner!' : 'Welcome back!');
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
      const roleMapping = {
        'customer': 'customer',
        'partner': 'partner_owner'
      };
      const backendRole = roleMapping[loginMode] || 'customer';
      
      const response = await axios.post(`${API}/auth/verify-otp`, {
        identifier: identifier,
        otp: otp.join(''),
        name: name,
        role: backendRole
      });
      
      if (onSuccess) {
        // For signup, pass true for isNewUser to trigger onboarding
        onSuccess(response.data.access_token, response.data.user, true);
      }
      onClose();
      toast.success(loginMode === 'partner' ? 'Welcome to rayy, Partner!' : 'Welcome to rayy!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    onClose();
    const redirectUrl = window.location.origin + '/mobile';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleBack = () => {
    if (step === 'name_input') {
      setStep('otp_input');
    } else if (step === 'otp_input') {
      setStep('phone_input');
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
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {step !== 'phone_input' && (
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
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
              {step === 'phone_input' 
                ? (mode === 'partner' ? 'Partner Login' : 'Welcome!') 
                : step === 'otp_input'
                  ? 'Verify OTP'
                  : (mode === 'partner' ? 'Create Partner Account' : 'Create Account')}
            </h2>
            <p className="text-white/80">
              {step === 'phone_input' 
                ? (mode === 'partner' 
                    ? 'Sign up as a partner to list your activities' 
                    : 'Enter your email or phone to continue')
                : step === 'otp_input'
                  ? `Enter the OTP sent to ${identifier}`
                  : 'Tell us your name to complete signup'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'phone_input' ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email or Phone Number *
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
                      className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send you a one-time password to verify your account
                  </p>
                </div>

                {/* Login Mode Toggle - Only show if allowModeToggle is true */}
                {allowModeToggle && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {loginMode === 'customer' ? 'Login as Customer' : 'Login as Partner'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLoginMode(loginMode === 'customer' ? 'partner' : 'customer')}
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Switch to {loginMode === 'customer' ? 'Partner' : 'Customer'}
                    </button>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendOTP}
                  disabled={loading || !identifier}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignIn}
                  className="w-full py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>
              </motion.div>
            ) : step === 'otp_input' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                    Enter 4-Digit Code
                  </label>
                  
                  {/* Box-style OTP Input - FIX FOR ISSUE #2 */}
                  <div className="flex gap-3 justify-center mb-4" onPaste={handleOTPPaste}>
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
                        className="w-14 h-16 text-center text-2xl font-bold text-gray-900 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleSendOTP}
                      className="text-purple-600 font-semibold hover:text-purple-700"
                    >
                      Resend
                    </button>
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otp.some(digit => !digit)}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify & Continue
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Full Name *
                  </label>
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompleteSignup}
                  disabled={loading || !name.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {mode === 'partner' ? 'Create Partner Account' : 'Create Account'}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            <p className="text-xs text-gray-500 text-center mt-6">
              By continuing, you agree to rayy's{' '}
              <a href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-purple-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="h-8" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernAuthModalV2;
