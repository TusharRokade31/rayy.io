import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import SafetyBadge from '../../components/mobile/SafetyBadge';
import { Heart, Star, MapPin, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

const MobileWishlistV2 = () => {
  const { user, showAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/wishlist/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure response data is an array
      const data = response.data;
      setListings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching wishlist:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        toast.error('Wishlist endpoint not found. Please check backend.');
      } else {
        toast.error('Failed to load wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (listingId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.delete(`${API}/wishlist/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(listings.filter(l => l.id !== listingId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove');
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center p-4">
          <GlassCard>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-4">Please log in to view your wishlist</p>
              <button
                onClick={() => showAuthModal('customer')}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg"
              >
                Login / Sign Up
              </button>
            </div>
          </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
        <MagicHeader
          title="My Wishlist"
          subtitle={`${listings.length} saved activities`}
          gradient="from-pink-500 via-rose-500 to-red-500"
        />

        <div className="p-4 pb-24 -mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
            </div>
          ) : listings.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-4">Start adding activities you love!</p>
                <button
                  onClick={() => navigate('/mobile')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Explore Activities
                </button>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {listings.map((listing, index) => (
                  <GlassCard key={listing.id} delay={index * 0.05} hover={false}>
                    <div className="flex gap-3">
                      {/* Image */}
                      <div 
                        onClick={() => navigate(`/mobile/listing/${listing.id}`)}
                        className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer bg-gray-100"
                      >
                        <img
                          src={listing.media?.[0] || listing.image || 'https://via.placeholder.com/200x200?text=No+Image'}
                          alt={listing.title || 'Activity'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div 
                        onClick={() => navigate(`/mobile/listing/${listing.id}`)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                          {listing.title || 'Untitled Activity'}
                        </h3>
                        
                        <div className="mb-2">
                          <SafetyBadge type="verified" size="small" />
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{listing.location?.city || 'Location N/A'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-base font-bold text-purple-600">
                            ₹{listing.price || '0'}
                          </p>
                          
                          {listing.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold text-gray-900">{listing.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button - Separate from clickable area */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(listing.id);
                        }}
                        className="w-8 h-8 flex-shrink-0 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors self-start"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileWishlistV2;
