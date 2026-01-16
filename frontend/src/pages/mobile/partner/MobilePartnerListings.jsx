import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  Package, Plus, Edit, Eye, Trash2, MoreVertical,
  Star, MapPin, Clock, Users, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

const MobilePartnerListings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listingsData = response.data?.listings || response.data || [];
      setListings(Array.isArray(listingsData) ? listingsData : []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setListings([]);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.status === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'All', count: listings.length },
    { value: 'active', label: 'Active', count: listings.filter(l => l.status === 'active').length },
    { value: 'draft', label: 'Draft', count: listings.filter(l => l.status === 'draft').length },
    { value: 'paused', label: 'Paused', count: listings.filter(l => l.status === 'paused').length }
  ];

  return (
    <MobilePartnerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <MagicHeader
          title="My Listings"
          subtitle="Manage your activities"
          gradient="from-purple-500 via-pink-500 to-red-500"
        />

        <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-24 mt-6 sm:mt-8 md:mt-10 max-w-7xl mx-auto">
          {/* Create New Button */}
          <div className="mb-4 sm:mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/partner/listings/create')}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create New Listing
            </motion.button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map(option => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(option.value)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                  filter === option.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
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
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredListings.map((listing, index) => (
                <GlassCard key={listing.id} delay={0.1 * index}>
                  <div className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0">
                        {listing.images && listing.images[0] ? (
                          <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-2">
                            {listing.title}
                          </h3>
                          <div className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            listing.status === 'active' ? 'bg-green-100 text-green-700' :
                            listing.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {listing.status}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-1 mb-2 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">₹{listing.price_per_session || listing.base_price_inr}/session</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            <span>{listing.rating?.toFixed(1) || '0.0'} ({listing.rating_count || 0})</span>
                          </div>
                          {listing.location?.city && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
<MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
<span className="truncate">{listing.location.city}</span>
</div>
)}
</div>                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/partner/listings/edit/${listing.id}`)}
                        className="flex-1 py-1.5 sm:py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="flex-1 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        View
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-8 sm:py-12 px-4">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Create your first listing to get started
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/partner/listings/create')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl inline-flex items-center gap-2 text-xs sm:text-sm transition-all"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Listing
            </motion.button>
          </div>
        </GlassCard>
      )}
    </div>
  </div>
</MobilePartnerLayout>
);};
export default MobilePartnerListings;