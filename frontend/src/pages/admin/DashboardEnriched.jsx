import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { TrendingUp, Users, Package, DollarSign, Calendar, Clock, Building2, BookOpen, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardEnriched = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard-enriched" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Admin Navigation Menu */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
            }}
          >
            <TrendingUp size={18} />
            Dashboard
          </button>
          
          <button
            onClick={() => navigate('/admin/bookings')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <BookOpen size={18} />
            Bookings
          </button>
          
          <button
            onClick={() => navigate('/admin/partners')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Building2 size={18} />
            Partners
          </button>
          
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Users size={18} />
            Users
          </button>

          <button
            onClick={() => navigate('/admin/create-listing')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Plus size={18} />
            Create Listing
          </button>

          <button
            onClick={() => navigate('/admin/config')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Settings size={18} />
            Config
          </button>
        </div>
        
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          marginBottom: '3rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Admin Dashboard</h1>

        {stats && (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                borderRadius: '20px',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
              }}>
                <Calendar size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {stats.today_bookings}
                </div>
                <div style={{ fontSize: '15px', opacity: 0.9 }}>Today's Bookings</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '20px',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
              }}>
                <DollarSign size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '0.5rem' }}>
                  ₹{stats.today_revenue_inr?.toFixed(0) || 0}
                </div>
                <div style={{ fontSize: '15px', opacity: 0.9 }}>Today's Revenue</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '20px',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
              }}>
                <Package size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {stats.credits_used_today}
                </div>
                <div style={{ fontSize: '15px', opacity: 0.9 }}>Credits Used</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '20px',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}>
                <TrendingUp size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {stats.attendance_rate}%
                </div>
                <div style={{ fontSize: '15px', opacity: 0.9 }}>Attendance Rate</div>
              </div>
            </div>

            {/* Top Listings */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: '#1e293b'
              }}>Top 5 Listings Today</h2>
              
              {stats.top_listings && stats.top_listings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stats.top_listings.map((listing, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700'
                        }}>{idx + 1}</div>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                          {listing.title}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#06b6d4'
                      }}>{listing.bookings} bookings</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>No bookings today</p>
              )}
            </div>

            {/* Last 7 Days Chart (Sparkline) */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: '#1e293b'
              }}>Last 7 Days Bookings</h2>
              
              {stats.last_7_days && (
                <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem', height: '100px' }}>
                  {stats.last_7_days.map((day, idx) => {
                    const maxCount = Math.max(...stats.last_7_days.map(d => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: `${height}%`,
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          borderRadius: '4px',
                          transition: 'height 0.3s'
                        }} />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardEnriched;
