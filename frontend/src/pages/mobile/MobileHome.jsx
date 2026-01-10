import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import { useLocationPref } from '../../hooks/useLocationPref';
import MobileLayout from '../../layouts/MobileLayout';
// Note: You might want to rename MobileLayout to MainLayout if using across devices, 
// or ensure MobileLayout allows full width on desktop.
import { Star, MapPin, TrendingUp, Sparkles, Award, Clock, Heart, Tent, Users, Palette, Code, Dumbbell, Music, Search } from 'lucide-react';
import MobileWorkshopCard from '../../components/mobile/MobileWorkshopCard';
import MobileCampCard from '../../components/mobile/MobileCampCard';
import SafetySection from '../../components/mobile/SafetySection';
import SafetyBadge from '../../components/mobile/SafetyBadge';
import MobileSplashScreenV2 from '../../components/mobile/MobileSplashScreenV2';
import { toast } from 'sonner';

const MobileHome = () => {
  const { user, showAuthModal } = useContext(AuthContext);
  const { loc, setLoc } = useLocationPref();
  const navigate = useNavigate();
  
  const [trending, setTrending] = useState([]);
  const [trials, setTrials] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nearYou, setNearYou] = useState([]);
  const [newExperiences, setNewExperiences] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [camps, setCamps] = useState([]);
  const [artClasses, setArtClasses] = useState([]);
  const [codingClasses, setCodingClasses] = useState([]);
  const [sportsClasses, setSportsClasses] = useState([]);
  const [musicClasses, setMusicClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('mobile_splash_v2_seen');
    return !hasSeenSplash;
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAge, setSelectedAge] = useState('All Ages');

  // SEO
  useEffect(() => {
    document.title = "Discover Activities for Kids | RAYY";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Find the best activities, workshops, camps, and classes for kids in your area.");
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const locationParams = loc && loc.lat && loc.lng ? 
        `?lat=${loc.lat}&lng=${loc.lng}&radius_km=10` : '';
      
      const [trendingRes, trialsRes] = await Promise.all([
        axios.get(`${API}/home/trending${locationParams}`),
        axios.get(`${API}/home/trials${locationParams}`)
      ]);
      
      const normalizeListingData = (listings) => {
        return listings.map(listing => ({
          ...listing,
          price_per_session: listing.price_per_session || listing.base_price_inr || listing.trial_price_inr,
          partner_name: listing.partner_name || 'Expert Instructor',
          location: listing.location || { city: listing.city || 'Bangalore', address: '' },
          rating: listing.rating || listing.rating_avg || 0,
          images: listing.images || listing.media || []
        }));
      };
      
      const trendingData = normalizeListingData(trendingRes?.data?.listings || []);
      const trialsData = normalizeListingData(trialsRes?.data?.listings || []);
      
      const MAX_LISTINGS_PER_SECTION = 10;
      
      setTrending(trendingData.slice(0, MAX_LISTINGS_PER_SECTION));
      setTrials(trialsData.slice(0, MAX_LISTINGS_PER_SECTION));
      
      const topRatedListings = trendingData.filter(l => l.rating >= 4.5);
      setTopRated(topRatedListings.slice(0, MAX_LISTINGS_PER_SECTION));
      setNearYou(trendingData.slice(10, 20));
      setNewExperiences(trialsData.slice(0, MAX_LISTINGS_PER_SECTION));
      
      const artCategories = ['art', 'painting', 'drawing', 'craft', 'activity'];
      const codingCategories = ['coding', 'programming', 'robotics', 'science', 'chess', 'educational'];
      const sportsCategories = ['sport', 'sports', 'fitness', 'yoga', 'dance', 'athletics', 'football', 'basketball', 'cricket', 'tennis'];
      const musicCategories = ['music', 'singing', 'piano', 'guitar', 'drum'];
      const workshopCategories = ['workshop', 'playzone', 'activity', 'drama', 'photography', 'cooking'];
      const campCategories = ['camp'];
      
      const filterByKeywords = (listing, keywords) => {
        const searchText = `${listing.title} ${listing.category}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      };
      
      const MAX_CATEGORY_ITEMS = 8;
      setArtClasses(trendingData.filter(l => filterByKeywords(l, artCategories)).slice(0, MAX_CATEGORY_ITEMS));
      setCodingClasses(trendingData.filter(l => filterByKeywords(l, codingCategories)).slice(0, MAX_CATEGORY_ITEMS));
      setSportsClasses(trendingData.filter(l => filterByKeywords(l, sportsCategories)).slice(0, MAX_CATEGORY_ITEMS));
      setMusicClasses(trendingData.filter(l => filterByKeywords(l, musicCategories)).slice(0, MAX_CATEGORY_ITEMS));
      setWorkshops(trendingData.filter(l => filterByKeywords(l, workshopCategories)).slice(0, MAX_CATEGORY_ITEMS));
      setCamps(trendingData.filter(l => filterByKeywords(l, campCategories)).slice(0, MAX_CATEGORY_ITEMS));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      if (!token) return;
      const response = await axios.get(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = useCallback(async (listingId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    const token = localStorage.getItem('yuno_token');
    if (!token) {
      toast.error('Please login to continue');
      return;
    }
    try {
      const isInWishlist = wishlist.includes(listingId);
      if (isInWishlist) {
        await axios.delete(`${API}/wishlist/${listingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(prev => prev.filter(id => id !== listingId));
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/wishlist/${listingId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(prev => [...prev, listingId]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update wishlist');
    }
  }, [user, wishlist]);

  const getListingImage = (listing) => {
    let imageUrl = null;
    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      imageUrl = listing.images[0];
    } else if (listing.media && Array.isArray(listing.media) && listing.media.length > 0) {
      imageUrl = listing.media[0];
    } else if (listing.image_url) {
      imageUrl = listing.image_url;
    } else {
      imageUrl = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop';
    }
    
    if (imageUrl && imageUrl.includes('unsplash.com') && !imageUrl.includes('?')) {
      imageUrl += '?w=400&h=300&fit=crop&auto=format';
    } else if (imageUrl && imageUrl.includes('unsplash.com') && !imageUrl.includes('auto=format')) {
      imageUrl += '&auto=format';
    }
    return imageUrl;
  };

  const ListingCard = ({ listing, index }) => {
    const isInWishlist = wishlist.includes(listing.id);
    const hasVideo = listing.video_url;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        // Responsive: w-64 on mobile, w-72 on tablet, w-80 on desktop
        className="flex-shrink-0 w-64 md:w-72 lg:w-80 cursor-pointer group"
        onClick={() => navigate(`/mobile/listing/${listing.id}`)}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-lg mb-3 h-48 md:h-52 lg:h-56">
          <img 
            src={getListingImage(listing)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop';
            }}
          />
          
          {hasVideo && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-lg">
              <span>📹</span>
              Video
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(listing.id);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all z-10"
          >
            <Heart 
              className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
            />
          </motion.button>
          
          {listing.price_per_session && (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-sm font-bold text-gray-900">₹{listing.price_per_session}</span>
              <span className="text-xs text-gray-600 ml-1">/session</span>
            </div>
          )}
        </div>
        
        <div className="px-1">
          <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            {listing.location && (
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="line-clamp-1">{listing.location.city || listing.location.address}</span>
              </div>
            )}
            
            {listing.rating > 0 && (
              <div className="flex items-center">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-yellow-500 mr-0.5" />
                <span className="text-xs md:text-sm font-semibold text-gray-900">{listing.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="mb-2">
            <SafetyBadge type="verified" size="small" />
          </div>
          
          {listing.partner_name && (
            <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
              by {listing.partner_name}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  const HorizontalSection = React.memo(({ title, icon: Icon, listings, gradient }) => {
    if (!listings || listings.length === 0) return null;
    
    return (
      <div className="mb-8 md:mb-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between px-4 md:px-8 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          
          <button 
            onClick={() => navigate('/mobile/search')}
            className="text-sm md:text-base font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 hover:bg-blue-50 rounded-full transition-colors"
          >
            See all
          </button>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex px-4 md:px-8 gap-4 md:gap-6 w-max">
            {listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        </div>
      </div>
    );
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('mobile_splash_v2_seen', 'true');
  }, []);

  if (showSplash) {
    return <MobileSplashScreenV2 onComplete={handleSplashComplete} />;
  }

  return (
    <MobileLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Responsive Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 pt-safe pb-8 md:pb-12 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -left-20 w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pt-2 md:pt-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg md:text-2xl tracking-tight">rayy</h1>
                  <p className="text-white/80 text-xs md:text-sm">Learn • Play • Shine</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!user ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => showAuthModal()}
                    className="bg-white text-purple-600 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    Login
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-3">
                     <span className="hidden md:block text-white font-medium text-sm">Hello, {user.name}</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/mobile/profile')}
                      className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-white/30 transition-all"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Content & Search */}
            <div className="flex flex-col items-center justify-center mt-6 md:mt-12 mb-8 md:mb-16">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="w-full max-w-2xl"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-3xl blur-xl opacity-50" />
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-4 transition-transform hover:scale-[1.01]">
                    <div 
                      onClick={() => navigate('/mobile/search')}
                      className="flex items-center gap-3 md:gap-5 cursor-pointer"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Search className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base md:text-xl">Where to next?</p>
                        <p className="text-xs md:text-sm text-gray-500">Find amazing activities for your kids</p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center"
                      >
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </motion.div>
                    </div>

                    <div className="flex gap-2">
                    {/* Age Filter - Pill Style */}
                    {/* <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAgeModal(true)}
                      className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-3 flex items-center justify-center gap-2 border-2 border-blue-200 hover:border-blue-400 transition-all"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs font-semibold text-gray-500">Age</p>
                        <p className="text-sm font-bold text-gray-900">{selectedAge}</p>
                      </div>
                    </motion.button> */}

                    {/* Location Filter - Pill Style */}
                    {/* <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLocationModal(true)}
                      className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3 flex items-center justify-center gap-2 border-2 border-purple-200 hover:border-purple-400 transition-all"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs font-semibold text-gray-500">Location</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {loc?.city || 'Set location'}
                        </p>
                      </div>
                    </motion.button> */}
                  </div>
                  </div>
                </div>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 md:mt-12"
              >
                {[
                  { icon: '🎭', label: 'Activity', color: 'from-red-400 to-pink-400', search: 'activity' },
                  { icon: '⚽', label: 'Sports', color: 'from-blue-400 to-cyan-400', search: 'sports' },
                  { icon: '📚', label: 'Educational', color: 'from-purple-400 to-indigo-400', search: 'educational' },
                  { icon: '🎮', label: 'Playzone', color: 'from-green-400 to-emerald-400', search: 'playzone' },
                ].map((category, index) => (
                  <motion.div
                    key={category.label}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.1, translateY: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/mobile/search?category=${category.search}`)}
                    className="flex flex-col items-center gap-2 cursor-pointer w-[72px] md:w-24"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${category.color} rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-transform`}>
                      <span className="text-3xl md:text-4xl">{category.icon}</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-white drop-shadow-lg tracking-wide">
                      {category.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="pt-6 pb-8 md:pt-12 md:pb-16 space-y-4 md:space-y-8">
            <HorizontalSection 
              title="Trending Now"
              icon={TrendingUp}
              listings={trending}
              gradient="from-pink-500 to-rose-500"
            />
            
            <HorizontalSection 
              title="Near You"
              icon={MapPin}
              listings={nearYou}
              gradient="from-green-500 to-emerald-500"
            />
            
            {/* Workshops - Responsive Container */}
            {workshops.length > 0 && (
              <div className="mb-8 md:mb-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between px-4 md:px-8 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Workshops</h2>
                  </div>
                  <button onClick={() => navigate('/mobile/search')} className="text-sm md:text-base font-semibold text-blue-600">See all</button>
                </div>
                <div className="overflow-x-auto hide-scrollbar pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex px-4 md:px-8 gap-4 md:gap-6 w-max">
                    {workshops.map((workshop) => (
                      <div key={workshop.id} className="w-[85vw] md:w-96">
                        <MobileWorkshopCard workshop={workshop} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Camps - Responsive Container */}
            {camps.length > 0 && (
              <div className="mb-8 md:mb-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between px-4 md:px-8 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                      <Tent className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Weekend Camps</h2>
                  </div>
                  <button onClick={() => navigate('/mobile/search')} className="text-sm md:text-base font-semibold text-blue-600">See all</button>
                </div>
                <div className="overflow-x-auto hide-scrollbar pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex px-4 md:px-8 gap-4 md:gap-6 w-max">
                    {camps.map((camp) => (
                      <div key={camp.id} className="w-[85vw] md:w-96">
                        <MobileCampCard camp={camp} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <HorizontalSection 
              title="Top Rated"
              icon={Award}
              listings={topRated}
              gradient="from-amber-500 to-yellow-500"
            />
            
            <HorizontalSection 
              title="Free Trials"
              icon={Sparkles}
              listings={trials}
              gradient="from-blue-500 to-indigo-500"
            />
            
            <HorizontalSection 
              title="New Experiences"
              icon={Clock}
              listings={newExperiences}
              gradient="from-purple-500 to-pink-500"
            />
            
            {/* Category Sections */}
            {artClasses.length > 0 && (
              <HorizontalSection title="Art & Craft" icon={Palette} listings={artClasses} gradient="from-pink-500 to-rose-500" />
            )}
            {codingClasses.length > 0 && (
              <HorizontalSection title="Coding & STEM" icon={Code} listings={codingClasses} gradient="from-blue-500 to-cyan-500" />
            )}
            {sportsClasses.length > 0 && (
              <HorizontalSection title="Sports & Fitness" icon={Dumbbell} listings={sportsClasses} gradient="from-green-500 to-lime-500" />
            )}
            {musicClasses.length > 0 && (
              <HorizontalSection title="Music & Dance" icon={Music} listings={musicClasses} gradient="from-violet-500 to-fuchsia-500" />
            )}

            {/* Safety Section */}
            <div className="px-4 md:px-8 mt-8 mb-8 max-w-7xl mx-auto">
              <SafetySection />
            </div>

            {/* Partner Banner */}
            {(!user || user.role === 'customer') && (
            <div className="px-4 md:px-8 mb-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 md:p-10 shadow-xl"
                onClick={() => navigate('/mobile/become-partner')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">
                      Are you a Teacher?
                    </h3>
                    <p className="text-white/90 text-sm md:text-lg mb-4 md:mb-6">
                      Join 500+ partners and reach thousands of parents
                    </p>
                    <button className="bg-white text-purple-600 px-6 py-2 md:px-8 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all">
                      Become a Partner →
                    </button>
                  </div>
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center ml-4">
                    <Users className="w-10 h-10 md:w-16 md:h-16 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>)}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>

      {/* Age Filter Modal - Responsive */}
      <AnimatePresence>
        {showAgeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowAgeModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full md:w-[600px] md:rounded-2xl rounded-t-3xl p-6 pb-8 md:pb-6 shadow-2xl"
            >
              {/* Handle for mobile only */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Select Age Group</h3>
                <button onClick={() => setShowAgeModal(false)} className="hidden md:block text-gray-500 hover:text-gray-700">✕</button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-h-[70vh] overflow-y-auto">
                {[
                  { label: 'All Ages', range: '0-18', gradient: 'from-gray-400 to-slate-500' },
                  { label: '0-2 years', range: 'Toddlers', gradient: 'from-pink-400 to-rose-500' },
                  { label: '3-5 years', range: 'Preschool', gradient: 'from-purple-400 to-pink-500' },
                  { label: '6-8 years', range: 'Early School', gradient: 'from-blue-400 to-cyan-500' },
                  { label: '9-12 years', range: 'Middle School', gradient: 'from-green-400 to-emerald-500' },
                  { label: '13-18 years', range: 'Teenagers', gradient: 'from-orange-400 to-red-500' },
                ].map((age) => (
                  <motion.button
                    key={age.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedAge(age.label);
                      setShowAgeModal(false);
                      toast.success(`Filtered by ${age.label}`);
                    }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      selectedAge === age.label
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${age.gradient} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <p className="font-bold text-gray-900 text-xs md:text-sm">{age.label}</p>
                    <p className="text-xs text-gray-500">{age.range}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Filter Modal - Responsive */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full md:w-[500px] md:rounded-2xl rounded-t-3xl p-6 pb-8 md:pb-6 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Select Location</h3>
                <button onClick={() => setShowLocationModal(false)} className="hidden md:block text-gray-500 hover:text-gray-700">✕</button>
              </div>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {[
                  { city: 'Gurgaon', state: 'Haryana' },
                  { city: 'Delhi', state: 'Delhi NCR' },
                  { city: 'Mumbai', state: 'Maharashtra' },
                  { city: 'Bangalore', state: 'Karnataka' },
                  { city: 'Pune', state: 'Maharashtra' },
                  { city: 'Hyderabad', state: 'Telangana' },
                  { city: 'Online', state: 'Anywhere' },
                ].map((location) => (
                  <motion.button
                    key={location.city}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLoc({ city: location.city, state: location.state });
                      setShowLocationModal(false);
                      toast.success(`Location set to ${location.city}`);
                    }}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all flex items-center gap-3 hover:shadow-sm ${
                      loc?.city === location.city
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-gray-900 text-sm md:text-base">{location.city}</p>
                      <p className="text-xs md:text-sm text-gray-500">{location.state}</p>
                    </div>
                    {loc?.city === location.city && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
};

export default MobileHome;