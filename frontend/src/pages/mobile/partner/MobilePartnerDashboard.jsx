import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import PartnerOnboardingWizard from '../../../components/PartnerOnboardingWizard';
import { 
  TrendingUp, Package, Calendar, DollarSign, Users, 
  Star, ArrowRight, Plus, Eye, CheckCircle, Clock, 
  AlertTriangle, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const MobilePartnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State for Wizard Visibility
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // State for KYC Status
  const [kycStatus, setKycStatus] = useState('unverified'); 

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
      
      // FETCH PARTNER DATA ALONGSIDE STATS AND BOOKINGS
      const [statsRes, bookingsRes, partnerRes] = await Promise.all([
        axios.get(`${API}/partners/my/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: {} })),
        axios.get(`${API}/partner/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        // Added this call to get accurate KYC status from partner profile
        axios.get(`${API}/partners/my`, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: null }))
      ]);
      
      const apiStats = statsRes.data || {};
      const partnerData = partnerRes.data;
      
      // Update stats
      setStats({
        totalListings: apiStats.total_listings || 0,
        activeListings: apiStats.active_listings || 0,
        totalBookings: apiStats.total_bookings || 0,
        pendingBookings: apiStats.pending_bookings || 0,
        totalRevenue: apiStats.total_revenue || 0,
        avgRating: apiStats.avg_rating || 0
      });

      // SET KYC STATUS FROM PARTNER DATA
      if (partnerData && partnerData.kyc_status) {
        setKycStatus(partnerData.kyc_status);
      } else {
        // Fallback if partner profile doesn't exist or status is missing
        setKycStatus('unverified');
      }
      
      const allBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      setRecentBookings(allBookings.slice(0, 5));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Callback when wizard completes
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchDashboardData(); // Refresh data to update status to 'pending' or 'verified'
    toast.success("KYC Submitted Successfully");
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
      action: () => navigate('/partner/listings/create')
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
      action: () => navigate('/partner/analytics')
    },
    {
      icon: Package,
      label: 'My Listings',
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/partner/listings')
    }
  ];

  return (
    <MobilePartnerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        
        {/* Mobile Header */}
        <div className="md:hidden">
            <MagicHeader
            title="Partner Dashboard"
            subtitle={`Welcome back, ${user?.name || 'Partner'}`}
            gradient="from-purple-500 via-pink-500 to-red-500"
            />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-100 px-8 py-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user?.name || 'Partner'}</p>
                </div>
                <div className="flex gap-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        Partner Account
                    </span>
                </div>
            </div>
        </div>

        {/* Main Content Container */}
        <div className="px-4 pb-24 mt-10 md:mt-0 md:p-8 max-w-7xl mx-auto">

          {/* --- KYC VERIFICATION BANNER --- */}
          {kycStatus === 'unverified' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div 
                onClick={() => setShowOnboarding(true)}
                className="bg-gradient-to-r rounded-xl p-1 shadow-lg cursor-pointer transform transition-transform active:scale-95"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Account Not Verified</h3>
                      <p className="text-xs text-gray-600">Complete KYC to accept bookings & withdraw earnings.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          )}

           {/* --- PENDING STATUS BANNER --- */}
           {kycStatus === 'pending' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Verification Pending</h3>
                <p className="text-xs text-blue-700">We are reviewing your documents. This usually takes 24 hours.</p>
              </div>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            {/* ... (Existing Stat Cards Code) ... */}
            {statCards.map((stat, index) => {
               const Icon = stat.icon;
               return (
                 <GlassCard key={stat.label} delay={0.1 * index} className="h-full">
                   <div className={`bg-gradient-to-br ${stat.bgColor} rounded-xl p-4 md:p-6 h-full transition-all hover:shadow-md`}>
                     <div className="flex items-center justify-between mb-3">
                         <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                         <Icon className="w-5 h-5 text-white" />
                         </div>
                         {stat.total && (
                              <span className="text-xs font-medium text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                                 Total: {stat.total}
                              </span>
                         )}
                     </div>
                     <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                       {stat.value}
                     </div>
                     <div className="text-xs md:text-sm text-gray-600 font-medium">
                       {stat.label}
                     </div>
                   </div>
                 </GlassCard>
               );
             })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Bookings) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Quick Actions (Mobile) */}
                <div className="lg:hidden mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                        <motion.button
                            key={action.label}
                            onClick={action.action}
                            whileTap={{ scale: 0.95 }}
                            className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 text-white shadow-lg flex flex-col items-center justify-center text-center h-24`}
                        >
                            <Icon className="w-8 h-8 mb-2" />
                            <div className="text-sm font-semibold">{action.label}</div>
                        </motion.button>
                        );
                    })}
                    </div>
                </div>

                {/* Recent Bookings Section (Existing Code) */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Recent Bookings</h2>
                        <button
                            onClick={() => navigate('/mobile/partner/bookings')}
                            className="text-sm text-purple-600 font-semibold flex items-center gap-1 hover:text-purple-700 transition-colors"
                        >
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                    </div>
                    ) : recentBookings.length > 0 ? (
                    <div className="space-y-3">
                        {recentBookings.map((booking, index) => (
                        <GlassCard key={booking.id} delay={0.1 * index}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/40 transition-colors rounded-xl">
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1 text-base">
                                {booking.listing_title || 'Booking'}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {booking.customer_name || 'Customer'}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(booking.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                                }`}>
                                {booking.status}
                                </div>
                                <div className="text-base font-bold text-gray-900">
                                ₹{booking.amount}
                                </div>
                            </div>
                            </div>
                        </GlassCard>
                        ))}
                    </div>
                    ) : (
                    <GlassCard>
                        <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No recent bookings found</p>
                        </div>
                    </GlassCard>
                    )}
                </div>
            </div>

            {/* Right Column (Quick Actions Desktop - Existing Code) */}
            <div className="hidden lg:block space-y-6">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                            <motion.button
                                key={action.label}
                                onClick={action.action}
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-gradient-to-br ${action.color} rounded-xl p-4 text-white shadow-lg flex flex-col items-center justify-center text-center aspect-square`}
                            >
                                <Icon className="w-8 h-8 mb-3" />
                                <div className="text-sm font-semibold leading-tight">{action.label}</div>
                            </motion.button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold">Pro Tip</h3>
                    </div>
                    <p className="text-sm text-purple-100 leading-relaxed mb-4">
                        Complete your listing details to increase visibility by up to 40%.
                    </p>
                    <button 
                        onClick={() => navigate('/partner/listings')}
                        className="w-full py-2 bg-white text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors"
                    >
                        Manage Listings
                    </button>
                </div>
            </div>

          </div>
        </div>

        {/* --- KYC WIZARD MODAL --- */}
        <AnimatePresence>
          {showOnboarding && (
            <PartnerOnboardingWizard 
              onClose={() => setShowOnboarding(false)}
              onComplete={handleOnboardingComplete}
            />
          )}
        </AnimatePresence>
        
      </div>
    </MobilePartnerLayout>
  );
};

export default MobilePartnerDashboard;