import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { 
  TrendingUp, TrendingDown, IndianRupee, Users, Calendar, 
  Award, Clock, Download, ChevronRight, Sparkles, Target,
  DollarSign, UserCheck, UserX, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PartnerAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days
  const [analytics, setAnalytics] = useState({
    revenue: {
      today: 0,
      week: 0,
      month: 0,
      total: 0,
      chart: []
    },
    bookings: {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      trend: []
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0,
      topCustomers: []
    },
    attendance: {
      rate: 0,
      attended: 0,
      noShow: 0,
      trend: []
    },
    listings: {
      topPerforming: []
    },
    financial: {
      pendingPayout: 0,
      nextPayoutDate: null,
      availableBalance: 0,
      lifetimeEarnings: 0
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      // Fetch analytics data - we'll aggregate from existing endpoints
      const [financialRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/partner/financials/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/partner/bookings?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Process bookings data
      const bookings = bookingsRes.data.items || [];
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));

      // Revenue calculations
      const recentBookings = bookings.filter(b => new Date(b.booked_at) >= daysAgo);
      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.booked_at);
        return bookingDate.toDateString() === now.toDateString();
      });
      const weekBookings = bookings.filter(b => {
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        return new Date(b.booked_at) >= weekAgo;
      });

      const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const monthRevenue = recentBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);

      // Booking status counts
      const confirmed = bookings.filter(b => b.booking_status === 'confirmed').length;
      const pending = bookings.filter(b => b.booking_status === 'pending').length;
      const cancelled = bookings.filter(b => b.booking_status === 'cancelled').length;

      // Customer analysis
      const uniqueCustomers = [...new Set(bookings.map(b => b.user_id || b.customer_id))];
      const customerBookingCount = {};
      bookings.forEach(b => {
        const customerId = b.user_id || b.customer_id;
        customerBookingCount[customerId] = (customerBookingCount[customerId] || 0) + 1;
      });

      const newCustomers = uniqueCustomers.filter(cId => customerBookingCount[cId] === 1).length;
      const returningCustomers = uniqueCustomers.length - newCustomers;

      // Top customers
      const topCustomers = Object.entries(customerBookingCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([customerId, count]) => ({
          customerId,
          bookings: count,
          revenue: bookings.filter(b => (b.user_id || b.customer_id) === customerId)
            .reduce((sum, b) => sum + (b.total_inr || 0), 0)
        }));

      // Attendance
      const attendedBookings = bookings.filter(b => b.attendance_status === 'attended').length;
      const noShowBookings = bookings.filter(b => b.attendance_status === 'no_show').length;
      const totalAttendanceMarked = attendedBookings + noShowBookings;
      const attendanceRate = totalAttendanceMarked > 0 
        ? ((attendedBookings / totalAttendanceMarked) * 100).toFixed(1)
        : 0;

      // Top performing listings
      const listingRevenue = {};
      bookings.forEach(b => {
        if (b.listing_id) {
          listingRevenue[b.listing_id] = (listingRevenue[b.listing_id] || 0) + (b.total_inr || 0);
        }
      });

      const topListings = Object.entries(listingRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([listingId, revenue]) => {
          const listingBookings = bookings.filter(b => b.listing_id === listingId);
          return {
            listingId,
            listingTitle: listingBookings[0]?.listing_title || 'Unknown',
            revenue,
            bookings: listingBookings.length
          };
        });

      // Chart data - Revenue over time
      const revenueByDate = {};
      recentBookings.forEach(b => {
        const date = new Date(b.booked_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        revenueByDate[date] = (revenueByDate[date] || 0) + (b.total_inr || 0);
      });

      const chartLabels = Object.keys(revenueByDate).slice(-14); // Last 14 days
      const chartData = chartLabels.map(label => revenueByDate[label] || 0);

      setAnalytics({
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          total: totalRevenue,
          chart: { labels: chartLabels, data: chartData }
        },
        bookings: {
          total: bookings.length,
          confirmed,
          pending,
          cancelled,
          trend: recentBookings.length
        },
        customers: {
          total: uniqueCustomers.length,
          new: newCustomers,
          returning: returningCustomers,
          topCustomers
        },
        attendance: {
          rate: attendanceRate,
          attended: attendedBookings,
          noShow: noShowBookings
        },
        listings: {
          topPerforming: topListings
        },
        financial: {
          pendingPayout: financialRes.data.pending_balance_inr || 0,
          availableBalance: financialRes.data.available_balance_inr || 0,
          lifetimeEarnings: financialRes.data.lifetime_earnings_inr || totalRevenue
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
      setLoading(false);
    }
  };

  const revenueChartData = {
    labels: analytics.revenue.chart.labels || [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analytics.revenue.chart.data || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => `₹${context.parsed.y.toFixed(0)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`
        }
      }
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.75rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '14px',
            fontWeight: '600',
            color: trend > 0 ? '#10b981' : '#ef4444'
          }}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
        {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

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
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Analytics Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>
              Complete overview of your business performance
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                background: 'white',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <button
              onClick={() => navigate('/partner/customers')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Users size={18} />
              View Customers
            </button>
          </div>
        </div>

        {/* Revenue Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            icon={IndianRupee}
            title="Today's Revenue"
            value={`₹${analytics.revenue.today.toFixed(0)}`}
            color="#3B82F6"
          />
          <StatCard
            icon={TrendingUp}
            title="This Week"
            value={`₹${analytics.revenue.week.toFixed(0)}`}
            color="#10b981"
          />
          <StatCard
            icon={DollarSign}
            title="This Month"
            value={`₹${analytics.revenue.month.toFixed(0)}`}
            color="#8b5cf6"
          />
          <StatCard
            icon={Award}
            title="Lifetime Earnings"
            value={`₹${analytics.financial.lifetimeEarnings.toFixed(0)}`}
            subtitle="Total earned"
            color="#f59e0b"
          />
        </div>

        {/* Revenue Chart */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              Revenue Trend
            </h3>
            <button
              onClick={() => toast.success('Export feature coming soon!')}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'transparent',
                border: '2px solid #3B82F6',
                borderRadius: '10px',
                color: '#3B82F6',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            icon={Calendar}
            title="Total Bookings"
            value={analytics.bookings.total}
            subtitle={`${analytics.bookings.confirmed} confirmed`}
            color="#3B82F6"
          />
          <StatCard
            icon={Users}
            title="Total Customers"
            value={analytics.customers.total}
            subtitle={`${analytics.customers.new} new customers`}
            color="#10b981"
            onClick={() => navigate('/partner/customers')}
          />
          <StatCard
            icon={UserCheck}
            title="Attendance Rate"
            value={`${analytics.attendance.rate}%`}
            subtitle={`${analytics.attendance.attended} attended`}
            color="#8b5cf6"
          />
          <StatCard
            icon={Target}
            title="Conversion Rate"
            value={`${analytics.customers.returning > 0 ? ((analytics.customers.returning / analytics.customers.total) * 100).toFixed(0) : 0}%`}
            subtitle="Returning customers"
            color="#f59e0b"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Top Performing Classes */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={24} color="#FBBF24" />
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                Top Performing Classes
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analytics.listings.topPerforming.length > 0 ? (
                analytics.listings.topPerforming.map((listing, index) => (
                  <div
                    key={listing.listingId}
                    style={{
                      padding: '1rem',
                      background: index === 0 ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : '#f8fafc',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: index === 0 ? '#667eea' : '#94a3b8',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          {index + 1}
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                          {listing.listingTitle}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginLeft: '32px' }}>
                        {listing.bookings} bookings
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                      ₹{listing.revenue.toFixed(0)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Financial Summary
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #10b98115 0%, #059b6915 100%)',
                borderRadius: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#064e3b', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                  Available Balance
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{analytics.financial.availableBalance.toFixed(0)}
                </div>
                <button
                  onClick={() => navigate('/partner/financials')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.625rem 1.25rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'Outfit, sans-serif',
                    width: '100%'
                  }}
                >
                  Request Payout
                </button>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>
                  Pending Payout
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{analytics.financial.pendingPayout.toFixed(0)}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>
                  Lifetime Earnings
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{analytics.financial.lifetimeEarnings.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/partner/customers')}
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
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Users size={20} />
              View All Customers
              <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
            </button>

            <button
              onClick={() => navigate('/partner/bookings')}
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
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Calendar size={20} />
              Manage Bookings
            </button>

            <button
              onClick={() => navigate('/partner/financials')}
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
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <DollarSign size={20} />
              Financials
            </button>
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

export default PartnerAnalyticsDashboard;
