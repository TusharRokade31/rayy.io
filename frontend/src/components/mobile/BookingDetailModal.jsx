import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import { 
  X, MapPin, Calendar, Clock, Users, Phone, Mail, Video, 
  Download, Bell, CheckCircle, Navigation, Share2, MessageCircle,
  AlertTriangle, Plus, Sparkles, Star, Award
} from 'lucide-react';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

const BookingDetailModal = ({ booking, onClose, onCancel, onReschedule }) => {
  
  if (!booking) return null;

  const sessionDate = booking.session_date ? parseISO(booking.session_date) : new Date();
  const now = new Date();
  const hoursUntil = differenceInHours(sessionDate, now);
  const minutesUntil = differenceInMinutes(sessionDate, now);
  
  const isUpcoming = sessionDate > now;
  
  // Reschedule rules: Allow for ALL booking types, up to 30 mins before, and only if not already rescheduled
  const rescheduleLimit = booking.reschedule_limit_minutes || 30;
  const hasBeenRescheduled = (booking.reschedule_count || 0) >= 1;
  const canReschedule = isUpcoming && minutesUntil > rescheduleLimit && !hasBeenRescheduled;

  const addToCalendar = (type) => {
    const title = encodeURIComponent(booking.listing_title || 'Class');
    const details = encodeURIComponent(`Booking ID: ${booking.id}`);
    const location = encodeURIComponent(booking.venue_address || 'Online');
    const dateStr = format(sessionDate, "yyyyMMdd'T'HHmmss");
    const endDateStr = format(new Date(sessionDate.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");
    
    if (type === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${endDateStr}&details=${details}&location=${location}`;
      window.open(url, '_blank');
    } else if (type === 'apple') {
      toast.info('ICS file download coming soon!');
    }
  };

  const getDirections = () => {
    if (booking.venue_latitude && booking.venue_longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.venue_latitude},${booking.venue_longitude}`;
      window.open(url, '_blank');
    } else if (booking.venue_address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.venue_address)}`;
      window.open(url, '_blank');
    } else {
      toast.info('Location not available');
    }
  };

  const joinOnlineClass = () => {
    if (booking.zoom_link || booking.meeting_link) {
      window.open(booking.zoom_link || booking.meeting_link, '_blank');
    } else {
      toast.info('Meeting link will be shared 15 minutes before class');
    }
  };

  const downloadMaterials = () => {
    toast.info('Class materials will be available after the session');
  };

  const handleCheckIn = () => {
    toast.success('Checked in successfully! 🎉');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Class Image & Title */}
            <div className="flex gap-4">
              <img
                src={booking.listing_image || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100'}
                alt={booking.listing_title}
                className="w-24 h-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{booking.listing_title}</h3>
                <p className="text-sm text-gray-600 mb-2">{booking.partner_name || 'Instructor'}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* View Full Listing Button */}
            {booking.listing_id && (
              <button
                onClick={() => window.location.href = `/mobile/listing/${booking.listing_id}`}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                View Full Listing Details
              </button>
            )}

            {/* Countdown Timer */}
            {isUpcoming && hoursUntil < 48 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {hoursUntil > 0 ? `Starts in ${hoursUntil} hours` : `Starts in ${minutesUntil} minutes`}
                    </p>
                    <p className="text-sm text-gray-600">Get ready for your class!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Information */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-gray-900 mb-3">Booking Information</h4>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Booking ID</span>
                <span className="text-sm font-mono font-semibold text-gray-900">#{booking.id}</span>
              </div>
              
              {booking.booking_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booked On</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Paid</span>
                <span className="text-lg font-bold text-green-600">₹{booking.amount || 0}</span>
              </div>

              {booking.payment_method && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{booking.payment_method}</span>
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900">Session Details</h4>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{format(sessionDate, 'EEEE, MMMM dd, yyyy')}</p>
                  <p className="text-sm text-gray-600">{booking.session_time || format(sessionDate, 'hh:mm a')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Duration</p>
                  <p className="text-sm text-gray-600">{booking.duration_minutes || booking.duration || 60} minutes</p>
                </div>
              </div>

              {booking.category && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Category</p>
                    <p className="text-sm text-gray-600 capitalize">{booking.category}</p>
                  </div>
                </div>
              )}

              {booking.age_group && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Age Group</p>
                    <p className="text-sm text-gray-600">{booking.age_group}</p>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {booking.attendees && booking.attendees.length > 0 ? (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {booking.attendees.length} {booking.attendees.length === 1 ? 'Attendee' : 'Attendees'}
                    </p>
                    <div className="mt-1 space-y-1">
                      {booking.attendees.map((attendee, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {attendee.name} {attendee.age && `(${attendee.age} years)`}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : booking.child_name && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Child</p>
                    <p className="text-sm text-gray-600">
                      {booking.child_name} {booking.child_age && `(${booking.child_age} years)`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance & Feedback for Past Classes */}
            {!isUpcoming && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  Class Completed
                </h4>
                
                <div className="space-y-3">
                  {/* Attendance Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">Attendance</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      booking.attendance_status === 'present' ? 'bg-green-100 text-green-700' :
                      booking.attendance_status === 'absent' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.attendance_status === 'present' ? '✓ Present' :
                       booking.attendance_status === 'absent' ? '✗ Absent' :
                       'Not Marked'}
                    </span>
                  </div>

                  {/* Teacher Rating */}
                  {booking.teacher_rating && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">Teacher Rating</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < booking.teacher_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {booking.teacher_feedback && (
                    <div className="pt-2 border-t border-purple-200">
                      <span className="text-sm text-gray-700 font-medium mb-1 block">Teacher's Feedback</span>
                      <p className="text-sm text-gray-600 italic">"{booking.teacher_feedback}"</p>
                    </div>
                  )}

                  {/* Session Notes/Materials */}
                  {booking.session_notes && (
                    <div className="pt-2 border-t border-purple-200">
                      <span className="text-sm text-gray-700 font-medium mb-1 block">Session Notes</span>
                      <p className="text-sm text-gray-600">{booking.session_notes}</p>
                    </div>
                  )}

                  {/* Certificate if earned */}
                  {booking.certificate_url && (
                    <button
                      onClick={() => window.open(booking.certificate_url, '_blank')}
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 mt-2"
                    >
                      <Award className="w-5 h-5" />
                      Download Certificate
                    </button>
                  )}

                  {/* Book Again Button */}
                  <button
                    onClick={() => window.location.href = `/mobile/listing/${booking.listing_id}`}
                    className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Book This Class Again
                  </button>
                </div>
              </div>
            )}

            {/* Location/Online */}
            {booking.is_online ? (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3 mb-3">
                  <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">Online Class</p>
                    <p className="text-sm text-blue-700">
                      {booking.zoom_link ? 'Join link available' : 'Link will be shared 15 minutes before class'}
                    </p>
                  </div>
                </div>
                {booking.zoom_link && isUpcoming && hoursUntil < 1 && (
                  <button
                    onClick={joinOnlineClass}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                  >
                    Join Class Now
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-1">
                      {booking.listing_location?.venue_name || booking.venue_name || 'Venue'}
                    </p>
                    {booking.listing_location?.address && (
                      <p className="text-sm text-green-700 mb-1">{booking.listing_location.address}</p>
                    )}
                    {booking.listing_location?.city && (
                      <p className="text-sm text-green-700">
                        {booking.listing_location.city}
                        {booking.listing_location.state && `, ${booking.listing_location.state}`}
                        {booking.listing_location.pincode && ` - ${booking.listing_location.pincode}`}
                      </p>
                    )}
                    {!booking.listing_location && booking.venue_address && (
                      <p className="text-sm text-green-700">{booking.venue_address}</p>
                    )}
                    {!booking.listing_location && !booking.venue_address && (
                      <p className="text-sm text-green-700">Address will be shared soon</p>
                    )}
                  </div>
                </div>
                {(booking.venue_address || booking.listing_location?.address) && (
                  <button
                    onClick={getDirections}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Get Directions
                  </button>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addToCalendar('google')}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Add to Calendar</span>
              </button>

              <button
                onClick={downloadMaterials}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm">Materials</span>
              </button>

              <button
                onClick={() => toast.info('Reminders enabled!')}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300"
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm">Set Reminder</span>
              </button>

              {isUpcoming && hoursUntil < 2 && (
                <button
                  onClick={handleCheckIn}
                  className="flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Check In</span>
                </button>
              )}
            </div>

            {/* Cancel/Reschedule/Unable to Attend */}
            {isUpcoming && booking.status !== 'canceled' && (
              <div className="space-y-3">
                {/* Reschedule - Available for all booking types, only once */}
                {canReschedule ? (
                  <button
                    onClick={() => onReschedule && onReschedule(booking.id)}
                    className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50"
                  >
                    🔄 Reschedule Session (One-time)
                  </button>
                ) : hasBeenRescheduled ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      This booking has already been rescheduled once. Only one reschedule is allowed per booking.
                    </p>
                  </div>
                ) : minutesUntil <= rescheduleLimit && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Reschedule not available within {rescheduleLimit} minutes of class start time.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Teacher */}
            <button
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Message Teacher
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingDetailModal;