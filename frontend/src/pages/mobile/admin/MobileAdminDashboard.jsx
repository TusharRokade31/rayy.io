import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobileAdminLayout from '../../../layouts/MobileAdminLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  Users, Building2, Package, Calendar, DollarSign, 
  TrendingUp, ArrowRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const MobileAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPartners: 0,
    totalListings: 0,
    pendingApprovals: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      
      const [statsRes, activityRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/activity/recent`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('Fetched dashboard stats:', statsRes);
      console.log('Fetched recent activity:', activityRes);
      
      setStats(statsRes.data || stats);
      setRecentActivity(activityRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);  
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      action: () => navigate('/mobile/admin/users')
    },
    {
      icon: Building2,
      label: 'Partners',
      value: stats.totalPartners,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      action: () => navigate('/mobile/admin/partners')
    },
    {
      icon: Package,
      label: 'Listings',
      value: stats.totalListings,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      action: () => navigate('/mobile/admin/listings')
    },
    {
      icon: AlertCircle,
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      color: 'from-orange-400 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      action: () => navigate('/mobile/admin/listings')
    },
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: stats.totalBookings,
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50'
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      color: 'from-green-500 to-teal-500',
      bgColor: 'from-green-50 to-teal-50'
    }
  ];

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="Admin Dashboard"
          subtitle={`Welcome back, ${user?.name || 'Admin'}`}
          gradient="from-blue-500 via-cyan-500 to-teal-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Alert for Pending Approvals */}
          {stats.pendingApprovals > 0 && (
            <GlassCard delay={0}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/mobile/admin/listings')}
                className="w-full p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900 mb-1">
                    {stats.pendingApprovals} Pending Approvals
                  </div>
                  <div className="text-sm text-gray-600">
                    Review and approve listings
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            </GlassCard>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <GlassCard key={stat.label} delay={0.1 * index}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={stat.action}
                    disabled={!stat.action}
                    className={`w-full bg-gradient-to-br ${stat.bgColor} rounded-xl p-4 text-left`}
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stat.label}
                    </div>
                  </motion.button>
                </GlassCard>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Recent Activity</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <GlassCard key={index} delay={0.1 * index}>
                    <div className="p-4">
                      <div className="font-medium text-gray-900 mb-1">
                        {activity.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </MobileAdminLayout>
  );
};

export default MobileAdminDashboard;