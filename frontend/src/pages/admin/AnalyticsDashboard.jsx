import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Calendar, Award,
  RefreshCw, Download, ArrowUp, ArrowDown
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const { token } = useContext(AuthContext);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Analytics data states
  const [overview, setOverview] = useState(null);
  const [partnerPerformance, setPartnerPerformance] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [bookings, setBookings] = useState(null);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchAllAnalytics();
    
    const interval = setInterval(() => {
      fetchAllAnalytics();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, partnerRes, financialRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/analytics/overview?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/analytics/partner-performance?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/analytics/financial?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/analytics/bookings?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOverview(overviewRes.data);
      setPartnerPerformance(partnerRes.data);
      setFinancial(financialRes.data);
      setBookings(bookingsRes.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: `2px solid ${color}20`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={28} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: trend >= 0 ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1e293b',
          fontFamily: 'Space Grotesk, sans-serif'
        }}>
          {value}
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.25rem' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.5rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              Advanced Analytics
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 5 minutes
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchAllAnalytics}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#06b6d4',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <StatCard
                icon={Calendar}
                title="Total Bookings"
                value={overview.bookings_in_period}
                subtitle={`${overview.period} period`}
                color="#06b6d4"
                trend={overview.booking_growth}
              />
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`₹${overview.total_revenue?.toLocaleString()}`}
                subtitle={`Avg: ₹${overview.avg_booking_value?.toFixed(0)}`}
                color="#10b981"
              />
              <StatCard
                icon={Users}
                title="Active Partners"
                value={`${overview.active_partners}/${overview.total_partners}`}
                subtitle={`${overview.total_listings} active listings`}
                color="#8b5cf6"
              />
              <StatCard
                icon={Users}
                title="Total Customers"
                value={overview.total_customers}
                subtitle={`${overview.total_credits_used} credits used`}
                color="#f59e0b"
              />
            </div>

            {/* Charts Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Revenue Over Time */}
              {financial && financial.revenue_over_time && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '1.5rem',
                    color: '#1e293b'
                  }}>
                    Revenue Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financial.revenue_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="_id" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{
                          background: 'white',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Revenue (₹)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        name="Bookings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bookings Status Breakdown */}
              {bookings && bookings.status_breakdown && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '1.5rem',
                    color: '#1e293b'
                  }}>
                    Booking Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bookings.status_breakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ _id, count }) => `${_id}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="_id"
                      >
                        {bookings.status_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Revenue by Category */}
            {financial && financial.revenue_by_category && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: '#1e293b'
                }}>
                  Revenue by Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financial.revenue_by_category}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="_id" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                    <Bar dataKey="bookings" fill="#06b6d4" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Partners Table */}
            {partnerPerformance && partnerPerformance.partners && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: '#1e293b'
                }}>
                  Top Performing Partners
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Partner
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Active Listings
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Total Bookings
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Total Revenue
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Avg Booking Value
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Badges
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerPerformance.partners.map((partner, index) => (
                        <tr key={index} style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.2s'
                        }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {partner.partner_name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {partner.partner_email}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                            {partner.active_listings}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#06b6d4' }}>
                            {partner.total_bookings}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                            ₹{partner.total_revenue?.toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                            ₹{partner.avg_booking_value?.toFixed(0)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {partner.badges && partner.badges.length > 0 ? (
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                {partner.badges.map((badge, i) => (
                                  <Award key={i} size={16} style={{ color: '#f59e0b' }} />
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Listings */}
            {bookings && bookings.top_listings && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: '#1e293b'
                }}>
                  Top Listings by Bookings
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Rank
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Listing
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Category
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Bookings
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.top_listings.map((listing, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: '700', color: '#94a3b8' }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>
                            {listing.listing_title || 'Unknown'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {listing.category}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#06b6d4' }}>
                            {listing.bookings}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                            ₹{listing.revenue?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {loading && !overview && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <RefreshCw size={24} className="spin" />
              Loading analytics...
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        table tbody tr:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
