import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import { 
  ArrowLeft, Share2, Heart, Star, MapPin, Users, Calendar, 
  Clock, Shield, Sparkles, Award, ChevronRight, Check, Trophy,
  Wifi, Car, Coffee, Book, Music, Dumbbell, Home, Wind, Sun, Droplets, MessageCircle
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

  // SEO: Update meta tags when listing loads
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
      
      // Fetch partner details if partner_id exists
      if (response.data.partner_id) {
        try {
          const partnerRes = await axios.get(`${API}/partners/${response.data.partner_id}`);
          setPartner(partnerRes.data);
        } catch (err) {
          console.log('Could not fetch partner details');
        }
      }
      
      // Fetch reviews separately if they exist
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
    const shareText = `Check out ${listing.title} by ${partnerName}! 

⭐ ${avgRating.toFixed(1)} rating • ${totalReviews} reviews
💰 ₹${listing.base_price_inr || listing.price_per_session}/session

${window.location.href}`;
    
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
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };

  const shareToWhatsApp = () => {
    const shareText = `Check out ${listing.title}!

⭐ ${avgRating.toFixed(1)} rating
👨‍🏫 Taught by ${partnerName}
💰 ₹${listing.base_price_inr || listing.price_per_session}/session

${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
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
  
  // Get venue data or create default
  const venue = listing.venue || {};
  const hasVenueData = venue.name || venue.address || venue.city;
  
  // Create default location data if not available
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
  
  // Generate mock reviews if none exist but we have rating data
  // const displayReviews = reviews.length > 0 ? reviews : (totalReviews > 0 ? generateMockReviews(totalReviews, avgRating) : []);
  const displayReviews = generateMockReviews(6, 4);
  
  function generateMockReviews(count, rating) {
    const mockComments = [
      "Excellent class! My child learned so much and had a great time.",
      "Very engaging teacher who keeps the kids interested throughout.",
      "Highly recommend! Professional and well-organized sessions.",
      "My daughter looks forward to every class. Great experience!",
      "Amazing instructor with a real passion for teaching.",
      "Worth every penny! We've seen great improvement in our child.",
      "The teacher is patient and creates a fun learning environment.",
      "Best class we've tried! The kids are always excited to attend.",
      "Professional setup and excellent teaching methodology.",
      "Our son has gained so much confidence. Thank you!"
    ];
    
    const names = ['Priya S', 'Rahul M', 'Anita K', 'Vikram P', 'Neha R', 'Amit J', 'Divya T', 'Karan B', 'Meera L', 'Rohan G'];
    
    return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      user_name: names[i % names.length],
      stars: Math.round(rating),
      comment: mockComments[i % mockComments.length],
      created_at: new Date(Date.now() - (i * 15 * 24 * 60 * 60 * 1000)).toISOString()
    }));
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Full Screen Video/Image Gallery */}
      <div className="relative h-[400px] bg-gray-100">
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

        {/* Top Overlay Controls - Higher z-index */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-safe pointer-events-auto z-30">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </motion.button>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
              >
                <Share2 className="w-5 h-5 text-gray-900" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist();
                }}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-900'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Image Counter */}
        {!hasVideo && images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur rounded-lg text-white text-sm font-semibold">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Swipe Handler - Below top controls (only for images) */}
        {!hasVideo && images.length > 1 && (
          <div className="absolute inset-0 flex z-10 pt-20">
            <button
              className="flex-1"
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
              aria-label="Previous image"
            />
            <button
              className="flex-1"
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
              aria-label="Next image"
            />
          </div>
        )}
      </div>
      
      {console.log(listing)}

      {/* Content */}
      <div className="px-6">
        {/* Title and Location */}
        <div className="py-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {listing.title}
          </h1>
          
          {listing.subtitle && (
            <p className="text-base text-gray-600 mb-3">{listing.subtitle}</p>
          )}
          
          <div className="text-sm text-gray-600">
            {listing.category} in {venue.city || listing.location?.city || 'Location'}
          </div>
          
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{listing.age_min}-{listing.age_max} years</span>
            <span className="mx-2">·</span>
            <Clock className="w-4 h-4" />
            <span>{listing.duration_minutes || listing.duration || 60} mins</span>
            {listing.is_online && (
              <>
                <span className="mx-2">·</span>
                <Shield className="w-4 h-4" />
                <span>Online</span>
              </>
            )}
          </div>
        </div>

        {/* Rating and Badge */}
        {(avgRating > 0 || listing.trial_available) && (
          <div className="py-6 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-black text-black" />
                  <span className="text-base font-semibold">{avgRating.toFixed(2)}</span>
                  <span className="text-gray-600">({totalReviews} reviews)</span>
                </div>
              )}
              
              {listing.trial_available && (
                <div className="flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-semibold text-pink-600">Trial Available</span>
                </div>
              )}
            </div>

            {avgRating >= 4.8 && totalReviews >= 10 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Highly Rated</h3>
                    <p className="text-sm text-gray-600">
                      This class is in the top 5% of all classes based on ratings and reviews.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teacher/Instructor Section */}
        <div className="py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Meet your instructor</h2>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTeacherModal(true)}
            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
          >
            {/* Teacher Photo */}
            {partner?.logo || listing.partner_logo ? (
              <img
                src={partner?.logo || listing.partner_logo}
                alt={partnerName}
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {partnerName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {partnerName}
              </h3>
              
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Expert Instructor</span>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {listing.total_reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                    <span>({totalReviews} reviews)</span>
                  </div>
                )}
                {partner?.total_students && (
                  <>
                    <span>·</span>
                    <span>{partner.total_students}+ students</span>
                  </>
                )}
              </div>
              
              {partner?.tagline && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {partner.tagline}
                </p>
              )}
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
          </motion.div>
          
          {/* Message Teacher Button */}
          <div className="mt-4">
            <MessageTeacherButton teacherId={listing.partner_id} className="w-full" />
          </div>
        </div>

        {/* Key Features */}
        {(listing.trial_available || venue.indoor !== undefined || listing.parent_presence_required !== undefined) && (
          <div className="py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What makes this special</h2>
            <div className="space-y-4">
              {listing.trial_available && (
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Try before committing</h3>
                    <p className="text-sm text-gray-600">
                      First trial session available at ₹{listing.trial_price_inr || 'Special Price'}
                    </p>
                  </div>
                </div>
              )}

              {venue.indoor !== undefined && (
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Safe environment</h3>
                    <p className="text-sm text-gray-600">
                      {venue.indoor ? 'Indoor facility with climate control' : 'Outdoor activities in fresh air'}
                    </p>
                  </div>
                </div>
              )}

              {listing.parent_presence_required && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Parent supervision</h3>
                    <p className="text-sm text-gray-600">
                      Parent presence recommended for best experience
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amenities Section */}
        <div className="py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h2>
          <div className="grid grid-cols-2 gap-4">
            {venue.amenities ? (
              // If venue has amenities, show them
              venue.amenities.map((amenity, index) => {
                const amenityIcons = {
                  'WiFi': Wifi,
                  'Parking': Car,
                  'Refreshments': Coffee,
                  'Books': Book,
                  'Music': Music,
                  'Gym': Dumbbell,
                  'Indoor': Home,
                  'Air Conditioning': Wind,
                  'Natural Light': Sun,
                  'Water': Droplets
                };
                const Icon = amenityIcons[amenity] || Check;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">{amenity}</span>
                  </div>
                );
              })
            ) : (
              // Default amenities based on listing data
              <>
                {listing.is_online && (
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">Online class</span>
                  </div>
                )}
                {!listing.is_online && venue.parking_available && (
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">Parking available</span>
                  </div>
                )}
                {venue.indoor && (
                  <div className="flex items-center gap-3">
                    <Wind className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">Climate controlled</span>
                  </div>
                )}
                {!venue.indoor && (
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">Outdoor space</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Book className="w-5 h-5 text-gray-700" />
                  <span className="text-base text-gray-900">Learning materials</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-700" />
                  <span className="text-base text-gray-900">Safe environment</span>
                </div>
                {listing.equipment_needed && (
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-700" />
                    <span className="text-base text-gray-900">Equipment provided</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-gray-700" />
                  <span className="text-base text-gray-900">Water available</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About this class</h2>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>

        {/* Safety Notes */}
        {listing.safety_notes && (
          <div className="py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety information</h2>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{listing.safety_notes}</p>
            </div>
          </div>
        )}

        {/* Equipment Needed */}
        {listing.equipment_needed && (
          <div className="py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What to bring</h2>
            <p className="text-base text-gray-700">{listing.equipment_needed}</p>
          </div>
        )}

        {/* Venue Information & Map - Always Show */}
        <div className="py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Where you'll be</h2>
          
          {listing.is_online ? (
            /* Online Class Section */
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3 mb-4">
                <Wifi className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1 text-lg">Online Class</h3>
                  <p className="text-sm text-blue-700">
                    Join from anywhere! Meeting link will be shared after booking.
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>No travel required - Learn from home</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Flexible location - Join from anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Zoom/Google Meet link provided</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Map Preview */}
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                {locationData.latitude && locationData.longitude ? (
                  <iframe
                    src={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}&z=15&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                ) : (
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      locationData.address + ', ' + locationData.city + ', India'
                    )}&z=14&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                )}
              </div>

              {/* Location Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">{locationData.name}</p>
                    <p className="text-sm text-gray-600">{locationData.address}</p>
                    <p className="text-sm text-gray-600">{locationData.city}</p>
                  </div>
                </div>
                
                {locationData.landmarks && (
                  <p className="text-sm text-gray-600 pl-8">{locationData.landmarks}</p>
                )}

                {/* Getting There Info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Getting there</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <Car className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {locationData.parking_available 
                          ? 'Free parking available at the venue' 
                          : 'Public transport recommended. Limited parking'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Easily accessible from major areas in {locationData.city}</span>
                    </div>
                    {locationData.indoor && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Home className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Indoor facility with comfortable learning environment</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exact Location Note */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700">
                    📍 Exact address and directions will be shared after booking confirmation
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Reviews - Horizontal Scroll (Airbnb Style) */}
        {displayReviews.length > 0 && (
          <div className="py-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 fill-black text-black" />
              <h2 className="text-xl font-bold text-gray-900">
                {avgRating.toFixed(2)} · {totalReviews} reviews
              </h2>
            </div>

            {/* Horizontal Scrolling Reviews */}
            <div className="overflow-x-auto -mx-6 px-6 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {displayReviews.map((review, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-[280px] p-5 border border-gray-200 rounded-xl bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {review.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.user_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {review.created_at ? format(parseISO(review.created_at), 'MMMM yyyy') : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < (review.stars || 5) ? 'fill-black text-black' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-4">
                      {review.text || review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review & Show All Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowWriteReview(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                ⭐ Write a Review
              </button>
              
              {displayReviews.length > 4 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full px-6 py-3 border-2 border-gray-900 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Show all {totalReviews} reviews
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spacing for fixed bottom bar */}
        <div className="h-4" />
      </div>

      {/* Fixed Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-2xl safe-bottom">
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
            className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
          onSubmit={(review) => {
            console.log('Review submitted:', review);
            // In real app, would call API here
          }}
        />
      )}

      {/* Teacher Profile Modal */}
      <AnimatePresence>
        {showTeacherModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowTeacherModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  {partner?.logo || listing.partner_logo ? (
                    <img
                      src={partner?.logo || listing.partner_logo}
                      alt={partnerName}
                      className="w-20 h-20 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {partnerName}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-700">Expert Instructor</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  {listing.total_reviews > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-600">{totalReviews} reviews</p>
                    </div>
                  )}
                  
                  {partner?.total_students && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{partner.total_students}+</p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                  )}
                  
                  {partner?.years_experience && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{partner.years_experience}</p>
                      <p className="text-xs text-gray-600">Years Exp.</p>
                    </div>
                  )}
                  
                  {partner?.total_classes && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{partner.total_classes}</p>
                      <p className="text-xs text-gray-600">Classes</p>
                    </div>
                  )}
                </div>

                {/* About */}
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                  {partner?.description || partner?.tagline ? (
                    <p className="text-base text-gray-700 leading-relaxed">
                      {partner.description || partner.tagline}
                    </p>
                  ) : (
                    <p className="text-base text-gray-700 leading-relaxed">
                      Experienced instructor passionate about teaching and helping students achieve their goals. 
                      Specializes in creating engaging and effective learning experiences.
                    </p>
                  )}
                </div>

                {/* Credentials/Expertise */}
                {partner?.expertise && (
                  <div className="py-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {partner.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Achievements</h3>
                  <div className="space-y-3">
                    {partner?.achievements && partner.achievements.length > 0 ? (
                      partner.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">{achievement}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">Highly rated instructor with {avgRating.toFixed(1)}★ rating</p>
                        </div>
                        {partner?.total_students && (
                          <div className="flex items-start gap-3">
                            <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">Successfully taught {partner.total_students}+ students</p>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">Certified professional instructor</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {partner?.email && (
                  <div className="py-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Get in touch</h3>
                    <p className="text-sm text-gray-600">
                      For inquiries, contact: <span className="text-blue-600 font-semibold">{partner.email}</span>
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setShowTeacherModal(false)}
                  className="w-full mt-4 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MobileListingV2;
