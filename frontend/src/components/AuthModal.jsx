import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { API } from '../App';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

const AuthModal = ({ mode = 'customer', onClose }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [otpFlow, setOtpFlow] = useState(false); // For OTP login flow
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    role: mode === 'partner' ? 'partner_owner' : 'customer' 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      login(response.data.access_token, response.data.user);
      toast.success('Welcome back!');
      onClose();
      
      // Check for redirect after auth
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterAuth');
        setTimeout(() => navigate(redirectPath), 100);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    }
    setLoading(false);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) {
      toast.error('Please enter email or phone number');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/send-otp`, { identifier: emailOrPhone });
      setOtpSent(true);
      toast.success('OTP sent! Use: 1234');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send OTP'));
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-otp`, { identifier: emailOrPhone, otp: otp });
      login(response.data.access_token, response.data.user);
      toast.success('Welcome back!');
      onClose();
      
      // Check for redirect after auth
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterAuth');
        setTimeout(() => navigate(redirectPath), 100);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid OTP'));
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      
      // DEBUG: Log registration response
      console.log('🔍 Registration Response:', {
        is_new_user: response.data.is_new_user,
        user_role: response.data.user.role,
        onboarding_complete: response.data.user.onboarding_complete
      });
      
      // Use is_new_user from backend response, not hardcoded true
      login(response.data.access_token, response.data.user, response.data.is_new_user);
      toast.success('Account created successfully!');
      
      // Only close modal and redirect if NOT showing onboarding
      // If onboarding is triggered, let it show first
      if (!response.data.is_new_user || response.data.user.onboarding_complete) {
        onClose();
        
        // Check for redirect after auth (only if no onboarding)
        const redirectPath = sessionStorage.getItem('redirectAfterAuth');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterAuth');
          setTimeout(() => navigate(redirectPath), 100);
        }
      } else {
        // New user with incomplete onboarding - close modal but let onboarding wizard show
        onClose();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="auth-modal" style={{
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem'
      }}>
        <DialogHeader>
          <DialogTitle style={{
            fontSize: '28px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Space Grotesk, sans-serif',
            marginBottom: '1.5rem'
          }}>
            {mode === 'partner' ? 'Partner Registration' : 'Welcome to rayy'}
          </DialogTitle>
          {mode === 'partner' && (
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '-1rem', marginBottom: '1rem' }}>
              Create your partner account and start listing your classes
            </p>
          )}
        </DialogHeader>

        <Tabs defaultValue="login">
          <TabsList style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px'
          }}>
            <TabsTrigger data-testid="login-tab" value="login" style={{ borderRadius: '8px' }}>Login</TabsTrigger>
            <TabsTrigger data-testid="register-tab" value="register" style={{ borderRadius: '8px' }}>Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            {/* Show OTP login for customers, password login for partners */}
            {mode === 'customer' && !otpFlow ? (
              <form data-testid="otp-form" onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <Label htmlFor="email-or-phone">Email or Phone Number</Label>
                  <Input
                    id="email-or-phone"
                    data-testid="email-or-phone-input"
                    type="text"
                    placeholder="email@example.com or 9876543210"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    disabled={otpSent}
                    required
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </div>
                
                {otpSent && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      data-testid="otp-input"
                      type="text"
                      placeholder="1234"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={4}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '18px',
                        letterSpacing: '0.5em',
                        textAlign: 'center'
                      }}
                    />
                    <p style={{ marginTop: '0.5rem', fontSize: '12px', color: '#06b6d4' }}>
                      Default OTP: 1234
                    </p>
                  </div>
                )}
                
                <button
                  data-testid="otp-submit-button"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
                </button>
                
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'transparent',
                      color: '#06b6d4',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Change Email/Phone
                  </button>
                )}
                
                <p style={{ marginTop: '1rem', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setOtpFlow(true)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#06b6d4', 
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Login with password instead
                  </button>
                </p>
              </form>
            ) : (
              <form data-testid="login-form" onSubmit={handleLogin} style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="priya@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </div>
                <button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                
                {mode === 'customer' && (
                  <p style={{ marginTop: '1rem', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setOtpFlow(false)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#06b6d4', 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Login with OTP instead
                    </button>
                  </p>
                )}
                
                {mode === 'partner' && (
                  <p style={{ marginTop: '1rem', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    Test: partner1@yuno.app / password123
                  </p>
                )}
              </form>
            )}
          </TabsContent>

          <TabsContent value="register">
            <form data-testid="register-form" onSubmit={handleRegister} style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  data-testid="register-name-input"
                  type="text"
                  placeholder="Your name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  data-testid="register-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="register-phone">Phone (optional)</Label>
                <Input
                  id="register-phone"
                  data-testid="register-phone-input"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  data-testid="register-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              <button
                data-testid="register-submit-button"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
