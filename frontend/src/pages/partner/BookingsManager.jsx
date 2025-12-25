import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Search, Filter, Calendar, Users, CheckCircle, 
  XCircle, Clock, Mail, Phone, User, MapPin,
  Download, RefreshCw, Eye, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getErrorMessage } from '../../utils/errorHandler';

const PartnerBookingsManager = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, confirmed, attended, cancelled
  const [filterDate, setFilterDate] = useState('all'); // all, upcoming, past
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my/bookings?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.patch(
        `${API}/bookings/${bookingId}`,
        { booking_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Marked as ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will refund the customer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(
        `${API}/bookings/${bookingId}/cancel`,
        { cancelled_by: 'partner' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Booking cancelled and customer refunded');
      fetchBookings();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to cancel booking'));
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Time', 'Customer', 'Child Name', 'Age', 'Class', 'Status', 'Amount', 'Payment'],
      ...filteredBookings.map(b => [
        format(new Date(b.session_start), 'yyyy-MM-dd'),
        format(new Date(b.session_start), 'HH:mm'),
        b.user_name || 'N/A',
        b.child_profile_name,
        b.child_profile_age,
        b.listing_title,
        b.booking_status,
        `₹${b.amount_inr}`,
        b.payment_method
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.child_profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.listing_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.booking_status === filterStatus;
    
    const sessionDate = new Date(booking.session_start);
    const now = new Date();
    const matchesDate = 
      filterDate === 'all' ||
      (filterDate === 'upcoming' && sessionDate > now) ||
      (filterDate === 'past' && sessionDate < now);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#3B82F6';
      case 'attended': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'no_show': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const icons = {
      confirmed: Clock,
      attended: CheckCircle,
      cancelled: XCircle,
      no_show: XCircle
    };
    const Icon = icons[status] || Clock;

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '8px',
        background: `${color}15`,
        color: color,
        fontSize: '0.875rem',
        fontWeight: '600',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <Icon size={14} />
        {status.replace('_', ' ')}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading bookings...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1E293B',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.5rem'
            }}>
              Bookings
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Manage attendance and customer bookings
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={fetchBookings}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                border: '2px solid #3B82F6',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-scale"
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Total Bookings
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1E293B', fontFamily: 'Outfit, sans-serif' }}>
              {bookings.length}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Confirmed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
              {bookings.filter(b => b.booking_status === 'confirmed').length}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Attended
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981', fontFamily: 'Outfit, sans-serif' }}>
              {bookings.filter(b => b.booking_status === 'attended').length}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Revenue
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981', fontFamily: 'Outfit, sans-serif' }}>
              ₹{bookings.reduce((sum, b) => sum + (b.amount_inr || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by customer or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '15px',
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', marginRight: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Status:
              </div>
              {['all', 'confirmed', 'attended', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: filterStatus === status ? 'none' : '2px solid #e2e8f0',
                    background: filterStatus === status ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : 'white',
                    color: filterStatus === status ? 'white' : '#64748B',
                    fontWeight: '600',
                    fontSize: '13px',
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', marginRight: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Date:
              </div>
              {['all', 'upcoming', 'past'].map(date => (
                <button
                  key={date}
                  onClick={() => setFilterDate(date)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: filterDate === date ? 'none' : '2px solid #e2e8f0',
                    background: filterDate === date ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : 'white',
                    color: filterDate === date ? 'white' : '#64748B',
                    fontWeight: '600',
                    fontSize: '13px',
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '4rem 2rem',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <Users size={64} style={{ color: '#e2e8f0', margin: '0 auto 1rem' }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              No bookings found
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Bookings will appear here once customers book your sessions
            </p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'Outfit, sans-serif'
              }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Date & Time</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Customer</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Child</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Class</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => (
                    <tr key={booking.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '0.25rem' }}>
                          {booking.session_start ? format(new Date(booking.session_start), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                          {booking.session_start ? format(new Date(booking.session_start), 'h:mm a') : ''}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>
                          {booking.user_name || 'Customer'}
                        </div>
                        {booking.user_email && (
                          <div style={{ fontSize: '0.875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <Mail size={12} />
                            {booking.user_email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>
                          {booking.child_profile_name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                          Age {booking.child_profile_age}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B', maxWidth: '200px' }}>
                          {booking.listing_title}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(booking.booking_status)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700', color: '#1E293B' }}>
                          ₹{booking.amount_inr}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'capitalize' }}>
                          {booking.payment_method?.replace('_', ' ')}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {booking.booking_status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleMarkAttendance(booking.id, 'attended')}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  background: '#D1FAE5',
                                  color: '#065F46',
                                  border: 'none',
                                  fontWeight: '600',
                                  fontSize: '13px',
                                  fontFamily: 'Outfit, sans-serif',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem'
                                }}
                              >
                                <CheckCircle size={14} />
                                Attended
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(booking.id, 'no_show')}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  border: 'none',
                                  fontWeight: '600',
                                  fontSize: '13px',
                                  fontFamily: 'Outfit, sans-serif',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem'
                                }}
                              >
                                <XCircle size={14} />
                                No Show
                              </button>
                            </>
                          )}
                          {booking.booking_status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '13px',
                                fontFamily: 'Outfit, sans-serif',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerBookingsManager;
