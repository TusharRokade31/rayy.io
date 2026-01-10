import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import BookingDetailModal from '../../components/mobile/BookingDetailModal';
import RescheduleModal from '../../components/mobile/RescheduleModal';
import { Calendar, Clock, MapPin, User, Star, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';

const MobileBookingsV2 = () => {
  const { user, showAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookingsData = response.data?.bookings || response.data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load bookings');
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    if (!Array.isArray(bookings)) return [];
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.session_date);
      if (activeFilter === 'upcoming') return bookingDate >= now;
      if (activeFilter === 'past') return bookingDate < now;
      if (activeFilter === 'cancelled') return booking.status === 'cancelled';
      return true;
    });
  };

  const filteredBookings = filterBookings();

  const filters = [
    { id: 'upcoming', label: 'Upcoming', gradient: 'from-blue-400 to-cyan-500' },
    { id: 'past', label: 'Past', gradient: 'from-purple-400 to-pink-500' },
    { id: 'cancelled', label: 'Cancelled', gradient: 'from-gray-400 to-slate-500' }
  ];

  const handleBookingClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking cancelled successfully');
      fetchBookings(); 
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const handleRescheduleBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setShowDetailModal(false); 
      setShowRescheduleModal(true); 
    }
  };
  
  const handleRescheduleSuccess = () => {
    fetchBookings(); 
    setShowRescheduleModal(false);
    setSelectedBooking(null);
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-4">Please log in to view your bookings</p>
              <button
                onClick={() => showAuthModal('customer')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                Login / Sign Up
              </button>
            </div>
          </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="My Bookings"
          subtitle={`${bookings.length} total bookings`}
          gradient="from-blue-500 via-indigo-500 to-purple-500"
        >
          {/* Filter Pills - Responsive container */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start max-w-7xl w-full">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex-1 md:flex-none md:min-w-[120px] py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                  activeFilter === filter.id
                    ? `bg-white text-gray-900 shadow-lg`
                    : `bg-white/20 text-white hover:bg-white/30`
                }`}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </MagicHeader>

        {/* Content Container with Max Width for Desktop */}
        <div className="p-4 pb-24 -mt-4 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="max-w-md mx-auto">
              <GlassCard>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No {activeFilter} bookings
                  </h3>
                  <p className="text-gray-600 mb-4">Start booking amazing activities!</p>
                  <button
                    onClick={() => navigate('/mobile')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Explore Activities
                  </button>
                </div>
              </GlassCard>
            </div>
          ) : (
            /* Responsive Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredBookings.map((booking, index) => {
                  const sessionDate = new Date(booking.session_date);
                  const now = new Date();
                  const hoursUntil = Math.floor((sessionDate - now) / (1000 * 60 * 60));
                  const minutesUntil = Math.floor((sessionDate - now) / (1000 * 60));
                  const isUpcoming = sessionDate > now;
                  const isWithin24Hours = hoursUntil >= 0 && hoursUntil < 24;
                  const isPast = sessionDate < now;
                  
                  return (
                    <GlassCard
                      key={booking.id}
                      delay={index * 0.05}
                      hover={true} // Enabled hover effect for desktop
                      className="h-full flex flex-col justify-between"
                    >
                      <div className="p-4 flex flex-col h-full">
                        <div className="flex gap-3 mb-3 flex-1">
                          {/* Date Badge */}
                          <div className="flex-shrink-0">
                            <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex flex-col items-center justify-center text-white shadow-lg ${
                              isPast ? 'from-gray-400 to-gray-500' :
                              isWithin24Hours ? 'from-orange-500 to-red-500 animate-pulse' :
                              'from-blue-500 to-purple-600'
                            }`}>
                              <span className="text-2xl font-bold">
                                {sessionDate.getDate()}
                              </span>
                              <span className="text-xs">
                                {sessionDate.toLocaleString('default', { month: 'short' })}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 min-h-[1.5rem]">
                              {booking.listing_title || 'Activity'}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <Clock className="w-3 h-3" />
                              <span>{booking.session_time || '10:00 AM'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <User className="w-3 h-3" />
                              <span>{booking.child_name || 'Child'}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {booking.status || 'Confirmed'}
                              </span>
                              
                              {/* Attendance Badge for Past Classes */}
                              {isPast && booking.attendance_status && (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  booking.attendance_status === 'present' ? 'bg-green-50 text-green-600 border border-green-200' :
                                  booking.attendance_status === 'absent' ? 'bg-red-50 text-red-600 border border-red-200' :
                                  'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}>
                                  {booking.attendance_status === 'present' ? '✓ Present' : 
                                   booking.attendance_status === 'absent' ? '✗ Absent' : 'Pending'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Countdown Timer for Classes Within 24 Hours */}
                        {isWithin24Hours && booking.status === 'confirmed' && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-orange-900">Class starts in:</span>
                              <span className="text-sm font-bold text-red-600">
                                {hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil % 60}m` : `${minutesUntil}m`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingClick(booking, e);
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md transition-shadow"
                          >
                            <Calendar className="w-4 h-4" />
                            Details
                          </motion.button>
                          
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/mobile/listing/${booking.listing_id}`);
                            }}
                            className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Booking Detail Modal */}
        {showDetailModal && selectedBooking && (
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedBooking(null);
            }}
            onCancel={handleCancelBooking}
            onReschedule={handleRescheduleBooking}
          />
        )}
        
        {/* Reschedule Modal */}
        {showRescheduleModal && selectedBooking && (
          <RescheduleModal
            booking={selectedBooking}
            onClose={() => {
              setShowRescheduleModal(false);
              setSelectedBooking(null);
            }}
            onSuccess={handleRescheduleSuccess}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileBookingsV2;