import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { Wallet, Calendar, User, TrendingUp, BookOpen, Award, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AccountDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recommendedClasses, setRecommendedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch wallet
      const walletRes = await axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(walletRes.data.wallet);

      // Fetch upcoming bookings
      const bookingsRes = await axios.get(`${API}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const upcoming = bookingsRes.data.bookings
        .filter(b => b.booking_status === 'confirmed')
        .slice(0, 3);
      setUpcomingBookings(upcoming);

      // Fetch recommended classes
      const classesRes = await axios.get(`${API}/search?limit=4`);
      setRecommendedClasses(classesRes.data.listings || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    let completion = 0;
    if (user?.name) completion += 20;
    if (user?.email) completion += 20;
    if (user?.child_profiles?.length > 0) completion += 30;
    if (user?.preferences?.interests?.length > 0) completion += 20;
    if (user?.preferences?.location || user?.preferences?.city) completion += 10;
    return completion;
  };

  const profileCompletion = calculateProfileCompletion();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '0.5rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>
            Here's what's happening with your account
          </p>
        </div>

        {/* Top Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Credit Balance Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '2rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%'
            }} />
            <Wallet size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Credit Balance
            </div>
            <div style={{ fontSize: '40px', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              {wallet?.credits_balance || 0}
            </div>
            <button
              onClick={() => navigate('/wallet')}
              style={{
                marginTop: '1rem',
                padding: '0.625rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                backdropFilter: 'blur(10px)'
              }}
            >
              Buy Credits
            </button>
          </div>

          {/* Profile Completion Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <User size={28} style={{ color: '#3B82F6', marginBottom: '1rem' }} />
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Profile Completion
            </div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${profileCompletion}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B82F6 0%, #10b981 100%)',
                  borderRadius: '10px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              {profileCompletion}%
            </div>
            {profileCompletion < 100 && (
              <button
                onClick={() => navigate('/profile')}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                Complete Profile
              </button>
            )}
          </div>

          {/* Quick Stats Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <Calendar size={28} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Upcoming Sessions
            </div>
            <div style={{
              fontSize: '40px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              {upcomingBookings.length}
            </div>
            <button
              onClick={() => navigate('/bookings')}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              View All
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '1.5rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <BookOpen size={20} />
              Browse Classes
            </button>

            <button
              onClick={() => navigate('/wallet')}
              style={{
                padding: '1.25rem',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                color: '#1e293b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <Wallet size={20} />
              Add Credits
            </button>

            <button
              onClick={() => navigate('/bookings')}
              style={{
                padding: '1.25rem',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                color: '#1e293b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <Calendar size={20} />
              My Bookings
            </button>

            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '1.25rem',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                color: '#1e293b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <User size={20} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Recommended Classes */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '0.25rem',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles size={24} color="#FBBF24" />
                Recommended for You
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                Classes based on your interests
              </p>
            </div>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'transparent',
                border: '2px solid #3B82F6',
                borderRadius: '10px',
                color: '#3B82F6',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {recommendedClasses.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '100%',
                  height: '180px',
                  backgroundImage: listing.media?.[0] 
                    ? `url(${listing.media[0]})` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '1.25rem' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {listing.title}
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '0.75rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {listing.category}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#3B82F6',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      ₹{listing.trial_price_inr || listing.base_price_inr}
                    </span>
                    {listing.trial_available && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#10b981',
                        background: '#d1fae5',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px'
                      }}>
                        Trial
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AccountDashboard;
