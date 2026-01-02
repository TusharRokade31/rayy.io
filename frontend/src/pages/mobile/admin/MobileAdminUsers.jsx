import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../../../App';
import MobileAdminLayout from '../../../layouts/MobileAdminLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { Users, Mail, Phone, Calendar, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const MobileAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { value: 'all', label: 'All Users', count: users.length },
    { value: 'customer', label: 'Customers', count: users.filter(u => u.role === 'customer').length },
    { value: 'partner_owner', label: 'Partners', count: users.filter(u => u.role === 'partner_owner').length }
  ];

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="Users"
          subtitle="Manage platform users"
          gradient="from-blue-500 via-cyan-500 to-teal-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Search Bar */}
          <GlassCard delay={0.1}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              />
            </div>
          </GlassCard>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 my-4 overflow-x-auto pb-2">
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

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <GlassCard key={user.id} delay={0.05 * index}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 truncate">
                            {user.name || 'User'}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            user.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'partner_owner' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'partner_owner' ? 'Partner' : user.role}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard>
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Try adjusting your search or filter</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </MobileAdminLayout>
  );
};

export default MobileAdminUsers;