import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { User, UserCircle, Wallet, Calendar, LogOut, LayoutDashboard, MapPin, TrendingUp, Award, FileText, Building2, Sparkles, Users } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API = process.env.REACT_APP_BACKEND_URL || '';

const Navbar = () => {
  const { user, logout, showAuth, location, setLocation } = useContext(AuthContext);
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(null);

  // State for simple dropdowns
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Refs for click-outside detection
  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchWalletBalance();
    }
  }, [user]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setIsDesktopOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletBalance(response.data.wallet?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Helper component for consistent menu items
  const MenuItem = ({ icon: Icon, label, onClick, testId, className = "" }) => (
    <button
      data-testid={testId}
      onClick={() => {
        onClick();
        setIsDesktopOpen(false);
        setIsMobileOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-md ${className}`}
    >
      <Icon size={18} className="text-slate-500" />
      {label}
    </button>
  );

  return (
    <>
      <nav data-testid="main-navbar" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '1rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* LOGO */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            data-testid="logo-link" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                setTimeout(() => window.location.reload(), 100);
              } else {
                navigate('/');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }
            }}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-slate-800 font-bold text-lg md:text-2xl tracking-tight">rayy</h1>
              <p className="text-slate-600 text-xs md:text-sm hidden sm:block">Learn • Play • Shine</p>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <button
              onClick={() => setLocation && setLocation(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem',
                background: location && !location.denied ? '#f0f9ff' : '#fef3c7',
                border: location && !location.denied ? '1px solid #bae6fd' : '1px solid #fde68a',
                borderRadius: '50%',
                color: location && !location.denied ? '#0891b2' : '#d97706',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <MapPin size={18} />
            </button>

            {(!user || user.role === 'customer') && (
              <Link
                to="/partner-landing"
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#6EE7B7',
                  textDecoration: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Become a Partner
              </Link>
            )}
            
            {!user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                data-testid="login-button"
                onClick={() => showAuth()}
                className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                Login
              </motion.button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {user.role === 'customer' && walletBalance !== null && (
                  <button
                    onClick={() => navigate('/wallet')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    <Wallet size={18} />
                    <span>{walletBalance}</span>
                  </button>
                )}

                <span className="hidden md:block text-slate-700 font-medium text-sm">Hello, {user.name}</span>
                
                {/* --- CUSTOM DESKTOP DROPDOWN --- */}
                <div className="relative" ref={desktopMenuRef}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    data-testid="user-menu-trigger"
                    onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </motion.button>

                  {isDesktopOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {user.role === 'customer' && (
                        <>
                          <MenuItem icon={LayoutDashboard} label="My Dashboard" onClick={() => navigate('/dashboard')} className="bg-slate-50" />
                          <MenuItem icon={Calendar} label="My Bookings" onClick={() => navigate('/bookings')} testId="my-bookings-link" />
                          <MenuItem icon={FileText} label="My Invoices" onClick={() => navigate('/invoices')} />
                          <MenuItem icon={Wallet} label="Wallet & Credits" onClick={() => navigate('/wallet')} testId="wallet-link" />
                          <MenuItem icon={User} label="Profile" onClick={() => navigate('/profile')} testId="profile-link" />
                        </>
                      )}
                      
                      {user.role === 'partner_owner' && (
                        <>
                          <MenuItem icon={LayoutDashboard} label="Partner Dashboard" onClick={() => navigate('/partner/dashboard')} testId="partner-dashboard-link" />
                          <MenuItem icon={UserCircle} label="My Profile" onClick={() => navigate('/partner/profile')} />
                          <MenuItem icon={Wallet} label="Financials" onClick={() => navigate('/partner/financials')} />
                        </>
                      )}
                      
                      {user.role === 'admin' && (
                        <>
                          <MenuItem icon={LayoutDashboard} label="Admin Dashboard" onClick={() => navigate('/admin')} testId="admin-dashboard-link" />
                          <MenuItem icon={TrendingUp} label="Advanced Analytics" onClick={() => navigate('/admin/analytics')} />
                          <MenuItem icon={Building2} label="Partners Manager" onClick={() => navigate('/admin/partners')} />
                          <MenuItem icon={Award} label="Badge Manager" onClick={() => navigate('/admin/badges')} />
                        </>
                      )}
                      
                      <div className="h-px bg-slate-100 my-1" />
                      
                      <button 
                        data-testid="logout-button"
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-md"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
                {/* --- END CUSTOM DESKTOP DROPDOWN --- */}
              </div>
            )}
          </div>

          {/* MOBILE NAVIGATION */}
          <div className="mobile-only mobile-nav-container" style={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginLeft: 'auto'
          }}>
            <button
              onClick={() => setLocation && setLocation(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                background: location && !location.denied ? '#f0f9ff' : '#fef3c7',
                border: location && !location.denied ? '1px solid #bae6fd' : '1px solid #fde68a',
                borderRadius: '50%',
                cursor: 'pointer',
                color: location && !location.denied ? '#0891b2' : '#d97706',
                flexShrink: 0
              }}
            >
              <MapPin size={18} />
            </button>
            
            {!user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                data-testid="login-button-mobile"
                onClick={() => showAuth()}
                className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Login
              </motion.button>
            ) : (
              <div className="relative" ref={mobileMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-slate-200 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </motion.button>

                {isMobileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 z-50">
                    {user.role === 'customer' && (
                      <>
                        <MenuItem icon={Calendar} label="My Bookings" onClick={() => navigate('/bookings')} />
                        <MenuItem icon={FileText} label="My Invoices" onClick={() => navigate('/invoices')} />
                        <MenuItem icon={Wallet} label="Wallet" onClick={() => navigate('/wallet')} />
                        <MenuItem icon={User} label="Profile" onClick={() => navigate('/profile')} />
                        <div className="h-px bg-slate-100 my-1" />
                        <MenuItem icon={LayoutDashboard} label="Become a Partner" onClick={() => navigate('/partner-landing')} className="text-emerald-500" />
                      </>
                    )}
                    
                    {user.role === 'partner_owner' && (
                      <>
                        <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/partner/dashboard')} />
                        <MenuItem icon={UserCircle} label="My Profile" onClick={() => navigate('/partner/profile')} />
                        <MenuItem icon={Wallet} label="Financials" onClick={() => navigate('/partner/financials')} />
                      </>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/admin')} />
                        <MenuItem icon={TrendingUp} label="Analytics" onClick={() => navigate('/admin/analytics')} />
                      </>
                    )}
                    
                    <div className="h-px bg-slate-100 my-1" />
                    
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-md">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;