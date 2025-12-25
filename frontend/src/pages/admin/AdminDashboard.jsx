import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import '../../styles/admin-responsive.css';
import { 
  TrendingUp, TrendingDown, Users, Building2, Calendar, IndianRupee,
  DollarSign, Activity, AlertCircle, CheckCircle, Clock, ArrowUpRight,
  ArrowDownRight, Zap, Target, Award, ShoppingBag, CreditCard, UserCheck,
  RefreshCw, Download, Filter, Eye
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { toast } from 'sonner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [metrics, setMetrics] = useState({
    revenue: {
      today: 0,
      week: 0,
      month: 0,
      lifetime: 0,
      growth: 0,
      commission: 0
    },
    users: {
      totalCustomers: 0,
      totalPartners: 0,
      newCustomers: 0,
      newPartners: 0,
      activeCustomers: 0,
      customerGrowth: 0
    },
    bookings: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      conversionRate: 0,
      avgValue: 0
    },
    financial: {
      totalCommission: 0,
      pendingPayouts: 0,
      processedPayouts: 0,
      unpaidCommission: 0
    },
    business: {
      cac: 0, // Customer Acquisition Cost
      ltv: 0, // Lifetime Value
      churnRate: 0,
      repeatRate: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, [dateRange]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      // Fetch all necessary data in parallel
      const [
        usersRes,
        partnersRes,
        bookingsRes,
        financialsRes
      ] = await Promise.all([
        axios.get(`${API}/admin/users?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/partners?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/bookings?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/financials/summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // Process data
      const customers = usersRes.data.users?.filter(u => u.role === 'customer') || [];
      const partners = partnersRes.data.partners || [];
      const bookings = bookingsRes.data.bookings || [];
      
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
      const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Calculate revenue metrics
      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.booked_at);
        return bookingDate.toDateString() === now.toDateString();
      });
      const weekBookings = bookings.filter(b => new Date(b.booked_at) >= weekAgo);
      const monthBookings = bookings.filter(b => new Date(b.booked_at) >= monthAgo);

      const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const lifetimeRevenue = bookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);

      // Commission (assume 10% platform fee)
      const totalCommission = lifetimeRevenue * 0.1;
      const unpaidCommission = totalCommission * 0.3; // 30% pending

      // Customer metrics
      const newCustomers = customers.filter(c => new Date(c.created_at) >= monthAgo).length;
      const activeCustomers = customers.filter(c => {
        const hasRecentBooking = bookings.some(b => 
          (b.user_id === c.id || b.customer_id === c.id) && 
          new Date(b.booked_at) >= monthAgo
        );
        return hasRecentBooking;
      }).length;

      // Partner metrics
      const newPartners = partners.filter(p => new Date(p.created_at) >= monthAgo).length;

      // Booking metrics
      const pending = bookings.filter(b => b.booking_status === 'pending').length;
      const confirmed = bookings.filter(b => b.booking_status === 'confirmed').length;
      const completed = bookings.filter(b => b.booking_status === 'completed').length;
      const cancelled = bookings.filter(b => b.booking_status === 'cancelled').length;

      const conversionRate = bookings.length > 0 
        ? ((confirmed + completed) / bookings.length * 100).toFixed(1)
        : 0;
      
      const avgBookingValue = bookings.length > 0
        ? lifetimeRevenue / bookings.length
        : 0;

      // Business health metrics
      const customerLTV = customers.length > 0
        ? lifetimeRevenue / customers.length
        : 0;

      const repeatCustomers = customers.filter(c => {
        const customerBookings = bookings.filter(b => 
          (b.user_id === c.id || b.customer_id === c.id)
        );
        return customerBookings.length > 1;
      }).length;

      const repeatRate = customers.length > 0
        ? (repeatCustomers / customers.length * 100).toFixed(1)
        : 0;

      // Category revenue breakdown
      const revenueByCategory = {};
      bookings.forEach(b => {
        const category = b.listing_category || 'Other';
        revenueByCategory[category] = (revenueByCategory[category] || 0) + (b.total_inr || 0);
      });

      const categoryData = Object.entries(revenueByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, revenue]) => ({ category, revenue }));

      // Recent activity (last 10 bookings)
      const recentBookings = bookings
        .sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at))
        .slice(0, 10)
        .map(b => ({
          type: 'booking',
          description: `${b.customer_name || 'Customer'} booked ${b.listing_title || 'class'}`,
          amount: b.total_inr,
          time: new Date(b.booked_at).toLocaleString(),
          status: b.booking_status
        }));

      setMetrics({
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          lifetime: lifetimeRevenue,
          growth: 15.5, // Mock for now
          commission: totalCommission
        },
        users: {
          totalCustomers: customers.length,
          totalPartners: partners.length,
          newCustomers,
          newPartners,
          activeCustomers,
          customerGrowth: 12.3 // Mock
        },
        bookings: {
          total: bookings.length,
          pending,
          confirmed,
          completed,
          cancelled,
          conversionRate,
          avgValue: avgBookingValue
        },
        financial: {
          totalCommission,
          pendingPayouts: financialsRes.data?.pending_payouts || 0,
          processedPayouts: financialsRes.data?.processed_payouts || 0,
          unpaidCommission
        },
        business: {
          cac: 250, // Mock - would calculate from marketing spend
          ltv: customerLTV,
          churnRate: 8.5, // Mock
          repeatRate
        }
      });

      setRecentActivity(recentBookings);
      setCategoryRevenue(categoryData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color, prefix = '', onClick }) => (
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
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={26} color={color} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '15px',
            fontWeight: '700',
            color: trend >= 0 ? '#10b981' : '#ef4444',
            background: trend >= 0 ? '#10b98115' : '#ef444415',
            padding: '0.375rem 0.75rem',
            borderRadius: '20px'
          }}>
            {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '0.625rem', fontFamily: 'Outfit, sans-serif', fontWeight: '500' }}>
        {title}
      </div>
      <div style={{ fontSize: '34px', fontWeight: '900', color: '#1e293b', marginBottom: '0.375rem', fontFamily: 'Outfit, sans-serif' }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '14px', color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const revenueChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Customer Revenue',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 72000],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Commission',
        data: [4500, 5200, 4800, 6100, 5500, 6700, 7200],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const categoryChartData = {
    labels: categoryRevenue.map(c => c.category),
    datasets: [{
      data: categoryRevenue.map(c => c.revenue),
      backgroundColor: [
        '#3B82F6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ec4899'
      ]
    }]
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '16px', fontWeight: '600' }}>
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div className="admin-dashboard" style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Super Admin Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: '500' }}>
              Complete business intelligence & control center
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                background: 'white',
                fontSize: '15px',
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
              onClick={fetchAdminData}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Top Metrics - Revenue */}
        <div className="metrics-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <MetricCard
            icon={IndianRupee}
            title="Today's Revenue"
            value={Math.round(metrics.revenue.today)}
            prefix="₹"
            subtitle="Live tracking"
            color="#3B82F6"
            trend={8.5}
          />
          <MetricCard
            icon={TrendingUp}
            title="Monthly Revenue"
            value={Math.round(metrics.revenue.month)}
            prefix="₹"
            subtitle="Last 30 days"
            color="#10b981"
            trend={metrics.revenue.growth}
          />
          <MetricCard
            icon={DollarSign}
            title="Platform Commission"
            value={Math.round(metrics.revenue.commission)}
            prefix="₹"
            subtitle="Total earned"
            color="#f59e0b"
            trend={12.3}
          />
          <MetricCard
            icon={Award}
            title="Lifetime Revenue"
            value={Math.round(metrics.revenue.lifetime)}
            prefix="₹"
            subtitle="All time"
            color="#8b5cf6"
          />
        </div>

        {/* User Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <MetricCard
            icon={Users}
            title="Total Customers"
            value={metrics.users.totalCustomers}
            subtitle={`${metrics.users.newCustomers} new this month`}
            color="#3B82F6"
            trend={metrics.users.customerGrowth}
            onClick={() => navigate('/admin/users')}
          />
          <MetricCard
            icon={Building2}
            title="Total Partners"
            value={metrics.users.totalPartners}
            subtitle={`${metrics.users.newPartners} new this month`}
            color="#10b981"
            onClick={() => navigate('/admin/partners')}
          />
          <MetricCard
            icon={UserCheck}
            title="Active Customers"
            value={metrics.users.activeCustomers}
            subtitle="Active in last 30 days"
            color="#8b5cf6"
            trend={5.2}
          />
          <MetricCard
            icon={Target}
            title="Repeat Rate"
            value={`${metrics.business.repeatRate}%`}
            subtitle="Customer retention"
            color="#f59e0b"
            trend={3.1}
          />
        </div>

        {/* Revenue Chart */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              Revenue Trend (7 Days)
            </h3>
            <button
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
          <div style={{ height: '320px' }}>
            <Line 
              data={revenueChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { font: { size: 13, weight: '600' } }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => `₹${value.toLocaleString()}` }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Bottom Section - Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Booking Metrics */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Booking Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Total Bookings
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  {metrics.bookings.total}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: '#3B82F615', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#1e5a99', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Confirmed
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                  {metrics.bookings.confirmed}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: '#10b98115', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#065f46', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Completed
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                  {metrics.bookings.completed}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: '#f59e0b15', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Avg. Value
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{Math.round(metrics.bookings.avgValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Category Revenue */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
              By Category
            </h3>
            <div style={{ height: '200px' }}>
              {categoryRevenue.length > 0 && (
                <Doughnut 
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { font: { size: 11 } } }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              Recent Activity
            </h3>
            <button
              onClick={() => navigate('/admin/bookings')}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'transparent',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.slice(0, 8).map((activity, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem 1.25rem',
                  background: '#f8fafc',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '4px solid #3B82F6'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
                    {activity.description}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {activity.time}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                    ₹{activity.amount?.toFixed(0)}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '20px',
                    background: activity.status === 'confirmed' ? '#10b98115' : '#f59e0b15',
                    color: activity.status === 'confirmed' ? '#10b981' : '#f59e0b'
                  }}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          <button
            onClick={() => navigate('/admin/financials')}
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '20px',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
            }}
          >
            <DollarSign size={28} />
            Financial Center
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '1.5rem',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              color: '#1e293b',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <Users size={28} color="#3B82F6" />
            User Management
          </button>

          <button
            onClick={() => navigate('/admin/partners')}
            style={{
              padding: '1.5rem',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              color: '#1e293b',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <Building2 size={28} color="#10b981" />
            Partner Management
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            style={{
              padding: '1.5rem',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              color: '#1e293b',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <Activity size={28} color="#f59e0b" />
            Advanced Analytics
          </button>
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

export default AdminDashboard;
