import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import EnhancedLocationCard from '../components/EnhancedLocationCard';
import { Button } from '../components/ui/button';
import { MapPin, Clock, Users, Star, Calendar, Info, Sparkles, Shield, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import ReviewSection from '../components/ReviewSection';
import { InlineBadge } from '../components/BadgeOverlay';
import SEO from '../components/SEO';
import ImprovedSessionSelector from '../components/ImprovedSessionSelector';

// Safe date formatter
const safeDateFormat = (dateString, formatStr) => {
  try {
    if (!dateString) return 'Date not available';
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
    <Navbar />
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div className="listing-detail-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '2rem'
      }}>
        {/* Left skeleton */}
        <div>
          <div style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '20px',
            marginBottom: '2rem'
          }} />
          <div style={{ height: '40px', width: '80%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
          <div style={{ height: '20px', width: '60%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
          <div style={{ height: '100px', width: '100%', background: '#e2e8f0', borderRadius: '8px' }} />
        </div>
        {/* Right skeleton */}
        <div>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ height: '30px', width: '70%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
            <div style={{ height: '60px', width: '100%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
            <div style={{ height: '50px', width: '100%', background: '#6EE7B7', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    </div>
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showAuth } = useContext(AuthContext);
  const [listing, setListing] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]); // Changed to array for multi-select
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuickBook, setShowQuickBook] = useState(false);
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch listing first (critical)
      const listingRes = await axios.get(`${API}/listings/${id}`);
      setListing(listingRes.data);
      
      // Fetch plans
      try {
        const plansRes = await axios.get(`${API}/listings/${id}/plans`);
        setPlans(plansRes.data?.plans || []);
        // Don't auto-select any plan - user must click to expand
      } catch (planErr) {
        console.warn('Plans not available:', planErr);
        setPlans([]);
      }
      
      // Try to fetch sessions for next 3 months
      try {
        const today = new Date().toISOString().split('T')[0];
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        const toDate = threeMonthsLater.toISOString().split('T')[0];
        
        const sessionsRes = await axios.get(`${API}/listings/${id}/sessions?from_date=${today}&to_date=${toDate}`);
        console.log('🔍 Sessions API response:', sessionsRes.data);
        const allSessions = sessionsRes.data?.sessions || [];
        console.log(`📊 Total sessions received for next 3 months: ${allSessions.length}`);
        const bookableSessions = allSessions.filter(s => s.is_bookable === true);
        console.log(`✅ Bookable sessions: ${bookableSessions.length}`, bookableSessions);
        setSessions(bookableSessions);
      } catch (sessionErr) {
        console.error('❌ Sessions fetch error:', sessionErr);
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.response?.data?.detail || 'Failed to load listing');
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    if (!selectedPlan) return;
    
    const maxSessions = selectedPlan.sessions_count;
    
    // Check if already selected
    const isSelected = selectedSessions.find(s => s.id === session.id);
    
    if (isSelected) {
      // Deselect
      setSelectedSessions(selectedSessions.filter(s => s.id !== session.id));
    } else {
      // Select (if not at limit)
      if (selectedSessions.length < maxSessions) {
        setSelectedSessions([...selectedSessions, session]);
      } else {
        toast.error(`You can only select ${maxSessions} session(s) for this plan`);
      }
    }
  };

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
    setSelectedSessions([]); // Reset selection when plan changes
  };

  const handleBookSession = () => {
    if (!user) {
      showAuth();
      return;
    }
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    
    // Check if required sessions are selected
    if (selectedSessions.length !== selectedPlan.sessions_count) {
      toast.error(`Please select ${selectedPlan.sessions_count} session(s)`);
      return;
    }
    
    // Navigate to checkout with session IDs
    const sessionIds = selectedSessions.map(s => s.id).join(',');
    navigate(`/checkout/plan/${id}/${selectedPlan.id}?sessions=${sessionIds}`);
  };

  // QuickBook Modal Fallback
  if (showQuickBook && !listing) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
        <Navbar />
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto',
          padding: '3rem',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😔</div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1E293B',
            marginBottom: '1rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Oops! Something went wrong
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748B',
            marginBottom: '2rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            We couldn't load this listing. Try searching for similar classes or go back to home.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none'
              }}
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/search')}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                fontFamily: 'Outfit, sans-serif',
                border: '2px solid #3B82F6'
              }}
            >
              Search Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!listing) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Listing not found
        </div>
      </div>
    );
  }

  // Generate structured data for Course schema
  const courseStructuredData = listing ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": listing.title,
    "description": listing.description,
    "provider": {
      "@type": "Organization",
      "name": listing.partner_name || "rayy Partner"
    },
    "image": listing.media?.[0] || "",
    "offers": {
      "@type": "Offer",
      "price": listing.base_price_inr,
      "priceCurrency": "INR"
    },
    "aggregateRating": listing.rating_avg ? {
      "@type": "AggregateRating",
      "ratingValue": listing.rating_avg,
      "reviewCount": listing.rating_count || 0
    } : undefined
  } : null;

  return (
    <div data-testid="listing-detail-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      {listing && (
        <SEO
          title={`${listing.title} | rayy`}
          description={`${listing.description?.substring(0, 155)}... Book now on rayy!`}
          keywords={`${listing.title}, ${listing.category}, kids classes, children activities`}
          url={`/listings/${listing.id}`}
          image={listing.media?.[0] || undefined}
          preloadImage={listing.media?.[0] ? `${listing.media[0]}?w=800&h=400&fit=crop` : null}
          structuredData={courseStructuredData}
        />
      )}
      <Navbar />

      <div className="listing-detail-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div className="listing-detail-container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem'
        }}>
          {/* Left Column */}
          <div>
            {/* Image Gallery */}
            {listing.media && listing.media.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                {/* Main Image */}
                <div style={{
                  width: '100%',
                  height: '400px',
                  borderRadius: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowLightbox(true)}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${listing.media[currentImageIndex]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    {/* Trial Badge */}
                    {listing.trial_available && (
                      <div data-testid="trial-badge" style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: '#10b981',
                        color: 'white',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                        zIndex: 2
                      }}>
                        <Sparkles size={18} />
                        Trial: ₹{listing.trial_price_inr}
                      </div>
                    )}
                    
                    {/* Navigation Arrows */}
                    {listing.media.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === 0 ? listing.media.length - 1 : prev - 1
                            );
                          }}
                          style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          <ChevronLeft size={24} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => 
                              prev === listing.media.length - 1 ? 0 : prev + 1
                            );
                          }}
                          style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Thumbnail Strip */}
                {listing.media.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '16px',
                    overflowX: 'auto',
                    padding: '4px'
                  }}>
                    {listing.media.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: '100px',
                          height: '80px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: currentImageIndex === index ? '3px solid #3B82F6' : '3px solid transparent',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                          opacity: currentImageIndex === index ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => {
                          if (currentImageIndex !== index) {
                            e.currentTarget.style.opacity = '0.8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentImageIndex !== index) {
                            e.currentTarget.style.opacity = '0.6';
                          }
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Lightbox Modal */}
            {showLightbox && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0, 0, 0, 0.95)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowLightbox(false)}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowLightbox(false)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10001,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <X size={24} />
                </button>
                
                {/* Lightbox Image */}
                <div
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={listing.media[currentImageIndex]}
                    alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '85vh',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                  
                  {/* Lightbox Navigation */}
                  {listing.media.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === 0 ? listing.media.length - 1 : prev - 1
                          );
                        }}
                        style={{
                          position: 'absolute',
                          left: '-60px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        <ChevronLeft size={28} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === listing.media.length - 1 ? 0 : prev + 1
                          );
                        }}
                        style={{
                          position: 'absolute',
                          right: '-60px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        <ChevronRight size={28} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Title & Badges */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <h1 data-testid="listing-title" style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: '#1e293b',
                  margin: 0
                }}>{listing.title}</h1>
                
                {/* Display all badges inline */}
                {listing.badges && listing.badges.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {listing.badges.map((badge) => (
                      <InlineBadge key={badge} badgeType={badge} size="md" />
                    ))}
                  </div>
                )}
              </div>
              
              {listing.subtitle && (
                <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '1.5rem' }}>{listing.subtitle}</p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} style={{ color: '#06b6d4' }} />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    Age {listing.age_min}-{listing.age_max}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} style={{ color: '#06b6d4' }} />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {listing.duration_minutes} minutes
                  </span>
                </div>
                {listing.rating_avg > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={20} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                      {listing.rating_avg}
                    </span>
                    <span style={{ fontSize: '15px', color: '#64748b' }}>({listing.rating_count} reviews)</span>
                  </div>
                )}
              </div>

              {listing.partner && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{listing.partner.brand_name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <MapPin size={14} />
                      {listing.partner.city}
                    </div>
                  </div>
                  {listing.partner.verification_badges && listing.partner.verification_badges.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={18} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>Verified</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>About This Class</h2>
              <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '16px' }}>{listing.description}</p>
            </div>

            {/* Learning Outcomes */}
            {listing.learning_outcomes && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span> What You'll Learn
                </h2>
                <p style={{ color: '#475569', lineHeight: '2', fontSize: '16px', whiteSpace: 'pre-line' }}>
                  {listing.learning_outcomes}
                </p>
              </div>
            )}

            {/* Class Structure */}
            {listing.class_structure && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📋</span> Class Structure
                </h2>
                <p style={{ color: '#475569', lineHeight: '2', fontSize: '16px', whiteSpace: 'pre-line' }}>
                  {listing.class_structure}
                </p>
              </div>
            )}

            {/* What to Bring */}
            {listing.what_to_bring && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎒</span> What to Bring
                </h2>
                <p style={{ color: '#475569', lineHeight: '2', fontSize: '16px', whiteSpace: 'pre-line' }}>
                  {listing.what_to_bring}
                </p>
              </div>
            )}

            {/* Instructor Note */}
            {listing.instructor_note && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid #7dd3fc'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💬</span> From the Instructor
                </h2>
                <p style={{ color: '#0c4a6e', lineHeight: '1.8', fontSize: '16px', fontStyle: 'italic' }}>
                  "{listing.instructor_note}"
                </p>
              </div>
            )}

            {/* Details */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>What to Know</h2>
              
              {listing.equipment_needed && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>Equipment Needed</div>
                  <p style={{ color: '#64748b' }}>{listing.equipment_needed}</p>
                </div>
              )}

              {listing.safety_notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} style={{ color: '#06b6d4' }} />
                    Safety Notes
                  </div>
                  <p style={{ color: '#64748b' }}>{listing.safety_notes}</p>
                </div>
              )}

              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>Parent Presence</div>
                <p style={{ color: '#64748b' }}>{listing.parent_presence_required ? 'Required' : 'Not required'}</p>
              </div>
            </div>

            {/* Location Card */}
            <EnhancedLocationCard listing={listing} venue={listing.venue} />
          </div>

          {/* Right Column - Booking */}
          <div>
            <div style={{
              position: 'sticky',
              top: '100px',
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
                Choose Your Plan 📋
              </div>
              
              {/* Plans with integrated session selection */}
              {plans.map((plan) => {
                const isExpanded = selectedPlan?.id === plan.id;
                const planSessions = selectedSessions.filter(s => s.id);
                const isComplete = isExpanded && selectedSessions.length === plan.sessions_count;
                
                return (
                  <div key={plan.id} style={{ marginBottom: '1rem' }}>
                    {/* Plan Card */}
                    <div
                      onClick={() => handlePlanChange(plan)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                        border: isExpanded ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isExpanded ? '#f0f9ff' : 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: plan.id === 'trial' ? '#10b981' : plan.id === 'monthly' ? '#f59e0b' : '#3b82f6',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {plan.badge}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {plan.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.75rem' }}>
                        {plan.description}
                      </div>
                      
                      {/* Price Display */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>
                          ₹{plan.price_inr}
                        </div>
                        {plan.discount_percent > 0 && (
                          <div style={{
                            fontSize: '18px',
                            color: '#94a3b8',
                            textDecoration: 'line-through'
                          }}>
                            ₹{listing.base_price_inr * plan.sessions_count}
                          </div>
                        )}
                      </div>
                      
                      {/* Per Session Price */}
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>
                        ₹{plan.price_per_session} per session
                        {plan.sessions_count > 1 && ` × ${plan.sessions_count} sessions`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '600' }}>
                        or {plan.price_inr} credits
                      </div>
                      
                      {/* Savings Display */}
                      {plan.savings_inr > 0 && (
                        <div style={{
                          display: 'inline-block',
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          💰 Save ₹{plan.savings_inr} ({plan.discount_percent}% OFF)
                        </div>
                      )}
                      
                      {/* Expand Indicator */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #bfdbfe',
                          fontSize: '13px',
                          color: '#06b6d4',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>Select {plan.sessions_count} session{plan.sessions_count > 1 ? 's' : ''} below</span>
                          <span style={{ fontSize: '12px', background: '#06b6d4', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            {selectedSessions.length}/{plan.sessions_count}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* New Improved Session Selection */}
                    {isExpanded && (
                      <div style={{
                        borderTop: 'none',
                        marginTop: '1rem'
                      }}>
                        <ImprovedSessionSelector 
                          sessions={sessions}
                          selectedSessions={selectedSessions}
                          onSessionSelect={handleSessionSelect}
                          maxSelections={selectedPlan.sessions_count}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Book Button */}
              <button
                data-testid="book-button"
                onClick={handleBookSession}
                disabled={!selectedPlan || selectedSessions.length !== selectedPlan?.sessions_count}
                className={selectedPlan && selectedSessions.length === selectedPlan?.sessions_count ? "btn-scale" : ""}
                style={{
                  width: '100%',
                  padding: '1rem',
                  marginTop: '1rem',
                  borderRadius: '16px',
                  background: (selectedPlan && selectedSessions.length === selectedPlan?.sessions_count) ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : '#e2e8f0',
                  color: (selectedPlan && selectedSessions.length === selectedPlan?.sessions_count) ? 'white' : '#94a3b8',
                  fontWeight: '700',
                  fontSize: '17px',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.2s',
                  border: 'none',
                  boxShadow: (selectedPlan && selectedSessions.length === selectedPlan?.sessions_count) ? '0 8px 24px rgba(110, 231, 183, 0.3)' : 'none',
                  cursor: (selectedPlan && selectedSessions.length === selectedPlan?.sessions_count) ? 'pointer' : 'not-allowed'
                }}
              >
                {!selectedPlan ? 'Select a Plan Above' :
                 selectedSessions.length !== selectedPlan.sessions_count ? 
                   `Select ${selectedPlan.sessions_count - selectedSessions.length} More Session${selectedPlan.sessions_count - selectedSessions.length > 1 ? 's' : ''}` :
                 !user ? 'Login to Book ✨' :
                 `Book ${selectedPlan.sessions_count} Session${selectedPlan.sessions_count > 1 ? 's' : ''} ✨`}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {listing && (
          <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
            <ReviewSection 
              listingId={listing.id} 
              partnerId={listing.partner_id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetail;
