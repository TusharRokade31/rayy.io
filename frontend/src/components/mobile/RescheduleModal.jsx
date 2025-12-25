import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import { 
  X, Calendar, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const RescheduleModal = ({ booking, onClose, onSuccess }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  useEffect(() => {
    fetchAvailableSessions();
  }, [booking]);
  
  const fetchAvailableSessions = async () => {
    try {
      setLoading(true);
      
      // Fetch sessions for the next 90 days
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${API}/listings/${booking.listing_id}/sessions?from_date=${today}&to_date=${endDateStr}`
      );
      
      // Filter valid sessions
      if (response.data && response.data.sessions) {
        const validSessions = response.data.sessions.filter(session => 
          session && 
          typeof session === 'object' && 
          (session.id || session._id) && 
          (session.date || session.start_at) &&
          !session.type && !session.loc && !session.msg
        );
        setSessions(validSessions);
      } else {
        setSessions([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load available sessions');
      setLoading(false);
    }
  };
  
  const handleConfirmReschedule = async () => {
    if (!selectedSession) {
      toast.error('Please select a new session');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(
        `${API}/bookings/${booking.id}/reschedule`,
        {
          new_session_id: selectedSession.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('🎉 Session rescheduled successfully!');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Reschedule error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to reschedule session';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if booking has already been rescheduled
  const hasBeenRescheduled = booking.reschedule_count >= 1;
  
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
            <h2 className="text-xl font-bold text-gray-900">Reschedule Session</h2>
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Important Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-1">One-Time Reschedule</h3>
                  <p className="text-sm text-blue-800">
                    You can reschedule this session <span className="font-bold">only once</span>. 
                    Please choose your new session carefully.
                  </p>
                  {hasBeenRescheduled && (
                    <div className="mt-2 p-2 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-sm text-red-900 font-semibold">
                        ⚠️ This booking has already been rescheduled once. No further changes allowed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Session Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Current Session
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-gray-900 font-semibold">{booking.listing_title}</p>
                <p className="text-gray-600">
                  {format(parseISO(booking.session_date), 'EEEE, MMMM dd, yyyy')} • {booking.session_time || format(parseISO(booking.session_date), 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Session Selector */}
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading available sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border-2 border-gray-200">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No sessions available</p>
                <p className="text-sm text-gray-500">Please contact the instructor for assistance</p>
              </div>
            ) : (
              <>
                {/* Week Navigation */}
                <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-200">
                  <button
                    onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                    disabled={currentWeekOffset === 0}
                    className="p-2 bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Viewing Week</div>
                    <div className="text-sm font-bold text-gray-900">
                      {(() => {
                        const today = new Date();
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() + (currentWeekOffset * 7));
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                    disabled={currentWeekOffset >= 12}
                    className="p-2 bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Session List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 mb-3">Select New Session</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sessions
                      .filter((session) => {
                        // Filter by current week
                        const sessionDate = new Date(session.date || session.start_at);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const weekStartDate = new Date(today);
                        weekStartDate.setDate(today.getDate() + (currentWeekOffset * 7));
                        
                        const weekEndDate = new Date(weekStartDate);
                        weekEndDate.setDate(weekStartDate.getDate() + 6);
                        weekEndDate.setHours(23, 59, 59, 999);
                        
                        // Don't show the current session
                        if (session.id === booking.session_id) return false;
                        
                        return sessionDate >= weekStartDate && sessionDate <= weekEndDate;
                      })
                      .map((session) => {
                        const isSelected = selectedSession?.id === session.id;
                        const isFull = session.seats_available <= 0;
                        
                        return (
                          <motion.button
                            key={session.id}
                            whileHover={!isFull ? { scale: 1.01 } : {}}
                            whileTap={!isFull ? { scale: 0.99 } : {}}
                            onClick={() => !isFull && setSelectedSession(session)}
                            disabled={isFull || hasBeenRescheduled}
                            className={`
                              w-full bg-white rounded-xl p-4 border-2 transition-all text-left
                              ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200'}
                              ${isFull || hasBeenRescheduled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-indigo-300'}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {/* Date Badge */}
                                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold ${
                                  isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  <span className="text-xs">{format(parseISO(session.date || session.start_at), 'MMM')}</span>
                                  <span className="text-xl">{format(parseISO(session.date || session.start_at), 'd')}</span>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 mb-1">
                                    {format(parseISO(session.date || session.start_at), 'EEEE')}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{session.time || format(parseISO(session.start_at), 'h:mm a')}</span>
                                    {session.seats_available && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span>{session.seats_available} spots left</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Checkmark */}
                              {isSelected && (
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* Confirm Button */}
            {!loading && sessions.length > 0 && !hasBeenRescheduled && (
              <button
                onClick={handleConfirmReschedule}
                disabled={!selectedSession || submitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm Reschedule</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
