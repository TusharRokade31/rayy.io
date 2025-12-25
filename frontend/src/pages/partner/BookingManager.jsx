import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { API } from '../../App';
import { toast } from 'sonner';
import axios from 'axios';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    status: '',
    listing_id: '',
    q: ''
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('instructor_unavailable');
  const [cancelMessage, setCancelMessage] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesBookingId, setNotesBookingId] = useState(null);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [partnerListings, setPartnerListings] = useState([]);

  useEffect(() => {
    fetchPartnerListings();
    fetchBookings();
  }, [page, filters]);

  const fetchPartnerListings = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await fetch(`${API}/partners/my/listings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPartnerListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('yuno_token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });

      const response = await fetch(`${API}/partner/bookings?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.items || []);
        setTotal(data.total || 0);
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (bookingId, status, notes = '') => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await fetch(`${API}/partner/bookings/${bookingId}/attendance`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        // Refresh bookings
        fetchBookings();
        setShowNotesModal(false);
        setNotesBookingId(null);
        setAttendanceNotes('');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance');
    }
  };

  const cancelBooking = async () => {
    if (!cancelBookingId) return;

    try {
      const token = localStorage.getItem('yuno_token');
      const response = await fetch(`${API}/partner/bookings/${cancelBookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason,
          message: cancelMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Booking canceled successfully. Refunded: ₹${data.refund_amount_inr} + ${data.refund_credits} credits + ${data.goodwill_credits} goodwill credits`);
        setShowCancelModal(false);
        setCancelBookingId(null);
        setCancelReason('instructor_unavailable');
        setCancelMessage('');
        fetchBookings();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Error canceling booking');
    }
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Date', 'Child', 'Class', 'Payment', 'Status', 'Attendance', 'Customer'];
    const rows = bookings.map(b => [
      b.booking_id,
      b.session?.start_at ? format(parseISO(b.session.start_at), 'dd MMM yyyy HH:mm') : 'N/A',
      b.child.name,
      b.listing.title,
      `₹${b.payment.total_inr} (${b.payment.credits_used} credits)`,
      b.status,
      b.attendance || 'Not marked',
      b.customer?.email || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-blue-100 text-blue-800',
      attended: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceBadge = (attendance) => {
    if (!attendance) return <span className="text-gray-400 text-sm">Not marked</span>;
    
    const styles = {
      present: { icon: CheckCircle, class: 'text-green-600' },
      absent: { icon: XCircle, class: 'text-red-600' },
      late: { icon: Clock, class: 'text-orange-600' }
    };
    
    const config = styles[attendance] || styles.absent;
    const Icon = config.icon;
    
    return (
      <span className={`flex items-center gap-1 ${config.class} text-sm font-medium`}>
        <Icon className="h-4 w-4" />
        {attendance.charAt(0).toUpperCase() + attendance.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={bookings.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="attended">Attended</option>
                <option value="no_show">No Show</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={filters.listing_id}
                onChange={(e) => setFilters({ ...filters, listing_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Classes</option>
                {partnerListings.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  placeholder="Child name..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {bookings.length} of {total} bookings
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">No bookings match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.session?.start_at ? (
                          <>
                            <div className="font-medium">
                              {format(parseISO(booking.session.start_at), 'dd MMM yyyy')}
                            </div>
                            <div className="text-gray-500">
                              {format(parseISO(booking.session.start_at), 'HH:mm')}
                            </div>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.child.name}</div>
                        <div className="text-sm text-gray-500">Age: {booking.child.age_band}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.listing.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">₹{booking.payment.total_inr}</div>
                        {booking.payment.credits_used > 0 && (
                          <div className="text-gray-500">{booking.payment.credits_used} credits</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAttendanceBadge(booking.attendance)}
                        {booking.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={booking.notes}>
                            {booking.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.status === 'confirmed' && !booking.attendance && (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => markAttendance(booking.booking_id, 'present')}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs font-medium"
                                title="Mark Present"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(booking.booking_id, 'absent')}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                                title="Mark Absent"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => markAttendance(booking.booking_id, 'late')}
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-xs font-medium"
                                title="Mark Late"
                              >
                                Late
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setNotesBookingId(booking.booking_id);
                                setShowNotesModal(true);
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                            >
                              Add Notes
                            </button>
                            <button
                              onClick={() => {
                                setCancelBookingId(booking.booking_id);
                                setShowCancelModal(true);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {booking.attendance && (
                          <span className="text-xs text-gray-500">Attendance marked</span>
                        )}
                        {booking.status === 'canceled' && (
                          <span className="text-xs text-gray-500">Canceled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 25 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 25 >= total}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 25 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 25, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * 25 >= total}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
                <p className="text-sm text-gray-500">Customer will receive full refund + goodwill credit</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="instructor_unavailable">Instructor Unavailable</option>
                  <option value="venue_issue">Venue Issue</option>
                  <option value="weather">Weather</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Customer (Optional)
                </label>
                <textarea
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a message for the customer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Refund Policy:</strong> Customer will receive 100% refund + 5 goodwill credits (or ₹100).
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelBookingId(null);
                  setCancelReason('instructor_unavailable');
                  setCancelMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={cancelBooking}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Attendance with Notes</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Notes (Optional, max 240 chars)
                </label>
                <textarea
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value.slice(0, 240))}
                  rows={3}
                  placeholder="Add any notes about attendance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {attendanceNotes.length}/240 characters
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => markAttendance(notesBookingId, 'present', attendanceNotes)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark Present
                </button>
                <button
                  onClick={() => markAttendance(notesBookingId, 'absent', attendanceNotes)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Mark Absent
                </button>
                <button
                  onClick={() => markAttendance(notesBookingId, 'late', attendanceNotes)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Mark Late
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNotesBookingId(null);
                  setAttendanceNotes('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
