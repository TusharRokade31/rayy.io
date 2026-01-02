import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  TrendingUp, Package, Calendar, DollarSign, Users, 
  Star, ArrowRight, Plus, Eye, CheckCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const MobilePartnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    avgRating: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      
      // Fetch partner stats and recent bookings
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/partners/my/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: {} })),
        axios.get(`${API}/partner/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);
      
      // Parse stats from API response
      const apiStats = statsRes.data || {};
      setStats({
        totalListings: apiStats.total_listings || 0,
        activeListings: apiStats.active_listings || 0,
        totalBookings: apiStats.total_bookings || 0,
        pendingBookings: apiStats.pending_bookings || 0,
        totalRevenue: apiStats.total_revenue || 0,
        avgRating: apiStats.avg_rating || 0
      });
      
      // Get recent bookings (take first 5)
      const allBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      setRecentBookings(allBookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default values on error
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        avgRating: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Package,
      label: 'Active Listings',
      value: stats.activeListings,
      total: stats.totalListings,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      icon: Calendar,
      label: 'Pending Bookings',
      value: stats.pendingBookings,
      total: stats.totalBookings,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    {
      icon: DollarSign,
      label: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      icon: Star,
      label: 'Avg Rating',
      value: stats.avgRating.toFixed(1),
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    }
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'Create Listing',
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/mobile/partner/listings/create')
    },
    {
      icon: Calendar,
      label: 'View Bookings',
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/mobile/partner/bookings')
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/mobile/partner/analytics')
    },
    {
      icon: Package,
      label: 'My Listings',
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/mobile/partner/listings')
    }
  ];

  return (
    <MobilePartnerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <MagicHeader
          title="Partner Dashboard"
          subtitle={`Welcome back, ${user?.name || 'Partner'}`}
          gradient="from-purple-500 via-pink-500 to-red-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <GlassCard key={stat.label} delay={0.1 * index}>
                  <div className={`bg-gradient-to-br ${stat.bgColor} rounded-xl p-4`}>
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stat.label}
                      {stat.total && ` / ${stat.total}`}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.action}
                    whileTap={{ scale: 0.95 }}
                    className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 text-white shadow-lg`}
                  >
                    <Icon className="w-8 h-8 mb-2" />
                    <div className="text-sm font-semibold text-left">{action.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
              <button
                onClick={() => navigate('/mobile/partner/bookings')}
                className="text-sm text-purple-600 font-semibold flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.slice(0, 5).map((booking, index) => (
                  <GlassCard key={booking.id} delay={0.1 * index}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {booking.listing_title || 'Booking'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {booking.customer_name || 'Customer'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          ₹{booking.amount}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent bookings</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </MobilePartnerLayout>
  );
};

export default MobilePartnerDashboard;