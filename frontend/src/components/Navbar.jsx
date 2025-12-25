import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { User, UserCircle, Wallet, Calendar, LogOut, LayoutDashboard, MapPin, TrendingUp, Award, FileText, Building2 } from 'lucide-react';
import axios from 'axios';

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
          <Link 
            to="/" 
            data-testid="logo-link" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                setTimeout(() => window.location.reload(), 100);
              } else {
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }
            }}
            style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'Outfit, sans-serif',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>R</span>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <span style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#1e293b',
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.5px',
                lineHeight: '1'
              }} className="rrray-logo">rayy</span>
              <span className="desktop-only" style={{
                fontSize: '10px',
                fontWeight: '500',
                color: '#64748B',
                letterSpacing: '1px',
                fontFamily: 'Outfit, sans-serif'
              }}>Learn • Play • Shine</span>
            </div>
          </Link>

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
              <button 
                data-testid="login-button"
                onClick={() => showAuth()}
                className="btn-scale"
                style={{
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  color: 'white',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  fontSize: '15px',
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Login / Sign Up
              </button>
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
                
                {/* --- CUSTOM DESKTOP DROPDOWN --- */}
                <div className="relative" ref={desktopMenuRef}>
                  <button 
                    data-testid="user-menu-trigger"
                    onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transition: 'background 0.2s',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <User size={20} />
                    <span style={{ fontWeight: '600' }}>{user.name}</span>
                  </button>

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
              <button 
                data-testid="login-button-mobile"
                onClick={() => showAuth()}
                style={{
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  fontFamily: 'Outfit, sans-serif',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={mobileMenuRef}>
                <button 
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: 'none'
                  }}
                >
                  <User size={18} />
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{user.name?.split(' ')[0]}</span>
                </button>

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