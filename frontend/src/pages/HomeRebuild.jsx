import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { AuthContext } from '../App';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Search, MapPin, Sparkles, Star, TrendingUp, Calendar, Award, Users, Heart, ChevronRight, Palette, Code, Music, Utensils, Drama, Dumbbell, Microscope, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/home-responsive.css';
import { useLocationPref } from '../hooks/useLocationPref';
import WorkshopCarousel from '../components/WorkshopCarousel';
import CampCarousel from '../components/CampCarousel';
import BadgeOverlay from '../components/BadgeOverlay';
import StarRating from '../components/StarRating';
import SEO from '../components/SEO';

const HomeRebuild = () => {
  const { user, showAuth } = useContext(AuthContext);
  const { loc } = useLocationPref();
  const navigate = useNavigate();
  
  // State
  const [selectedAge, setSelectedAge] = useState(null);
  const [trending, setTrending] = useState([]);
  const [trials, setTrials] = useState([]);
  const [weekendCamps, setWeekendCamps] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [camps, setCamps] = useState([]);
  const [topPartners, setTopPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get image for listing
  const getListingImage = (listing) => {
    // Use listing's images array if available
    if (listing.images && listing.images.length > 0) {
      return listing.images[0];
    }
    // Or image_url if available
    if (listing.image_url) {
      return listing.image_url;
    }
    // Fallback to default
    return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop';
  };

  const ageBands = [
    { label: '1-3', value: '1-3', color: '#FBBF24', age: 2, emoji: '🍼', title: 'Toddlers' },
    { label: '4-6', value: '4-6', color: '#F472B6', age: 5, emoji: '👦🏽', title: 'Preschool' },
    { label: '7-12', value: '7-12', color: '#6EE7B7', age: 9, emoji: '🧑🏻‍💻', title: 'Kids' },
    { label: '13-18', value: '13-18', color: '#8b5cf6', age: 15, emoji: '🧘🏻‍♀️', title: 'Teens' },
    { label: '19-49', value: '19-49', color: '#3B82F6', age: 30, emoji: '💼', title: 'Adults' },
    { label: '50-999', value: '50-999', color: '#F59E0B', age: 65, emoji: '👴', title: 'Elderly', special: true }
  ];

  const interests = [
    { name: 'Art & Craft', icon: Palette, color: '#F472B6', slug: 'art' },
    { name: 'Coding', icon: Code, color: '#3B82F6', slug: 'coding' },
    { name: 'Dance', icon: Music, color: '#FBBF24', slug: 'dance' },
    { name: 'Fitness', icon: Dumbbell, color: '#6EE7B7', slug: 'fitness' },
    { name: 'Drama', icon: Drama, color: '#8b5cf6', slug: 'drama' },
    { name: 'Music', icon: Music, color: '#F97316', slug: 'music' },
    { name: 'STEM', icon: Microscope, color: '#06B6D4', slug: 'coding' },
    { name: 'Cooking', icon: Utensils, color: '#EF4444', slug: 'cooking' },
    { name: 'Sports', icon: Award, color: '#10B981', slug: 'sports' },
    { name: 'Yoga', icon: Heart, color: '#EC4899', slug: 'fitness' },
    { name: 'Photography', icon: Sparkles, color: '#F59E0B', slug: 'art' },
    { name: 'Languages', icon: BookOpen, color: '#8B5CF6', slug: 'languages' },
    { name: 'Chess', icon: Star, color: '#6366F1', slug: 'chess' },
    { name: 'Swimming', icon: Users, color: '#14B8A6', slug: 'sports' },
    { name: 'Robotics', icon: Code, color: '#0EA5E9', slug: 'coding' },
    { name: 'Martial Arts', icon: Award, color: '#DC2626', slug: 'sports' }
  ];

  useEffect(() => {
    fetchHomeData();
  }, [loc]); // Refetch when location changes

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Add location params if available
      const locationParams = loc && loc.lat && loc.lng ? 
        `?lat=${loc.lat}&lng=${loc.lng}&radius_km=10` : '';
      
      const [trendingRes, trialsRes, workshopsRes, campsRes, partnersRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/home/trending${locationParams}`),
        axios.get(`${API}/home/trials${locationParams}`),
        axios.get(`${API}/home/workshops`),
        axios.get(`${API}/home/weekend-camps`),
        axios.get(`${API}/home/top-partners${locationParams}`),
        axios.get(`${API}/categories`)
      ]);
      
      setTrending(trendingRes?.data?.listings || []);
      setTrials(trialsRes?.data?.listings || []);
      setWorkshops(workshopsRes?.data?.workshops || []);
      setCamps(campsRes?.data?.camps || []);
      setTopPartners(partnersRes?.data?.partners || []);
      setCategories(categoriesRes?.data || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  const handleSearch = (ageValue = null) => {
    const age = ageValue || selectedAge;
    console.log('handleSearch called with age:', age);
    if (age) {
      console.log('Navigating to search with age:', age);
      navigate(`/search?age=${age}`);
    } else {
      console.log('Navigating to search without age filter');
      navigate('/search');
    }
  };

  const handlePartnerClick = () => {
    // Always navigate to partner landing page
    navigate('/partner-landing');
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  // Slider settings
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <SEO 
        title="rayy – Discover Best Kids Classes, Camps & Activities Near You"
        description="Find trusted classes, workshops, and camps for kids of all ages. Dance, art, coding, sports, and more. Book verified programs with real reviews from parents in your area."
        keywords="kids classes near me, children activities, dance classes for kids, coding for kids, art classes, sports classes, summer camps, after school programs, extracurricular activities"
        url="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "rayy",
          "description": "Discover the best kids' classes, camps & activities near you",
          "url": process.env.REACT_APP_BASE_URL || window.location.origin,
          "logo": `${process.env.REACT_APP_BASE_URL || window.location.origin}/icon-512.png`,
          "image": `${process.env.REACT_APP_BASE_URL || window.location.origin}/icon-512.png`,
          "priceRange": "₹",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "250"
          }
        }}
      />
      <Navbar />

      {/* ========== SECTION 1: HERO WITH SEARCH & QUICK ACTIONS ========== */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', padding: '3rem 2rem 2.5rem', color: 'white' }}>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}
        >
          {/* Live Activity Indicator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '14px',
              opacity: 0.95
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span>124 parents browsing now</span>
          </motion.div>

          {/* Main Headline - No animation delay for LCP optimization */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '800',
              marginBottom: '0.75rem',
              fontFamily: 'Space Grotesk, sans-serif',
              lineHeight: '1.2'
            }}
          >
            Cool Classes. Happy Kids. ✨
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              marginBottom: '2rem',
              opacity: 0.95,
              maxWidth: '600px'
            }}
          >
            Book trials in 3 taps • {trending.length + trials.length}+ classes available
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <div style={{
              display: 'flex',
              background: 'white',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              alignItems: 'center',
              gap: '0.75rem',
              maxWidth: '700px'
            }}>
              <Search size={22} color="#64748b" />
              <input
                type="text"
                placeholder="Search dance, art, coding, sports..."
                onClick={() => navigate('/search')}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#1e293b',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                readOnly
              />
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#06b6d4',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Search
              </button>
            </div>
          </motion.div>

          {/* Quick Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem'
            }}
          >
            {[
              { name: 'Dance', emoji: '💃', slug: 'dance' },
              { name: 'Art', emoji: '🎨', slug: 'art' },
              { name: 'Coding', emoji: '💻', slug: 'coding' },
              { name: 'Sports', emoji: '⚽', slug: 'sports' },
              { name: 'Music', emoji: '🎵', slug: 'music' }
            ].map((cat, idx) => (
              <motion.button
                key={cat.slug}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/search?category=${cat.slug}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '18px' }}>{cat.emoji}</span>
                {cat.name}
              </motion.button>
            ))}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              fontSize: '14px',
              opacity: 0.9
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} />
              <span>Free trials available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={16} />
              <span>4.8★ average rating</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} />
              <span>{Math.floor(Math.random() * 20) + 15} booked today</span>
            </div>
          </motion.div>
        </motion.div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </section>

      {/* ========== SECTION 2: QUICK AGE PICKER CAROUSEL ========== */}
      <section style={{ padding: '3rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '2rem',
              fontFamily: 'Outfit, sans-serif',
              color: '#1E293B',
              textAlign: 'center'
            }}
          >
            Find classes for your age 🎯
          </motion.h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
          className="age-bands-grid">
            {ageBands.map((band, idx) => (
              <motion.div
                key={band.value}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch(band.value)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(band.value)}
                style={{
                  background: `linear-gradient(135deg, ${band.color}15 0%, ${band.color}05 100%)`,
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: `2px solid ${band.color}30`,
                  transition: 'all 0.3s',
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{band.emoji}</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1E293B',
                  marginBottom: '0.25rem',
                  fontFamily: 'Outfit, sans-serif'
                }}>{band.title}</div>
                <div style={{
                  fontSize: '0.95rem',
                  color: '#64748B',
                  fontFamily: 'Outfit, sans-serif'
                }}>Age {band.label === '50-999' ? '50+' : band.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 2.5: DISCOVER BY INTEREST ========== */}
      {categories.length > 0 && (
        <section style={{ padding: '4rem 0', background: '#ffffff' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: 'center', marginBottom: '3rem' }}
            >
              <h2 
                className="discover-interest-title"
                style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem',
                fontFamily: 'Space Grotesk, sans-serif'
              }}>Discover by Interest 🎯</h2>
            </motion.div>

            <div 
              className="discover-interest-grid"
              style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '1rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {categories
                .filter(cat => cat.slug !== 'slot_booking') // Exclude slot booking
                .slice(0, 12) // Show only 12 categories
                .map((category, idx) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.08, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/search?category=${category.slug}`)}
                  style={{
                    background: 'white',
                    padding: '1.25rem 1rem',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {category.icon}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {category.name}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 3: TRENDING NOW (AUTO-SCROLL CAROUSEL) ========== */}
      {trending.length >= 2 && (
        <section style={{ padding: '4rem 0', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)', overflow: 'hidden' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <TrendingUp size={32} style={{ color: '#6EE7B7' }} />
                </motion.div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  fontFamily: 'Outfit, sans-serif',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Trending Now 🔥</h2>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="btn-scale"
                style={{
                  background: 'white',
                  color: '#3B82F6',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: '2px solid #3B82F6',
                  fontFamily: 'Outfit, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3B82F6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#3B82F6';
                }}
              >
                View All <ChevronRight size={18} />
              </button>
            </motion.div>

            {/* Custom Carousel with Auto-Scroll */}
            <div style={{ 
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              padding: '1rem 0'
            }}>
              <motion.div
                animate={{
                  x: ['0%', '-50%']
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  width: 'fit-content'
                }}
              >
                {/* Duplicate items for seamless loop */}
                {[...trending, ...trending].map((listing, idx) => (
                  <motion.div
                    key={`${listing.id}-${idx}`}
                    whileHover={{ 
                      scale: 1.05,
                      y: -10,
                      zIndex: 10,
                      transition: { duration: 0.3 }
                    }}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      minWidth: '320px',
                      maxWidth: '320px',
                      position: 'relative',
                      transition: 'all 0.3s ease-out'
                    }}
                  >
                    {(listing.images || listing.media) && (listing.images?.[0] || listing.media?.[0]) && (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        backgroundImage: `url(${(listing.images?.[0] || listing.media?.[0])}?w=400&h=200&fit=crop)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)'
                        }} />
                        
                        {/* Trust Badges Overlay */}
                        <BadgeOverlay badges={listing.badges} size="sm" maxDisplay={2} />
                        
                        {/* Badge */}
                        {listing.trial_available && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                            style={{
                              position: 'absolute',
                              top: '1rem',
                              left: '1rem',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              padding: '0.375rem 0.875rem',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            Trial Available ✨
                          </motion.div>
                        )}
                        
                        {/* Rating Badge */}
                        {listing.rating_avg > 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '1rem',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(8px)',
                            padding: '0.375rem 0.875rem',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Star size={14} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                            {listing.rating_avg}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.15rem',
                        fontWeight: '700',
                        marginBottom: '0.75rem',
                        color: '#1E293B',
                        fontFamily: 'Outfit, sans-serif',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>{listing.title}</h3>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginBottom: '1rem', 
                        fontSize: '0.875rem', 
                        color: '#64748B',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={14} />
                          {listing.age_min}-{listing.age_max} yrs
                        </span>
                        {listing.next_session && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontWeight: '600' }}>
                            <Calendar size={14} />
                            {listing.next_session.seats_available || 0} slots
                          </span>
                        )}
                        {listing.is_online && (
                          <span style={{
                            background: '#DBEAFE',
                            color: '#1E40AF',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            Online
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            color: '#3B82F6',
                            fontFamily: 'Outfit, sans-serif'
                          }}>₹{listing.base_price_inr}</div>
                          {listing.trial_available && listing.trial_price_inr && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#10B981',
                              fontWeight: '600'
                            }}>Trial at ₹{listing.trial_price_inr}</div>
                          )}
                        </div>
                        <motion.div
                          whileHover={{ x: 5 }}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          <ChevronRight size={20} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ========== NEW SECTION: EXPERT WORKSHOPS ========== */}
      {workshops.length > 0 && (
        <section style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f7 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                marginBottom: '1rem'
              }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>
                  🎤 EXPERT WORKSHOPS
                </span>
              </div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '1rem',
                fontFamily: 'Outfit, sans-serif'
              }}>
                Learn from Industry Leaders
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#64748b',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                One-time workshops by top entrepreneurs, speakers, and experts. Limited seats - register fast!
              </p>
            </div>

            <WorkshopCarousel workshops={workshops} />

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                onClick={() => navigate('/search?listing_type=workshop')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                View All Workshops →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========== NEW SECTION: WEEKEND CAMPS ========== */}
      {camps.length > 0 && (
        <section style={{ padding: '4rem 2rem', background: '#1e293b' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                marginBottom: '1rem'
              }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>
                  🏕️ WEEKEND CAMPS
                </span>
              </div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '1rem',
                fontFamily: 'Outfit, sans-serif'
              }}>
                Multi-Day Adventure Camps
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.8)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                2-3 day immersive experiences in coding, art, sports, and more. Book your child's weekend adventure!
              </p>
            </div>

            <CampCarousel camps={camps} />

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                onClick={() => navigate('/search?listing_type=camp')}
                style={{
                  background: 'white',
                  color: '#1e293b',
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Explore All Camps →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 4: THIS WEEK'S TRIALS (HORIZONTAL SCROLL) ========== */}
      {trials.length >= 1 && (
        <section style={{ padding: '3rem 0', background: 'white' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{ marginBottom: '1.5rem' }}
            >
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                fontFamily: 'Outfit, sans-serif',
                color: '#1E293B'
              }}>✨ This Week's Trials</h2>
              <p style={{
                fontSize: '0.9375rem',
                color: '#64748B',
                fontFamily: 'Outfit, sans-serif',
                marginTop: '0.25rem'
              }}>Try before you commit</p>
            </motion.div>

            {/* Horizontal Scrollable Container */}
            <div style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              margin: '0 -2rem',
              padding: '0 2rem'
            }}>
              <style>{`
                .trials-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div 
                className="trials-scroll"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingBottom: '1rem'
                }}
              >
                {trials.slice(0, 15).map((listing, idx) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    style={{
                      minWidth: '220px',
                      maxWidth: '220px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                  >
                    {/* Price Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.625rem',
                      right: '0.625rem',
                      background: '#FBBF24',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      fontFamily: 'Outfit, sans-serif',
                      zIndex: 1,
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)'
                    }}>₹{listing.trial_price_inr}</div>

                    {/* Image */}
                    <div style={{
                      width: '100%',
                      height: '120px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#F1F5F9'
                    }}>
                      <img 
                        src={getListingImage(listing)}
                        alt={listing.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop';
                        }}
                      />
                      {/* Overlay gradient */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40px',
                        background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)'
                      }} />
                    </div>

                    {/* Content */}
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <h3 style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#1E293B',
                        fontFamily: 'Outfit, sans-serif',
                        lineHeight: '1.3',
                        minHeight: '2.6rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{listing.title}</h3>

                      {/* Info */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#64748B',
                        marginBottom: '0.75rem'
                      }}>
                        <span>👥 {listing.age_min}-{listing.age_max} years</span>
                        <span>⏱️ {listing.duration_minutes} min</span>
                      </div>

                      {/* Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/listings/${listing.id}`);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          fontFamily: 'Outfit, sans-serif',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                      >
                        Book Trial
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 5: WEEKEND CAMPS (MOBILE CAROUSEL) ========== */}
      {weekendCamps.length >= 2 && (
        <section style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '2rem',
                fontFamily: 'Outfit, sans-serif',
                color: '#1E293B',
                textAlign: 'center'
              }}
            >
              🎪 Weekend Camps & Workshops
            </motion.h2>

            {/* Desktop Grid View */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="desktop-only"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {weekendCamps.slice(0, 6).map((session, idx) => (
                <motion.div
                  key={session.id}
                  variants={scaleIn}
                  whileHover={{ scale: 1.03, y: -8 }}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    height: idx % 3 === 0 ? '200px' : '160px',
                    background: `linear-gradient(135deg, ${['#FBBF24', '#F472B6', '#6EE7B7', '#8b5cf6'][idx % 4]}30 0%, ${['#F472B6', '#3B82F6', '#FBBF24', '#06B6D4'][idx % 4]}30 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem'
                  }}>
                    {['🎨', '💃', '🎪', '🎭', '🎸', '⚽'][idx % 6]}
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#3B82F6',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      {new Date(session.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#1E293B',
                      fontFamily: 'Outfit, sans-serif'
                    }}>Workshop Session</h3>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Mobile Carousel View */}
            <div className="mobile-only" style={{ width: '100%', overflow: 'hidden', padding: '0' }}>
              <Slider
                {...{
                  dots: true,
                  infinite: true,
                  speed: 600,
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  autoplay: true,
                  autoplaySpeed: 4000,
                  pauseOnHover: true,
                  arrows: false,
                  swipeToSlide: true,
                  touchThreshold: 10,
                  cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  appendDots: dots => (
                    <div style={{ 
                      bottom: '-35px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <ul style={{ margin: 0, padding: 0, display: 'flex', gap: '8px' }}> {dots} </ul>
                    </div>
                  ),
                  customPaging: i => (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#CBD5E1',
                      transition: 'all 0.3s'
                    }} />
                  ),
                  dotsClass: 'slick-dots custom-dots',
                  responsive: [
                    {
                      breakpoint: 768,
                      settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                      }
                    }
                  ]
                }}
              >
                {weekendCamps.slice(0, 8).map((session, idx) => (
                  <div key={session.id} style={{ padding: '0 5px', boxSizing: 'border-box' }}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                        margin: '0 auto',
                        maxWidth: '340px'
                      }}
                    >
                      <div style={{
                        height: '200px',
                        background: `linear-gradient(135deg, ${['#FBBF24', '#F472B6', '#6EE7B7', '#8b5cf6', '#3B82F6', '#F97316', '#EC4899', '#06B6D4'][idx % 8]}30 0%, ${['#F472B6', '#3B82F6', '#FBBF24', '#06B6D4', '#6EE7B7', '#8b5cf6', '#FBBF24', '#F472B6'][idx % 8]}30 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '5rem',
                        position: 'relative'
                      }}>
                        {['🎨', '💃', '🎪', '🎭', '🎸', '⚽', '🎯', '🎬'][idx % 8]}
                        
                        {/* Floating badge */}
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#3B82F6',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                          Weekend
                        </div>
                      </div>
                      
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{
                            padding: '0.375rem 0.75rem',
                            background: '#EFF6FF',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            color: '#3B82F6',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                          }}>
                            📅 {new Date(session.start_at).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div style={{
                            padding: '0.375rem 0.75rem',
                            background: '#F0FDF4',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            color: '#059669',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                          }}>
                            ⏰ {new Date(session.start_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: '#1E293B',
                          fontFamily: 'Outfit, sans-serif',
                          marginBottom: '0.5rem'
                        }}>
                          {session.listing_title || 'Workshop Session'}
                        </h3>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748B',
                          marginBottom: '1rem',
                          lineHeight: '1.5'
                        }}>
                          Join our exciting weekend workshop and explore new skills!
                        </p>
                        
                        <button
                          onClick={() => navigate(`/listing/${session.listing_id}`)}
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)'
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 6: TOP RATED STUDIOS (AUTO-SLIDE) ========== */}
      {topPartners.length >= 2 && (
        <section style={{ padding: '4rem 2rem', background: 'white' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '2rem',
                fontFamily: 'Outfit, sans-serif',
                color: '#1E293B',
                textAlign: 'center'
              }}
            >
              🏆 Top Rated Studios
            </motion.h2>

            <Slider {...sliderSettings}>
              {topPartners.map((partner) => (
                <div key={partner.id} style={{ padding: '0 0.75rem' }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)',
                      padding: '2rem',
                      borderRadius: '20px',
                      textAlign: 'center',
                      border: '2px solid #6EE7B730',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      fontSize: '2rem'
                    }}>🏫</div>
                    
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem',
                      color: '#1E293B',
                      fontFamily: 'Outfit, sans-serif'
                    }}>{partner.brand_name}</h3>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <Star size={16} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>4.8</span>
                    </div>
                    
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      background: '#6EE7B730',
                      color: '#059669',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      ✓ Verified by rayy
                    </div>
                  </motion.div>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      )}

      {/* ========== SECTION 8: WHY PARENTS ❤️ rayy (STATS) ========== */}
     <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '3rem',
              fontFamily: 'Outfit, sans-serif',
              color: '#1E293B',
              textAlign: 'center'
            }}
          >
            Why Parents ❤️ rayy
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}
          >
            {[
              { value: 10000, label: 'Happy Learners', icon: '😊', color: '#6EE7B7' },
              { value: 200, label: 'Studios', icon: '🏫', color: '#3B82F6' },
              { value: 4.8, label: 'Average Rating', icon: '⭐', color: '#FBBF24' }
            ].map((stat, idx) => (
              <StatItem key={idx} stat={stat} idx={idx} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 9: JOIN AS A PARTNER (BURST GRADIENT BANNER) ========== */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 50%, #8b5cf6 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            marginBottom: '1rem',
            color: 'white',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Are you a studio owner? 🏫
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '2rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Join rayy and reach thousands of parents looking for classes like yours
          </p>
          <button
            onClick={handlePartnerClick}
            className="btn-scale"
            style={{
              background: 'white',
              color: '#3B82F6',
              padding: '1.25rem 3rem',
              borderRadius: '16px',
              fontWeight: '700',
              fontSize: '1.25rem',
              fontFamily: 'Outfit, sans-serif',
              border: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            List Your Studio Today 🚀
          </button>
        </motion.div>
      </section>

      {/* ========== SEO CONTENT SECTION: About rayy ========== */}
      <section style={{
        maxWidth: '1400px',
        margin: '4rem auto',
        padding: '0 2rem'
      }}>
        <article style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
        }}>
          <header>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: '1.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Discover the Best Kids Classes & Activities Near You
            </h2>
          </header>
          
          <div style={{
            fontSize: '1.125rem',
            lineHeight: '1.8',
            color: '#475569',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <p style={{ marginBottom: '1.5rem' }}>
              rayy is India's most trusted platform for discovering and booking <strong>kids classes, camps, and extracurricular activities</strong>. Whether you're searching for <strong>dance classes for toddlers</strong>, <strong>coding programs for teens</strong>, or <strong>summer camps near you</strong>, rayy connects parents with verified, high-quality programs designed to help children learn, grow, and shine.
            </p>
            
            <p style={{ marginBottom: '1.5rem' }}>
              We understand that finding the right activity for your child can be overwhelming. That's why we've built a platform that makes it easy to explore, compare, and book from hundreds of trusted partners across multiple cities. From <strong>art and music classes</strong> to <strong>sports training</strong> and <strong>STEM workshops</strong>, every program on rayy is carefully curated to ensure safety, quality, and meaningful learning experiences.
            </p>
            
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#1E293B',
              marginTop: '2rem',
              marginBottom: '1rem'
            }}>
              Why Parents Trust rayy
            </h3>
            
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              marginBottom: '1.5rem'
            }}>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'start' }}>
                <span style={{ color: '#3B82F6', marginRight: '0.75rem', fontSize: '1.25rem' }}>✓</span>
                <span><strong>Verified Partners</strong> – Every studio and instructor undergoes a thorough verification process</span>
              </li>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'start' }}>
                <span style={{ color: '#3B82F6', marginRight: '0.75rem', fontSize: '1.25rem' }}>✓</span>
                <span><strong>Real Reviews</strong> – Read authentic feedback from parents who've attended the classes</span>
              </li>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'start' }}>
                <span style={{ color: '#3B82F6', marginRight: '0.75rem', fontSize: '1.25rem' }}>✓</span>
                <span><strong>Flexible Booking</strong> – Book single sessions, trial classes, or full programs with easy cancellation</span>
              </li>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'start' }}>
                <span style={{ color: '#3B82F6', marginRight: '0.75rem', fontSize: '1.25rem' }}>✓</span>
                <span><strong>Age-Appropriate Programs</strong> – Find classes tailored to your child's specific age group</span>
              </li>
            </ul>
            
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#1E293B',
              marginTop: '2rem',
              marginBottom: '1rem'
            }}>
              Popular Categories
            </h3>
            
            <p style={{ marginBottom: '1rem' }}>
              Explore our most popular categories including <strong>Dance</strong> (ballet, hip-hop, classical), <strong>Arts & Crafts</strong> (painting, pottery, crafts), <strong>Coding & Robotics</strong> (programming, game design), <strong>Sports</strong> (swimming, football, martial arts), <strong>Music</strong> (piano, guitar, vocals), and <strong>Academic Tutoring</strong>. Our platform serves children from toddlers to teenagers across major Indian cities.
            </p>
            
            <p style={{ marginBottom: '0' }}>
              Whether you're looking for weekend workshops, after-school programs, or holiday camps, rayy makes it simple to find and book the perfect activity for your child's interests and schedule. Join thousands of parents who trust rayy to find quality learning experiences for their children.
            </p>
          </div>
        </article>
      </section>

      {/* ========== SECTION 10: FOOTER ========== */}
      <footer style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        padding: '3rem 1.5rem 2rem',
        color: 'white',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {/* Desktop Footer */}
          <div className="desktop-only" style={{ width: '100%' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '3rem',
              marginBottom: '3rem',
              width: '100%'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.25rem'
                  }}>R</div>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>rayy</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8', fontFamily: 'Outfit, sans-serif', lineHeight: '1.6' }}>
                  Learn • Play • Shine
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748B', fontFamily: 'Outfit, sans-serif', marginTop: '1rem', lineHeight: '1.6' }}>
                  Discover amazing classes for all ages (1-50+). From dance to coding, sports to wellness.
                </p>
              </div>

              {[
                { title: 'Company', links: [
                  { label: 'About', to: '/about' },
                  { label: 'Careers', to: '/careers' },
                  { label: 'Blog', to: '/blog' },
                  { label: 'Press', to: '/press' }
                ]},
                { title: 'Support', links: [
                  { label: 'Help Center', to: '/help-center' },
                  { label: 'Safety', to: '/safety' },
                  { label: 'Terms', to: '/terms' },
                  { label: 'Privacy', to: '/privacy' }
                ]},
                { title: 'Partner', links: [
                  { label: 'List Studio', to: '/list-studio' },
                  { label: 'Partner Login', to: '/partner/login' },
                  { label: 'Resources', to: '/resources' },
                  { label: 'FAQ', to: '/faq' }
                ]}
              ].map((col, idx) => (
                <div key={idx}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                    fontFamily: 'Outfit, sans-serif',
                    color: 'white'
                  }}>{col.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {col.links.map((link, i) => (
                      <li key={i} style={{ marginBottom: '0.625rem' }}>
                        <Link to={link.to} style={{
                          color: '#94A3B8',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontFamily: 'Outfit, sans-serif',
                          transition: 'color 0.3s',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#6EE7B7';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#94A3B8';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Footer - Fixed Layout */}
          <div className="mobile-only" style={{ 
            width: '100%', 
            maxWidth: '100%', 
            overflow: 'hidden',
            position: 'relative',
            display: 'block'
          }}>
            {/* Logo Section */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.75rem',
                margin: '0 auto 0.75rem',
                boxShadow: '0 8px 24px rgba(110, 231, 183, 0.3)'
              }}>R</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem' }}>
                rayy
              </div>
              <p style={{ fontSize: '1rem', color: '#94A3B8', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                Learn • Play • Shine
              </p>
            </div>

            {/* Quick Links Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              {[
                { label: 'About', to: '/about', icon: '📖' },
                { label: 'Help', to: '/help-center', icon: '💬' },
                { label: 'Studio', to: '/list-studio', icon: '🏢' },
                { label: 'Careers', to: '/careers', icon: '💼' },
                { label: 'Safety', to: '/safety', icon: '🛡️' },
                { label: 'FAQ', to: '/faq', icon: '❓' },
                { label: 'Terms', to: '/terms', icon: '📄' },
                { label: 'Privacy', to: '/privacy', icon: '🔒' }
              ].map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#E2E8F0',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.3s'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = 'rgba(110, 231, 183, 0.15)';
                    e.currentTarget.style.borderColor = '#6EE7B7';
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Partner CTA - Separate block */}
            <div style={{ 
              width: '100%', 
              marginBottom: '2rem',
              display: 'block'
            }}>
              <Link
                to="/partner-landing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1.125rem',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '1rem',
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 8px 24px rgba(110, 231, 183, 0.3)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>🚀</span>
                Become a Partner
              </Link>
            </div>

            {/* Social Links */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { icon: '📱', label: 'Instagram' },
                { icon: '🐦', label: 'Twitter' },
                { icon: '📸', label: 'Facebook' },
                { icon: '💼', label: 'LinkedIn' }
              ].map((social, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)';
                    e.currentTarget.style.background = 'rgba(110, 231, 183, 0.15)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  {social.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Copyright - Common for both */}
          <div style={{
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            paddingTop: '1.5rem',
            textAlign: 'center',
            width: '100%'
          }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ 
                fontSize: '0.8125rem', 
                color: '#64748B', 
                fontFamily: 'Outfit, sans-serif',
                margin: 0,
                padding: '0 1rem'
              }}
            >
              © 2025 rayy. Made with ❤️ for curious minds.
            </motion.p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1) translateX(-50%); }
          50% { opacity: 0.5; transform: scale(1.1) translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const StatItem = ({ stat, idx }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { scale: 0.8, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
      }}
      style={{
        background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
        padding: '3rem 2rem',
        borderRadius: '24px',
        textAlign: 'center',
        border: `2px solid ${stat.color}30`
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{stat.icon}</div>
      <div style={{
        fontSize: '3rem',
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: '0.5rem',
        fontFamily: 'Outfit, sans-serif'
      }}>
        {inView && (
          <CountUp
            end={stat.value}
            duration={2.5}
            decimals={stat.value === 4.8 ? 1 : 0}
            suffix={idx === 0 ? 'k' : (idx === 1 ? '+' : '⭐')}
          />
        )}
      </div>
      <div style={{
        fontSize: '1.1rem',
        color: '#64748B',
        fontWeight: '600',
        fontFamily: 'Outfit, sans-serif'
      }}>{stat.label}</div>
    </motion.div>
  );
};

export default HomeRebuild;
