import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { Calendar, User, Clock, DollarSign, MapPin, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const MobilePartnerBookings = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partner/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]); // Ensure bookings is always an array
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'All', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length }
  ];

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.patch(
        `${API}/partner/bookings/${bookingId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Booking ${action}ed successfully`);
      fetchBookings();
    } catch (error) {
      toast.error(`Failed to ${action} booking`);
    }
  };

  return (
    <MobilePartnerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="Bookings"
          subtitle="Manage your bookings"
          gradient="from-blue-500 via-purple-500 to-pink-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                  filter === option.value
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </motion.button>
            ))}
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <GlassCard key={booking.id} delay={0.1 * index}>
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {booking.listing_title || 'Listing'}
                        </h3>
                        <div className="text-sm text-gray-600">
                          Booking ID: #{booking.id.slice(0, 8)}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 font-medium">{booking.customer_name || 'Customer'}</span>
                      </div>
                      {booking.customer_phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${booking.customer_phone}`}>{booking.customer_phone}</a>
                        </div>
                      )}
                      {booking.customer_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.session_date || booking.created_at).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      {booking.session_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{booking.session_time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-gray-900">₹{booking.amount || 0}</span>
                      </div>
                    </div>

                    {/* Actions for pending bookings */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBookingAction(booking.id, 'confirm')}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBookingAction(booking.id, 'reject')}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </motion.button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600">Bookings will appear here when customers book your activities</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </MobilePartnerLayout>
  );
};

export default MobilePartnerBookings;