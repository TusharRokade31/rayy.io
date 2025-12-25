import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { 
  Users, Search, Filter, Download, Mail, Phone, Calendar,
  TrendingUp, Award, X, Eye, ChevronRight, UserCheck, UserX
} from 'lucide-react';
import { toast } from 'sonner';

const PartnerCustomers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, new, returning, regular
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      // Fetch all bookings
      const bookingsRes = await axios.get(`${API}/partner/bookings?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookings = bookingsRes.data.items || [];
      
      // Aggregate customer data
      const customerMap = {};
      
      bookings.forEach(booking => {
        const customerId = booking.user_id || booking.customer_id;
        const customerEmail = booking.customer_email || 'Unknown';
        const customerName = booking.customer_name || 'Unknown Customer';
        
        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            id: customerId,
            name: customerName,
            email: customerEmail,
            phone: booking.customer_phone || '-',
            bookings: [],
            totalSpent: 0,
            attended: 0,
            noShow: 0,
            cancelled: 0,
            firstBooking: booking.booked_at,
            lastBooking: booking.booked_at
          };
        }
        
        customerMap[customerId].bookings.push(booking);
        customerMap[customerId].totalSpent += booking.total_inr || 0;
        
        if (booking.attendance_status === 'attended') {
          customerMap[customerId].attended++;
        } else if (booking.attendance_status === 'no_show') {
          customerMap[customerId].noShow++;
        }
        
        if (booking.booking_status === 'cancelled') {
          customerMap[customerId].cancelled++;
        }
        
        // Update first and last booking dates
        if (new Date(booking.booked_at) < new Date(customerMap[customerId].firstBooking)) {
          customerMap[customerId].firstBooking = booking.booked_at;
        }
        if (new Date(booking.booked_at) > new Date(customerMap[customerId].lastBooking)) {
          customerMap[customerId].lastBooking = booking.booked_at;
        }
      });
      
      // Convert to array and add metrics
      const customersArray = Object.values(customerMap).map(customer => ({
        ...customer,
        totalBookings: customer.bookings.length,
        attendanceRate: customer.attended + customer.noShow > 0 
          ? ((customer.attended / (customer.attended + customer.noShow)) * 100).toFixed(0)
          : 0,
        isRegular: customer.bookings.length >= 5,
        isNew: customer.bookings.length === 1,
        isReturning: customer.bookings.length > 1 && customer.bookings.length < 5
      }));
      
      // Sort by total spent (highest first)
      customersArray.sort((a, b) => b.totalSpent - a.totalSpent);
      
      setCustomers(customersArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    let matchesType = true;
    if (filterType === 'new') matchesType = customer.isNew;
    else if (filterType === 'returning') matchesType = customer.isReturning;
    else if (filterType === 'regular') matchesType = customer.isRegular;
    
    return matchesSearch && matchesType;
  });

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleExportCustomers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Attendance Rate', 'First Booking', 'Last Booking'].join(','),
      ...filteredCustomers.map(c => [
        c.name,
        c.email,
        c.phone,
        c.totalBookings,
        c.totalSpent.toFixed(0),
        `${c.attendanceRate}%`,
        new Date(c.firstBooking).toLocaleDateString(),
        new Date(c.lastBooking).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Customer data exported!');
  };

  const CustomerBadge = ({ type }) => {
    const badges = {
      new: { color: '#3B82F6', bg: '#3B82F615', text: 'New' },
      returning: { color: '#10b981', bg: '#10b98115', text: 'Returning' },
      regular: { color: '#f59e0b', bg: '#f59e0b15', text: 'Regular' }
    };
    
    const badge = badges[type];
    if (!badge) return null;
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: badge.bg,
        color: badge.color
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '0.5rem',
                fontFamily: 'Outfit, sans-serif'
              }}>
                Customer Database
              </h1>
              <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>
                {filteredCustomers.length} customers
              </p>
            </div>
            
            <button
              onClick={handleExportCustomers}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1.25rem',
              borderRadius: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                Total Customers
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                {customers.length}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.25rem',
              borderRadius: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                New Customers
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                {customers.filter(c => c.isNew).length}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.25rem',
              borderRadius: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                Regular Customers
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
                {customers.filter(c => c.isRegular).length}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.25rem',
              borderRadius: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                Avg. Bookings
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalBookings, 0) / customers.length).toFixed(1) : 0}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                minWidth: '150px'
              }}
            >
              <option value="all">All Customers</option>
              <option value="new">New (1 booking)</option>
              <option value="returning">Returning (2-4)</option>
              <option value="regular">Regular (5+)</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    CUSTOMER
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    CONTACT
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    BOOKINGS
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    TOTAL SPENT
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    ATTENDANCE
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    TYPE
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '700'
                        }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                            {customer.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Since {new Date(customer.firstBooking).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
                        {customer.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {customer.phone}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                        {customer.totalBookings}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{customer.totalSpent.toFixed(0)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.875rem',
                        borderRadius: '20px',
                        background: customer.attendanceRate >= 80 ? '#10b98115' : '#f59e0b15',
                        color: customer.attendanceRate >= 80 ? '#10b981' : '#f59e0b',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {customer.attendanceRate >= 80 ? <UserCheck size={14} /> : <UserX size={14} />}
                        {customer.attendanceRate}%
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <CustomerBadge type={customer.isNew ? 'new' : customer.isRegular ? 'regular' : 'returning'} />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: '2px solid #3B82F6',
                          borderRadius: '8px',
                          color: '#3B82F6',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '13px',
                          fontFamily: 'Outfit, sans-serif'
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>
                No customers found
              </div>
              <div style={{ fontSize: '14px' }}>
                Try adjusting your search or filters
              </div>
            </div>
          )}
        </div>

        {/* Customer Detail Modal */}
        {showCustomerModal && selectedCustomer && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            onClick={() => setShowCustomerModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '2rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                    {selectedCustomer.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '14px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} />
                      {selectedCustomer.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '2rem' }}>
                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>Total Bookings</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                      {selectedCustomer.totalBookings}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>Total Spent</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                      ₹{selectedCustomer.totalSpent.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>Attendance</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
                      {selectedCustomer.attendanceRate}%
                    </div>
                  </div>
                </div>

                {/* Booking History */}
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                  Booking History
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedCustomer.bookings.map((booking, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
                          {booking.listing_title || 'Class'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {new Date(booking.booked_at).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#3B82F6', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
                          ₹{booking.total_inr?.toFixed(0)}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '12px',
                          background: booking.attendance_status === 'attended' ? '#10b98115' : '#94a3b815',
                          color: booking.attendance_status === 'attended' ? '#10b981' : '#64748b'
                        }}>
                          {booking.attendance_status === 'attended' ? 'Attended' : 
                           booking.attendance_status === 'no_show' ? 'No Show' : 
                           booking.booking_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PartnerCustomers;
