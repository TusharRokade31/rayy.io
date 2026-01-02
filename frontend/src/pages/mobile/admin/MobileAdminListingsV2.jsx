import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../../App';
import MobileAdminLayout from '../../../layouts/MobileAdminLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { Package, Eye, CheckCircle, XCircle, DollarSign, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const MobileAdminListingsV2 = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/admin/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Fetched listings:', response);
      setListings(Array.isArray(response.data.listings) ? response.data.listings : []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setListings([]);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleListingAction = async (listingId, action) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(
        `${API}/admin/listings/${listingId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Listing ${action}d successfully`);
      fetchListings();
    } catch (error) {
      toast.error(`Failed to ${action} listing`);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.approval_status === filter;
  });

  const filterOptions = [
    { value: 'pending', label: 'Pending', count: listings.filter(l => l.approval_status === 'pending').length },
    { value: 'approved', label: 'Approved', count: listings.filter(l => l.approval_status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: listings.filter(l => l.approval_status === 'rejected').length },
    { value: 'all', label: 'All', count: listings.length }
  ];

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
        <MagicHeader
          title="Listings"
          subtitle="Review and approve listings"
          gradient="from-green-500 via-emerald-500 to-teal-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                  filter === option.value
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </motion.button>
            ))}
          </div>

          {/* Listings List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="space-y-4">
              {filteredListings.map((listing, index) => (
                <GlassCard key={listing.id} delay={0.05 * index}>
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0">
                        {listing.images && listing.images[0] ? (
                          <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-green-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 line-clamp-2">
                            {listing.title}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            listing.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                            listing.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {listing.approval_status}
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="text-sm text-gray-600 truncate">
                            By: {listing.partner_name || 'Partner'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>₹{listing.price_per_session || listing.base_price_inr}/session</span>
                          </div>
                          {listing.location?.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{listing.location.city}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/mobile/listing/${listing.id}`)}
                            className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </motion.button>
                          {listing.approval_status === 'pending' && (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleListingAction(listing.id, 'approve')}
                                className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleListingAction(listing.id, 'reject')}
                                className="px-3 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
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
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-600">Try adjusting your filter</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </MobileAdminLayout>
  );
};

export default MobileAdminListingsV2;