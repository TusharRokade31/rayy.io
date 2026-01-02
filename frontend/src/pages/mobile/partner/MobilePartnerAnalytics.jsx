import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  TrendingUp, TrendingDown, Eye, Users, DollarSign, 
  Star, Calendar, Package, BarChart3
} from 'lucide-react';

const MobilePartnerAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalViews: 0,
    avgRating: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
    topListings: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      
      // Use existing stats endpoint and mock analytics for now
      const response = await axios.get(`${API}/partners/my/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: {} }));
      
      const apiData = response.data || {};
      setAnalytics({
        totalRevenue: apiData.total_revenue || 0,
        totalBookings: apiData.total_bookings || 0,
        totalViews: apiData.total_views || 0,
        avgRating: apiData.avg_rating || 0,
        revenueGrowth: apiData.revenue_growth || 0,
        bookingGrowth: apiData.booking_growth || 0,
        topListings: apiData.top_listings || [],
        recentActivity: apiData.recent_activity || []
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ];

  const statCards = [
    {
      icon: DollarSign,
      label: 'Revenue',
      value: `₹${analytics.totalRevenue.toLocaleString()}`,
      growth: analytics.revenueGrowth,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      icon: Calendar,
      label: 'Bookings',
      value: analytics.totalBookings,
      growth: analytics.bookingGrowth,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    {
      icon: Eye,
      label: 'Total Views',
      value: analytics.totalViews,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      icon: Star,
      label: 'Avg Rating',
      value: analytics.avgRating.toFixed(1),
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    }
  ];

  return (
    <MobilePartnerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
        <MagicHeader
          title="Analytics"
          subtitle="Track your performance"
          gradient="from-green-500 via-emerald-500 to-teal-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {timeRangeOptions.map(option => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(option.value)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                  timeRange === option.value
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
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
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600">
                            {stat.label}
                          </div>
                          {stat.growth !== undefined && (
                            <div className={`flex items-center gap-1 text-xs font-semibold ${
                              stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.growth >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(stat.growth)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Top Performing Listings */}
              {analytics.topListings && analytics.topListings.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Top Performing Listings</h2>
                  <div className="space-y-3">
                    {analytics.topListings.map((listing, index) => (
                      <GlassCard key={listing.id} delay={0.1 * index}>
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate mb-1">
                              {listing.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {listing.bookings} bookings
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ₹{listing.revenue}
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Coming Soon: Charts */}
              <GlassCard>
                <div className="p-6 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Detailed Charts Coming Soon</h3>
                  <p className="text-sm text-gray-600">
                    We&apos;re working on advanced analytics with interactive charts and insights.
                  </p>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </MobilePartnerLayout>
  );
};

export default MobilePartnerAnalytics;