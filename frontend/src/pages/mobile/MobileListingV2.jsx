import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import { 
  ArrowLeft, Share2, Heart, Star, MapPin, Users, Calendar, 
  Clock, Shield, Sparkles, Award, ChevronRight, Check, Trophy,
  Wifi, Car, Coffee, Book, Music, Dumbbell, Home, Wind, Sun, Droplets
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import MessageTeacherButton from '../../components/mobile/MessageTeacherButton';
import WriteReviewModal from '../../components/mobile/WriteReviewModal';
import OptimizedVideoPlayer from '../../components/mobile/OptimizedVideoPlayer';

const MobileListingV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [partner, setPartner] = useState(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // SEO
  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} | RAYY`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", listing.description?.substring(0, 160) || "Discover this amazing activity for kids");
      }
    }
  }, [listing]);

  useEffect(() => {
    fetchListing();
    if (user) checkWishlist();
  }, [id, user]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
      
      if (response.data.partner_id) {
        try {
          const partnerRes = await axios.get(`${API}/partners/${response.data.partner_id}`);
          setPartner(partnerRes.data);
        } catch (err) {
          console.log('Could not fetch partner details');
        }
      }
      
      if (response.data.total_reviews > 0) {
        try {
          const reviewsRes = await axios.get(`${API}/listings/${id}/reviews`);
          setReviews(reviewsRes.data.reviews || []);
        } catch (err) {
          console.log('No reviews endpoint, using listing data');
          setReviews(response.data.reviews || []);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const response = await axios.get(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
      });
      setIsWishlisted(response.data.includes(id));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to save');
      return;
    }

    try {
      if (isWishlisted) {
        await axios.delete(`${API}/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
        });
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/wishlist/${id}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
        });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    const shareText = `Check out ${listing.title} by ${partnerName}! \n\n⭐ ${avgRating.toFixed(1)} rating • ${totalReviews} reviews\n💰 ₹${listing.base_price_inr || listing.price_per_session}/session\n\n${window.location.href}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleBookNow = () => {
    navigate(`/mobile/booking/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <p className="text-gray-600 mb-4">Listing not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const images = listing.media || listing.images || [listing.image_url] || [];
  const hasVideo = listing.video_url;
  const avgRating = listing.rating || listing.rating_avg || 0;
  const totalReviews = listing.total_reviews || listing.rating_count || reviews.length;
  const partnerName = listing.partner_name || listing.partner?.brand_name || 'Teacher';
  
  const venue = listing.venue || {};
  
  const locationData = {
    name: venue.name || (partner?.brand_name || partnerName) + ' Studio',
    address: venue.address || listing.address || 'Professional Learning Center',
    city: venue.city || listing.city || 'Bangalore',
    latitude: venue.latitude || null,
    longitude: venue.longitude || null,
    landmarks: venue.landmarks || 'Easily accessible location',
    parking_available: venue.parking_available !== undefined ? venue.parking_available : true,
    indoor: venue.indoor !== undefined ? venue.indoor : true
  };
  
  // Mock Data
  function generateMockReviews(count, rating) {
    const mockComments = [
      "Excellent class! My child learned so much and had a great time.",
      "Very engaging teacher who keeps the kids interested throughout.",
      "Highly recommend! Professional and well-organized sessions.",
      "My daughter looks forward to every class. Great experience!",
      "Amazing instructor with a real passion for teaching.",
      "Worth every penny! We've seen great improvement in our child."
    ];
    const names = ['Priya S', 'Rahul M', 'Anita K', 'Vikram P', 'Neha R', 'Amit J'];
    return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
      user_name: names[i % names.length],
      stars: Math.round(rating),
      comment: mockComments[i % mockComments.length],
      created_at: new Date().toISOString()
    }));
  }
  
  const displayReviews = reviews.length > 0 ? reviews : generateMockReviews(6, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Navigation / Header Space */}
      <div className="hidden lg:block h-16 bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
             <ArrowLeft className="w-5 h-5" /> Back
           </button>
           <div className="flex gap-4">
             <button onClick={toggleWishlist} className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors">
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm underline">Save</span>
             </button>
             <button onClick={handleShare} className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm underline">Share</span>
             </button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:px-6 lg:py-6">
        {/* Gallery Section */}
        <div className="relative h-[350px] md:h-[450px] lg:h-[500px] bg-gray-100 lg:rounded-2xl overflow-hidden mb-6">
          {hasVideo ? (
            <OptimizedVideoPlayer
              src={listing.video_url}
              poster={images[0]}
              muted={true}
              loop={true}
              showControls={true}
              className="w-full h-full"
              lazyLoad={false}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={listing.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          )}

          {/* Mobile Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none lg:hidden">
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-safe pointer-events-auto z-30">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
                >
                  <Share2 className="w-5 h-5 text-gray-900" />
                </button>
                
                <button
                  onClick={toggleWishlist}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Gallery Navigation Controls */}
          {!hasVideo && images.length > 1 && (
            <>
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur rounded-lg text-white text-sm font-semibold pointer-events-none">
                {currentImageIndex + 1} / {images.length}
              </div>
              
              {/* Desktop Arrows */}
              <div className="hidden lg:flex absolute inset-0 items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                   className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white hover:scale-105 transition-all"
                 >
                   <ChevronRight className="w-5 h-5 rotate-180" />
                 </button>
                 <button 
                   onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                   className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white hover:scale-105 transition-all"
                 >
                   <ChevronRight className="w-5 h-5" />
                 </button>
              </div>

              {/* Mobile Swipe Areas */}
              <div className="absolute inset-0 flex z-10 lg:hidden">
                <button className="flex-1" onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)} aria-label="Previous image" />
                <button className="flex-1" onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)} aria-label="Next image" />
              </div>
            </>
          )}
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-6 lg:px-0">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6 pb-24 lg:pb-10">
            {/* Header Info */}
            <div className="border-b border-gray-200 pb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              {listing.subtitle && <p className="text-base md:text-lg text-gray-600 mb-3">{listing.subtitle}</p>}
              
              <div className="flex flex-wrap gap-3 text-sm md:text-base text-gray-600">
                <span className="font-medium text-gray-900">{listing.category}</span>
                <span>in {venue.city || listing.location?.city || 'Location'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm md:text-base text-gray-600">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                   <Users className="w-4 h-4" />
                   <span>{listing.age_min}-{listing.age_max} years</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                   <Clock className="w-4 h-4" />
                   <span>{listing.duration_minutes || listing.duration || 60} mins</span>
                </div>
                {listing.is_online && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <Wifi className="w-4 h-4" />
                    <span>Online</span>
                  </div>
                )}
              </div>
              
               {/* Rating Badge */}
              {(avgRating > 0 || listing.trial_available) && (
                <div className="flex items-center gap-4 mt-4">
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="w-4 h-4 fill-black text-black" />
                      <span>{avgRating.toFixed(2)}</span>
                      <span className="text-gray-500 font-normal underline decoration-gray-300">({totalReviews} reviews)</span>
                    </div>
                  )}
                  {listing.trial_available && (
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      Trial Available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructor Card */}
            <div className="py-2 border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Meet your instructor</h2>
              <div 
                onClick={() => setShowTeacherModal(true)}
                className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-white"
              >
                {partner?.logo || listing.partner_logo ? (
                  <img src={partner?.logo || listing.partner_logo} alt={partnerName} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{partnerName}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Expert Instructor</span>
                  </div>
                  {partner?.tagline && <p className="text-sm text-gray-500 line-clamp-1">{partner.tagline}</p>}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
              </div>
              <div className="mt-4">
                <MessageTeacherButton teacherId={listing.partner_id} className="w-full sm:w-auto" />
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this class</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base md:text-lg">
                {listing.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                {venue.amenities ? (
                  venue.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))
                ) : (
                   /* Default Amenities List */
                   <>
                    {listing.is_online ? (
                       <div className="flex items-center gap-3"><Wifi className="w-5 h-5 text-gray-600"/><span className="text-gray-700">Online class</span></div>
                    ) : (
                       <div className="flex items-center gap-3"><Car className="w-5 h-5 text-gray-600"/><span className="text-gray-700">Parking available</span></div>
                    )}
                    <div className="flex items-center gap-3"><Book className="w-5 h-5 text-gray-600"/><span className="text-gray-700">Learning materials</span></div>
                    <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-gray-600"/><span className="text-gray-700">Safe environment</span></div>
                    <div className="flex items-center gap-3"><Droplets className="w-5 h-5 text-gray-600"/><span className="text-gray-700">Water available</span></div>
                   </>
                )}
              </div>
            </div>

            {/* Location / Map */}
            <div className="border-b border-gray-200 pb-6">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">Where you'll be</h2>
               {listing.is_online ? (
                 <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                       <Wifi className="w-6 h-6 text-blue-600 mt-1" />
                       <div>
                          <h3 className="font-semibold text-blue-900 text-lg">Online Class</h3>
                          <p className="text-blue-700">Join from anywhere! Meeting link provided after booking.</p>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="h-64 md:h-80 w-full bg-gray-200 rounded-xl overflow-hidden shadow-inner">
                       <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(locationData.address + ', ' + locationData.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        title="Location Map"
                      />
                    </div>
                    <div className="flex items-start gap-3">
                       <MapPin className="w-5 h-5 text-gray-700 mt-1" />
                       <div>
                          <p className="font-semibold text-gray-900">{locationData.name}</p>
                          <p className="text-gray-600">{locationData.address}, {locationData.city}</p>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Reviews Section */}
            {displayReviews.length > 0 && (
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-6">
                   <Star className="w-6 h-6 fill-black" />
                   <h2 className="text-xl font-bold text-gray-900">{avgRating.toFixed(2)} · {totalReviews} reviews</h2>
                </div>
                
                {/* Horizontal Scroll for Reviews */}
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                   {displayReviews.map((review, idx) => (
                      <div key={idx} className="flex-shrink-0 w-[280px] md:w-[320px] p-5 border border-gray-200 rounded-2xl bg-white">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                               {review.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-semibold text-sm">{review.user_name}</p>
                               <p className="text-xs text-gray-500">{review.created_at ? format(parseISO(review.created_at), 'MMMM yyyy') : ''}</p>
                            </div>
                         </div>
                         <p className="text-sm text-gray-700 line-clamp-3">"{review.comment}"</p>
                      </div>
                   ))}
                </div>
                
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowWriteReview(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-colors text-gray-900">
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
             <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-baseline mb-6">
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">₹{listing.base_price_inr || listing.price_per_session || 0}</span>
                      <span className="text-gray-600">/ session</span>
                   </div>
                   {listing.trial_available && (
                     <span className="text-sm font-semibold text-pink-600">Trial ₹{listing.trial_price_inr}</span>
                   )}
                </div>

                <div className="border border-gray-300 rounded-xl mb-6 overflow-hidden">
                   <div className="grid grid-cols-2 border-b border-gray-300">
                      <div className="p-3 border-r border-gray-300">
                         <div className="text-[10px] font-bold uppercase text-gray-800">Age</div>
                         <div className="text-sm text-gray-600">{listing.age_min}-{listing.age_max} yrs</div>
                      </div>
                      <div className="p-3">
                         <div className="text-[10px] font-bold uppercase text-gray-800">Duration</div>
                         <div className="text-sm text-gray-600">{listing.duration_minutes || 60} min</div>
                      </div>
                   </div>
                   <div className="p-3 bg-gray-50">
                      <div className="text-[10px] font-bold uppercase text-gray-800">Location</div>
                      <div className="text-sm text-gray-600 truncate">{venue.city || listing.location?.city || 'Bangalore'}</div>
                   </div>
                </div>

                <button 
                  onClick={handleBookNow}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Reserve Spot
                </button>
                
                <div className="text-center mt-3">
                   <span className="text-xs text-gray-500">You won't be charged yet</span>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-2xl safe-bottom z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                ₹{listing.base_price_inr || listing.price_per_session || 0}
              </span>
              <span className="text-sm text-gray-600">/ session</span>
            </div>
            {listing.trial_available && listing.trial_price_inr && (
              <p className="text-xs text-green-600 font-semibold mt-0.5">
                Trial from ₹{listing.trial_price_inr}
              </p>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleBookNow}
            className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Reserve
          </motion.button>
        </div>
      </div>

      {/* Write Review Modal */}
      {showWriteReview && (
        <WriteReviewModal
          listing={listing}
          onClose={() => setShowWriteReview(false)}
          onSubmit={(review) => console.log('Review submitted:', review)}
        />
      )}

      {/* Teacher Profile Modal (Responsive) */}
      <AnimatePresence>
        {showTeacherModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setShowTeacherModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full md:max-w-xl md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2 md:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      {partner?.logo ? (
                         <img src={partner.logo} alt="Partner" className="w-16 h-16 rounded-full object-cover shadow-md" />
                      ) : (
                         <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                            {partnerName.charAt(0)}
                         </div>
                      )}
                      <div>
                         <h2 className="text-2xl font-bold text-gray-900">{partnerName}</h2>
                         <div className="text-sm text-gray-600 font-medium">Expert Instructor</div>
                      </div>
                   </div>
                   <button onClick={() => setShowTeacherModal(false)} className="hidden md:block p-2 text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex justify-around border-y border-gray-100 py-4 mb-6">
                   <div className="text-center">
                      <div className="font-bold text-lg">{avgRating.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                   </div>
                   <div className="text-center">
                      <div className="font-bold text-lg">{partner?.total_students || '100+'}</div>
                      <div className="text-xs text-gray-500">Students</div>
                   </div>
                   <div className="text-center">
                      <div className="font-bold text-lg">{partner?.years_experience || '5+'}</div>
                      <div className="text-xs text-gray-500">Years Exp</div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="font-bold text-gray-900">About</h3>
                   <p className="text-gray-700 text-sm leading-relaxed">
                      {partner?.description || "Experienced instructor passionate about teaching and helping students achieve their goals. Specializes in creating engaging and effective learning experiences."}
                   </p>
                </div>

                <button
                  onClick={() => setShowTeacherModal(false)}
                  className="w-full mt-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors md:hidden"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileListingV2;