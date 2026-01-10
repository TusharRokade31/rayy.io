import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import { 
  ArrowLeft, Search, SlidersHorizontal, X, MapPin, 
  Calendar, Users, DollarSign, Star, Sparkles, TrendingUp,
  Filter, ChevronDown, Check
} from 'lucide-react';
import { toast } from 'sonner';

const SearchComponent = () => { // Renamed from MobileSearch to generic SearchComponent
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minAge: '',
    maxAge: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    trialAvailable: false,
    isOnline: '',
    date: '',
    sortBy: 'rating'
  });
  
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  useEffect(() => {
    performSearch();
  }, [searchQuery, filters.sortBy]);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.category) count++;
    if (filters.minAge || filters.maxAge) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.rating) count++;
    if (filters.trialAvailable) count++;
    if (filters.isOnline !== '') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
      });
      setWishlist(response.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.category) params.append('category', filters.category);
      if (filters.minAge) params.append('age_min', filters.minAge);
      if (filters.maxAge) params.append('age_max', filters.maxAge);
      if (filters.minPrice) params.append('price_min', filters.minPrice);
      if (filters.maxPrice) params.append('price_max', filters.maxPrice);
      if (filters.rating) params.append('min_rating', filters.rating);
      if (filters.trialAvailable) params.append('trial_available', 'true');
      if (filters.isOnline !== '') params.append('is_online', filters.isOnline);
      
      const response = await axios.get(`${API}/search?${params.toString()}`);
      let results = response.data.listings || [];
      results = sortListings(results, filters.sortBy);
      
      setListings(results);
      setLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setLoading(false);
    }
  };

  const sortListings = (data, sortBy) => {
    const sorted = [...data];
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => (a.base_price_inr || 0) - (b.base_price_inr || 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.base_price_inr || 0) - (a.base_price_inr || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
      default:
        return sorted;
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    performSearch();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minAge: '',
      maxAge: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      trialAvailable: false,
      isOnline: '',
      date: '',
      sortBy: 'rating'
    });
    setShowFilters(false);
  };

  const toggleWishlist = async (listingId) => {
    if (!user) {
      toast.error('Please login to save');
      return;
    }

    try {
      const isInWishlist = wishlist.includes(listingId);
      if (isInWishlist) {
        await axios.delete(`${API}/wishlist/${listingId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
        });
        setWishlist(wishlist.filter(id => id !== listingId));
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/wishlist/${listingId}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
        });
        setWishlist([...wishlist, listingId]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const categories = [
    'Art & Craft', 'Music', 'Dance', 'Sports', 'Coding', 'STEM',
    'Language', 'Life Skills', 'Drama', 'Creative Writing'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Sticky & Responsive */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 md:px-8 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              
              {/* Search Bar - constrained width on desktop */}
              <div className="flex-1 relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="Search classes..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter & Sort Bar */}
          <div className="px-4 md:px-8 pb-3 flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all hover:shadow-sm ${
                activeFiltersCount > 0
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-semibold">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown - Auto width on desktop */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="flex-1 md:flex-none md:w-64 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="popular">🔥 Most Popular</option>
              <option value="price_low">💰 Price: Low to High</option>
              <option value="price_high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <p className="text-sm text-gray-600 mb-6 font-medium">
              {listings.length} {listings.length === 1 ? 'class' : 'classes'} found
            </p>

            {/* Listings Grid - Responsive Grid Layout */}
            {listings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isWishlisted={wishlist.includes(listing.id)}
                    onToggleWishlist={toggleWishlist}
                    onClick={() => navigate(`/mobile/listing/${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <FiltersModal
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onApply={applyFilters}
            onClear={clearFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Listing Card Component
const ListingCard = ({ listing, isWishlisted, onToggleWishlist, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/10]">
        <img
          src={listing.media?.[0] || listing.image_url}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(listing.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:scale-105 transition-transform"
        >
          <motion.div whileTap={{ scale: 0.8 }}>
            {isWishlisted ? (
              <span className="text-lg">❤️</span>
            ) : (
              <span className="text-lg">🤍</span>
            )}
          </motion.div>
        </button>
        
        {listing.trial_available && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-pink-500 text-white text-[10px] md:text-xs font-bold rounded-full shadow-sm">
            Trial Available
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-base md:text-lg">{listing.title}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{listing.partner_name}</p>
        
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600 mb-4">
          {listing.rating > 0 && (
            <>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold text-gray-900">{listing.rating.toFixed(1)}</span>
                <span className="text-gray-400">({listing.total_reviews})</span>
              </div>
              <span className="text-gray-300">•</span>
            </>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{listing.age_min}-{listing.age_max} yrs</span>
          </div>
        </div>

        {/* Price Section - Pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-lg md:text-xl font-bold text-gray-900">
              ₹{listing.base_price_inr || listing.price_per_session}
            </span>
            <span className="text-xs md:text-sm text-gray-500 ml-1">/session</span>
          </div>
          {listing.is_online && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold rounded-full">
              Online
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Filters Modal Component
const FiltersModal = ({ filters, setFilters, categories, onApply, onClear, onClose }) => {
  // Determine if we are on mobile for animation logic
  const isMobile = window.innerWidth < 768;

  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  };

  const desktopModalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <motion.div
        variants={isMobile ? modalVariants : desktopModalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full md:w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Category */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilters({ ...filters, category: filters.category === cat ? '' : cat })}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                    filters.category === cat
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Age Range */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Age Range</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAge}
                  onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="flex items-center text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Price Range</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="flex items-center text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Minimum Rating</h3>
            <div className="flex gap-2">
              {[3, 3.5, 4, 4.5, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? '' : rating })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    filters.rating === rating
                      ? 'bg-yellow-50 border-yellow-400 text-gray-900'
                      : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {rating}<Star className="w-3 h-3 fill-current" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Class Type & Trial */}
          <div className="space-y-6">
             {/* Class Type */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Class Type</h3>
                <div className="flex gap-3">
                <button
                    onClick={() => setFilters({ ...filters, isOnline: filters.isOnline === 'true' ? '' : 'true' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    filters.isOnline === 'true'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Online
                </button>
                <button
                    onClick={() => setFilters({ ...filters, isOnline: filters.isOnline === 'false' ? '' : 'false' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    filters.isOnline === 'false'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                >
                    In-Person
                </button>
                </div>
            </div>
            
            {/* Trial Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-base font-semibold text-gray-900">Trial Available Only</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={filters.trialAvailable}
                        onChange={(e) => setFilters({ ...filters, trialAvailable: e.target.checked })}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 z-10 rounded-b-2xl">
          <button
            onClick={onClear}
            className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-bold text-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
          >
            Show Results
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchComponent;