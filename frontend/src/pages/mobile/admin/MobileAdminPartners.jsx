import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../../../App';
import MobileAdminLayout from '../../../layouts/MobileAdminLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MobileAdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      setPartners([]);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerAction = async (partnerId, action) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.patch(
        `${API}/admin/partners/${partnerId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Partner ${action}d successfully`);
      fetchPartners();
    } catch (error) {
      toast.error(`Failed to ${action} partner`);
    }
  };

  const filteredPartners = partners.filter(partner => {
    if (filter === 'all') return true;
    return partner.status === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'All', count: partners.length },
    { value: 'pending', label: 'Pending', count: partners.filter(p => p.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: partners.filter(p => p.status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: partners.filter(p => p.status === 'rejected').length }
  ];

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <MagicHeader
          title="Partners"
          subtitle="Manage platform partners"
          gradient="from-purple-500 via-pink-500 to-red-500"
        />

        <div className="px-4 pb-24 -mt-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                  filter === option.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </motion.button>
            ))}
          </div>

          {/* Partners List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          ) : filteredPartners.length > 0 ? (
            <div className="space-y-4">
              {filteredPartners.map((partner, index) => (
                <GlassCard key={partner.id} delay={0.05 * index}>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 truncate">
                            {partner.brand_name || partner.name || 'Partner'}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                            partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {partner.status}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{partner.email}</span>
                          </div>
                          {partner.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{partner.phone}</span>
                            </div>
                          )}
                          {partner.address?.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{partner.address.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for pending partners */}
                    {partner.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePartnerAction(partner.id, 'approve')}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePartnerAction(partner.id, 'reject')}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </motion.button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard>
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No partners found</h3>
                <p className="text-gray-600">Try adjusting your filter</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </MobileAdminLayout>
  );
};

export default MobileAdminPartners;