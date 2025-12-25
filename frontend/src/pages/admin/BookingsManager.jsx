import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Download, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/errorHandler';

const BookingsManager = () => {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, [page, filters]);

  const fetchBookings = async () => {
    try {
      const params = { page, limit: 25, ...filters };
      const response = await axios.get(`${API}/admin/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBookings(response.data.bookings);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleAction = async (bookingId, action) => {
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

    try {
      await axios.post(
        `${API}/admin/bookings/${bookingId}/action`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Booking ${action} successfully`);
      fetchBookings();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Action failed'));
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${API}/admin/bookings/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bookings.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div data-testid="admin-bookings" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            fontFamily: 'Space Grotesk, sans-serif',
            color: '#1e293b'
          }}>Bookings Monitor</h1>
          
          <button
            onClick={exportCSV}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="canceled">Canceled</option>
              <option value="attended">Attended</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>From Date</label>
            <Input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>To Date</label>
            <Input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Booking ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Date/Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Listing</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Partner</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Child</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Payment</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontSize: '13px', fontFamily: 'monospace' }}>
                      {booking.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px' }}>
                      {format(new Date(booking.booked_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', fontWeight: '600' }}>
                      {booking.listing_title}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px' }}>
                      {booking.partner_name || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px' }}>
                      {booking.child_profile_name} ({booking.child_profile_age})
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px' }}>
                      {booking.credits_used > 0 ? `${booking.credits_used} Credits` : `₹${booking.total_inr}`}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 
                          booking.booking_status === 'confirmed' ? '#dcfce7' :
                          booking.booking_status === 'attended' ? '#dbeafe' :
                          booking.booking_status === 'canceled' ? '#fee2e2' : '#f3f4f6',
                        color:
                          booking.booking_status === 'confirmed' ? '#166534' :
                          booking.booking_status === 'attended' ? '#1e40af' :
                          booking.booking_status === 'canceled' ? '#991b1b' : '#4b5563'
                      }}>
                        {booking.booking_status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {booking.booking_status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleAction(booking.id, 'cancel')}
                              style={{
                                padding: '0.375rem 0.75rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAction(booking.id, 'mark_attended')}
                              style={{
                                padding: '0.375rem 0.75rem',
                                background: '#dcfce7',
                                color: '#166534',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Attended
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Showing {bookings.length} of {total} bookings
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '0.5rem 1rem',
                  background: page === 1 ? '#e2e8f0' : '#06b6d4',
                  color: page === 1 ? '#94a3b8' : 'white',
                  borderRadius: '6px'
                }}
              >
                Previous
              </button>
              <button
                disabled={bookings.length < 25}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '0.5rem 1rem',
                  background: bookings.length < 25 ? '#e2e8f0' : '#06b6d4',
                  color: bookings.length < 25 ? '#94a3b8' : 'white',
                  borderRadius: '6px'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsManager;
