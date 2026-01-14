import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { Users, Search, Download, Mail, Phone, Ban, CheckCircle, DollarSign, Eye, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/admin/users`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      const allUsers = response.data.users?.filter(u => u.role === 'customer') || [];
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
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
      ['Name', 'Email', 'Phone', 'Role', 'Joined Date', 'Status'].join(','),
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone || 'N/A',
        u.role,
        new Date(u.created_at).toLocaleDateString(),
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
    if (filterStatus === 'active') matchesFilter = user.status !== 'suspended';
    else if (filterStatus === 'suspended') matchesFilter = user.status === 'suspended';
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status !== 'suspended').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    totalRevenue: 0 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-outfit mb-2">
              Customer Management
            </h1>
            <p className="text-slate-500 font-outfit">
              {filteredUsers.length} total customers
            </p>
          </div>
          
          <button
            onClick={exportUsers}
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-sm shadow-emerald-200"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard 
            icon={Users} 
            color="text-blue-500" 
            label="Total Customers" 
            value={stats.total} 
          />
          <StatCard 
            icon={CheckCircle} 
            color="text-emerald-500" 
            label="Active Accounts" 
            value={stats.active} 
          />
          <StatCard 
            icon={DollarSign} 
            color="text-amber-500" 
            label="Total Revenue" 
            value="--" 
          />
          <StatCard 
            icon={Ban} 
            color="text-red-500" 
            label="Suspended" 
            value={stats.suspended} 
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-outfit text-slate-700"
            />
          </div>
          
          <div className="w-full md:w-auto relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-48 pl-10 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:outline-none font-semibold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 font-outfit">
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            ID: {user.id?.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 mb-1">{user.email}</div>
                      <div className="text-xs text-slate-500">{user.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500 font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        user.status === 'suspended' 
                          ? 'bg-red-50 text-red-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {user.status === 'suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => user.status === 'suspended' ? handleActivateUser(user.id) : handleSuspendUser(user.id)}
                          className={`p-2 rounded-lg transition-colors border border-transparent ${
                            user.status === 'suspended' 
                              ? 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100' 
                              : 'text-red-500 hover:bg-red-50 hover:border-red-100'
                          }`}
                          title={user.status === 'suspended' ? "Activate User" : "Suspend User"}
                        >
                          {user.status === 'suspended' ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No users found</h3>
                <p className="text-slate-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => setShowUserModal(false)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 font-outfit">{selectedUser.name}</h2>
              <button 
                onClick={() => setShowUserModal(false)}
                className="p-2 bg-white hover:bg-slate-100 rounded-full transition-colors shadow-sm text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Role</div>
                  <div className="text-lg font-bold text-blue-600 capitalize">{selectedUser.role}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Joined Date</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <Mail size={16} />
                    </div>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                      <Phone size={16} />
                    </div>
                    <span className="font-medium">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleAdjustCredits(selectedUser.id, 100)}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200"
                >
                  Add 100 Credits
                </button>
                <button
                  onClick={() => selectedUser.status === 'suspended' ? handleActivateUser(selectedUser.id) : handleSuspendUser(selectedUser.id)}
                  className={`flex-1 py-3.5 font-bold rounded-xl transition-all shadow-lg active:scale-95 text-white ${
                    selectedUser.status === 'suspended'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                      : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                  }`}
                >
                  {selectedUser.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for Stat Cards to keep JSX clean
const StatCard = ({ icon: Icon, color, label, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <Icon className={`w-8 h-8 mb-4 ${color}`} />
    <div className="text-sm text-slate-500 font-medium mb-1">{label}</div>
    <div className="text-3xl font-extrabold text-slate-800 font-outfit">{value}</div>
  </div>
);

export default AdminUsers;