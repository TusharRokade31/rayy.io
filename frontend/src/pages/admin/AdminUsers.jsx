import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import '../../styles/admin-responsive.css';
import { Users, Search, Filter, Download, Mail, Phone, Ban, CheckCircle, DollarSign, Calendar, Eye, X, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, suspended
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [bookingsData, setBookingsData] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const [usersRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/users?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/bookings?limit=10000`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const allUsers = usersRes.data.users?.filter(u => u.role === 'customer') || [];
      const bookings = bookingsRes.data.bookings || [];

      // Calculate metrics per user
      const userMetrics = {};
      allUsers.forEach(user => {
        const userBookings = bookings.filter(b => (b.user_id === user.id || b.customer_id === user.id));
        const totalSpent = userBookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
        const lastBooking = userBookings.length > 0 ? 
          new Date(Math.max(...userBookings.map(b => new Date(b.booked_at)))) : null;

        userMetrics[user.id] = {
          totalBookings: userBookings.length,
          totalSpent,
          lastBooking,
          isActive: lastBooking && (new Date() - lastBooking) < 30 * 24 * 60 * 60 * 1000 // Active in last 30 days
        };
      });

      setBookingsData(userMetrics);
      setUsers(allUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/users/${userId}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User suspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/users/${userId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User activated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleAdjustCredits = async (userId, amount) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/users/${userId}/adjust-credits`, 
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Credits adjusted by ₹${amount}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to adjust credits');
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Last Booking', 'Status'].join(','),
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone || 'N/A',
        bookingsData[u.id]?.totalBookings || 0,
        bookingsData[u.id]?.totalSpent?.toFixed(0) || 0,
        bookingsData[u.id]?.lastBooking?.toLocaleDateString() || 'Never',
        u.status || 'active'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported!');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'active') matchesFilter = bookingsData[user.id]?.isActive;
    else if (filterStatus === 'inactive') matchesFilter = !bookingsData[user.id]?.isActive;
    else if (filterStatus === 'suspended') matchesFilter = user.status === 'suspended';
    
    return matchesSearch && matchesFilter;
  });

  // Calculate summary stats
  const stats = {
    total: users.length,
    active: users.filter(u => bookingsData[u.id]?.isActive).length,
    inactive: users.filter(u => !bookingsData[u.id]?.isActive).length,
    suspended: users.filter(u => u.status === 'suspended').length,
    totalRevenue: Object.values(bookingsData).reduce((sum, data) => sum + (data.totalSpent || 0), 0)
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
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
      
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#1e293b',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Customer Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>
              {filteredUsers.length} customers
            </p>
          </div>
          
          <button
            onClick={exportUsers}
            style={{
              padding: '0.875rem 1.5rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              fontSize: '15px',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Users size={28} color="#3B82F6" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Total Customers</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              {stats.total}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <CheckCircle size={28} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Active</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
              {stats.active}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <DollarSign size={28} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Total Revenue</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Math.round(stats.totalRevenue).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Ban size={28} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Suspended</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444', fontFamily: 'Outfit, sans-serif' }}>
              {stats.suspended}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '2rem',
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Users Table */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CUSTOMER</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CONTACT</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>BOOKINGS</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>SPENT</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>LAST ACTIVE</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} style={{ borderTop: '1px solid #f1f5f9' }}>
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
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                            {user.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            ID: {user.id?.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {user.phone || 'No phone'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                        {bookingsData[user.id]?.totalBookings || 0}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{Math.round(bookingsData[user.id]?.totalSpent || 0).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                      {bookingsData[user.id]?.lastBooking?.toLocaleDateString() || 'Never'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.375rem 0.875rem',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: bookingsData[user.id]?.isActive ? '#10b98115' : '#94a3b815',
                        color: bookingsData[user.id]?.isActive ? '#10b981' : '#64748b'
                      }}>
                        {bookingsData[user.id]?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: '2px solid #3B82F6',
                            borderRadius: '8px',
                            color: '#3B82F6',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => user.status === 'suspended' ? handleActivateUser(user.id) : handleSuspendUser(user.id)}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: `2px solid ${user.status === 'suspended' ? '#10b981' : '#ef4444'}`,
                            borderRadius: '8px',
                            color: user.status === 'suspended' ? '#10b981' : '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          {user.status === 'suspended' ? <CheckCircle size={16} /> : <Ban size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
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
              zIndex: 1000
            }}
            onClick={() => setShowUserModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  {selectedUser.name}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
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

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>Total Bookings</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
                      {bookingsData[selectedUser.id]?.totalBookings || 0}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>Total Spent</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                      ₹{Math.round(bookingsData[selectedUser.id]?.totalSpent || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>Contact Information</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '15px', color: '#1e293b' }}>
                      <Mail size={16} color="#64748b" />
                      {selectedUser.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '15px', color: '#1e293b' }}>
                      <Phone size={16} color="#64748b" />
                      {selectedUser.phone || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleAdjustCredits(selectedUser.id, 100)}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    Add 100 Credits
                  </button>
                  <button
                    onClick={() => selectedUser.status === 'suspended' ? handleActivateUser(selectedUser.id) : handleSuspendUser(selectedUser.id)}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: selectedUser.status === 'suspended' ? '#10b981' : '#ef4444',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    {selectedUser.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                  </button>
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

export default AdminUsers;