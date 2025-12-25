import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Calendar, Clock, X, CheckCircle, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';
import ReviewModal from '../components/ReviewModal';

const MyBookings = () => {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
    setLoading(false);
  };

  const handleReschedule = async (booking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
    setLoadingSessions(true);
    
    try {
      const response = await axios.get(
        `${API}/bookings/${booking.id}/available-sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableSessions(response.data.sessions);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load available sessions'));
      setShowRescheduleModal(false);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(false);
    setShowConfirmModal(true);
  };

  const confirmReschedule = async () => {
    if (!selectedSession) return;
    
    setRescheduling(true);
    try {
      await axios.post(
        `${API}/bookings/${selectedBooking.id}/reschedule`,
        { new_session_id: selectedSession.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Booking rescheduled successfully!');
      setShowConfirmModal(false);
      setSelectedSession(null);
      fetchBookings();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reschedule booking'));
    } finally {
      setRescheduling(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmModal(false);
    setShowRescheduleModal(true);
    setSelectedSession(null);
  };

  // Check if booking is at least 2 hours before start time
  const canReschedule = (booking) => {
    if (!booking.session_start) return false;
    
    // Parse session start datetime
    const sessionDateTime = new Date(booking.session_start);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    
    // Check if session is more than 2 hours away
    return sessionDateTime > twoHoursFromNow;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'canceled': return '#ef4444';
      case 'attended': return '#3b82f6';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="my-bookings-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />

      <div className="my-bookings-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>My Bookings</h1>

        {bookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <Calendar size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '0.5rem' }}>No bookings yet</h3>
            <p style={{ color: '#64748b' }}>Start exploring classes and book your first session!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                data-testid={`booking-${booking.id}`}
                className="booking-card-grid"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                {booking.listing_media && booking.listing_media[0] ? (
                  <img
                    src={`${booking.listing_media[0]}?w=120&h=120&fit=crop`}
                    alt={`${booking.listing_title} booking thumbnail`}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    background: '#e2e8f0',
                    borderRadius: '12px'
                  }}></div>
                )}

                <div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    background: `${getStatusColor(booking.booking_status)}20`,
                    color: getStatusColor(booking.booking_status)
                  }}>
                    {booking.booking_status.toUpperCase()}
                  </div>
                  
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                    {booking.listing_title}
                  </h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {format(parseISO(booking.session_start), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {format(parseISO(booking.session_start), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <strong style={{ color: '#1e293b' }}>{booking.child_profile_name}</strong> (Age {booking.child_profile_age})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="booking-price" style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                    {booking.credits_used > 0 ? `${booking.credits_used} Credits` : `₹${Math.round(booking.total_inr)}`}
                  </div>
                  {booking.booking_status === 'confirmed' && (
                    <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Show Reschedule button only if not already rescheduled AND at least 2 hours before start time */}
                      {(!booking.reschedule_count || booking.reschedule_count === 0) && canReschedule(booking) && (
                        <button
                          data-testid={`reschedule-booking-${booking.id}`}
                          onClick={() => handleReschedule(booking)}
                          style={{
                            background: '#06b6d4',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <RefreshCw size={16} />
                          Reschedule
                        </button>
                      )}
                      {/* Show "Already Rescheduled" message if already done */}
                      {booking.reschedule_count && booking.reschedule_count > 0 && (
                        <div style={{
                          padding: '0.5rem 1rem',
                          background: '#f3f4f6',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle size={16} />
                          Already Rescheduled
                        </div>
                      )}
                      {/* Show message if less than 2 hours before start time */}
                      {(!booking.reschedule_count || booking.reschedule_count === 0) && !canReschedule(booking) && (
                        <div style={{
                          padding: '0.5rem 1rem',
                          background: '#fef3c7',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <AlertCircle size={16} />
                          Too close to reschedule
                        </div>
                      )}
                    </div>
                  )}
                  {/* Show Review button for completed bookings where customer attended */}
                  {booking.booking_status === 'completed' && booking.attendance_status === 'present' && (
                    <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowReviewModal(true);
                        }}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Star size={16} />
                        Leave Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                Reschedule Booking
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  padding: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {selectedBooking && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {selectedBooking.listing_title}
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Current: {selectedBooking.session_start ? format(parseISO(selectedBooking.session_start), 'MMM dd, yyyy h:mm a') : 'N/A'}
                </p>
              </div>
            )}

            {loadingSessions ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Loading available sessions...
              </div>
            ) : (
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Available Sessions:
                </h5>
                {availableSessions.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                    No alternative sessions available
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {availableSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSessionSelect(session)}
                        disabled={rescheduling}
                        style={{
                          background: 'transparent',
                          border: '1px solid #e2e8f0',
                          color: '#1e293b',
                          padding: '1rem',
                          borderRadius: '8px',
                          textAlign: 'left',
                          cursor: rescheduling ? 'not-allowed' : 'pointer',
                          opacity: rescheduling ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} style={{ color: '#06b6d4' }} />
                            <span>
                              {session.start_at 
                                ? format(new Date(session.start_at), 'MMM dd, yyyy h:mm a')
                                : session.session_datetime 
                                ? format(new Date(session.session_datetime), 'MMM dd, yyyy h:mm a')
                                : 'Date not available'
                              }
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {session.available_seats} seats left
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)'
              }}>
                <AlertCircle size={32} color="white" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '0.5rem' }}>
                Confirm Reschedule
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Please confirm you want to reschedule to this new session
              </p>
            </div>

            {/* Current Session */}
            <div style={{
              background: '#FEF2F2',
              border: '2px solid #FEE2E2',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600', marginBottom: '0.5rem' }}>
                CURRENT SESSION
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B' }}>
                <Calendar size={16} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {selectedBooking.session_start 
                    ? format(new Date(selectedBooking.session_start), 'MMM dd, yyyy h:mm a')
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ fontSize: '24px', color: '#3B82F6' }}>↓</div>
            </div>

            {/* New Session */}
            <div style={{
              background: '#F0FDF4',
              border: '2px solid #BBF7D0',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                NEW SESSION
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46' }}>
                  <Calendar size={16} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {selectedSession.start_at 
                      ? format(new Date(selectedSession.start_at), 'MMM dd, yyyy h:mm a')
                      : selectedSession.session_datetime 
                      ? format(new Date(selectedSession.session_datetime), 'MMM dd, yyyy h:mm a')
                      : 'Date not available'
                    }
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  {selectedSession.available_seats} seats left
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
                You can only reschedule once. This action cannot be undone.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={cancelConfirmation}
                disabled={rescheduling}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'white',
                  border: '2px solid #E2E8F0',
                  color: '#64748B',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: rescheduling ? 'not-allowed' : 'pointer',
                  opacity: rescheduling ? 0.5 : 1
                }}
              >
                Go Back
              </button>
              <button
                onClick={confirmReschedule}
                disabled={rescheduling}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: rescheduling 
                    ? '#94A3B8' 
                    : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: rescheduling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {rescheduling ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                    Rescheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSuccess={() => {
          toast.success('Review submitted successfully! It will appear after admin approval.');
          fetchBookings();
        }}
      />
    </div>
  );
};

export default MyBookings;
