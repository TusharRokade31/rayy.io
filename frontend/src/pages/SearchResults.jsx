import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navbar from '../components/Navbar';
import EnhancedLocationCard from '../components/EnhancedLocationCard';
import { Button } from '../components/ui/button';
import { MapPin, Clock, Star, Users, Sparkles, Navigation, Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useLocationPref } from '../hooks/useLocationPref';
import BadgeOverlay from '../components/BadgeOverlay';
import SEO from '../components/SEO';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { loc } = useLocationPref();
  const [radiusKm, setRadiusKm] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    ageMin: '',
    ageMax: '',
    priceMin: '',
    priceMax: '',
    isOnline: searchParams.get('is_online') === 'true' ? true : searchParams.get('is_online') === 'false' ? false : null,
    trialAvailable: false,
    duration: ''
  });

  // Age band mapping (same as Home page)
  const ageBands = {
    '1-3': 2,
    '4-6': 5,
    '7-12': 9,
    '13-18': 15,
    '19-24': 21
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [searchParams, radiusKm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Convert age band to integer
      const ageParam = searchParams.get('age');
      if (ageParam && ageBands[ageParam]) {
        params.age = ageBands[ageParam];
      }
      
      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('is_online')) params.is_online = searchParams.get('is_online') === 'true';
      if (searchParams.get('trial')) params.trial = searchParams.get('trial') === 'true';
      
      // Add location params if available
      if (loc && loc.lat && loc.lng && !params.is_online) {
        params.lat = loc.lat;
        params.lng = loc.lng;
        params.radius_km = radiusKm;
      }
      
      const response = await axios.get(`${API}/search`, { params });
      let results = response.data.listings;
      
      // Client-side filtering for price and age range
      if (filters.priceMin) {
        results = results.filter(l => l.base_price_inr >= parseFloat(filters.priceMin));
      }
      if (filters.priceMax) {
        results = results.filter(l => l.base_price_inr <= parseFloat(filters.priceMax));
      }
      if (filters.ageMin) {
        results = results.filter(l => l.age_max >= parseInt(filters.ageMin));
      }
      if (filters.ageMax) {
        results = results.filter(l => l.age_min <= parseInt(filters.ageMax));
      }
      if (filters.duration) {
        const [min, max] = filters.duration.split('-').map(Number);
        if (max) {
          results = results.filter(l => l.duration_minutes >= min && l.duration_minutes <= max);
        } else {
          results = results.filter(l => l.duration_minutes >= min);
        }
      }
      
      setListings(results);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    
    if (filters.category) {
      newParams.set('category', filters.category);
    } else {
      newParams.delete('category');
    }
    
    if (filters.isOnline !== null) {
      newParams.set('is_online', filters.isOnline.toString());
    } else {
      newParams.delete('is_online');
    }
    
    if (filters.trialAvailable) {
      newParams.set('trial', 'true');
    } else {
      newParams.delete('trial');
    }
    
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      ageMin: '',
      ageMax: '',
      priceMin: '',
      priceMax: '',
      isOnline: null,
      trialAvailable: false,
      duration: ''
    });
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.ageMin || filters.ageMax) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.isOnline !== null) count++;
    if (filters.trialAvailable) count++;
    if (filters.duration) count++;
    return count;
  };

  const categoryName = filters.category || 'All Classes';
  const location = loc?.city || 'Your Area';
  
  return (
    <div data-testid="search-results-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <SEO 
        title={`${categoryName} for Kids in ${location} | rayy`}
        description={`Browse ${listings.length}+ verified ${categoryName.toLowerCase()} for children in ${location}. Read reviews, compare prices, and book trial classes instantly.`}
        keywords={`${categoryName} for kids, children ${categoryName}, ${categoryName} near me, kids activities ${location}`}
        url="/search"
      />
      <Navbar />

      <div className="mobile-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header with Filter Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 data-testid="search-title" style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif',
              color: '#1e293b'
            }}>Explore Classes</h1>
            <p style={{ color: '#64748b' }}>Found {listings.length} classes</p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'white',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              color: '#1E293B',
              fontWeight: '600',
              position: 'relative'
            }}
          >
            <SlidersHorizontal size={20} />
            Filters
            {activeFilterCount() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {activeFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel-mobile" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
                Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Category Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.875rem' }}>
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.875rem' }}>
                  Age Range
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ color: '#64748B' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.875rem' }}>
                  Price Range (₹)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ color: '#64748B' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.875rem' }}>
                  Duration
                </label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="">Any Duration</option>
                  <option value="0-30">Up to 30 min</option>
                  <option value="30-60">30-60 min</option>
                  <option value="60-90">60-90 min</option>
                  <option value="90-999">90+ min</option>
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setFilters({ ...filters, isOnline: filters.isOnline === true ? null : true })}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '20px',
                  border: filters.isOnline === true ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                  background: filters.isOnline === true ? '#EFF6FF' : 'white',
                  color: filters.isOnline === true ? '#3B82F6' : '#64748B',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🌐 Online Only
              </button>
              
              <button
                onClick={() => setFilters({ ...filters, isOnline: filters.isOnline === false ? null : false })}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '20px',
                  border: filters.isOnline === false ? '2px solid #EC4899' : '1px solid #E2E8F0',
                  background: filters.isOnline === false ? '#FDF2F8' : 'white',
                  color: filters.isOnline === false ? '#EC4899' : '#64748B',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📍 In-Studio Only
              </button>
              
              <button
                onClick={() => setFilters({ ...filters, trialAvailable: !filters.trialAvailable })}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '20px',
                  border: filters.trialAvailable ? '2px solid #10B981' : '1px solid #E2E8F0',
                  background: filters.trialAvailable ? '#D1FAE5' : 'white',
                  color: filters.trialAvailable ? '#059669' : '#64748B',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ✨ Trial Available
              </button>
            </div>

            {/* Action Buttons */}
            <div className="filter-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#64748B',
                  fontWeight: '600'
                }}
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Radius Selector (only show if location available and filters not shown) */}
        {!showFilters && loc && loc.lat && loc.lng && !searchParams.get('is_online') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Within:</span>
            {[5, 10, 15].map(r => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: radiusKm === r ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                  background: radiusKm === r ? '#f0f9ff' : 'white',
                  color: radiusKm === r ? '#0891b2' : '#64748b',
                  fontWeight: radiusKm === r ? '600' : '400',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {r} km
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div data-testid="loading-state" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            Loading...
          </div>
        ) : listings.length === 0 ? (
          <div data-testid="empty-state" style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '0.5rem' }}>No classes found</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Try adjusting your filters or increasing the radius</p>
            <button onClick={() => navigate('/')} style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px'
            }}>Back to Home</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem'
          }} className="mobile-grid">
            {listings.map((listing) => {
              // Image carousel component for each listing
              const ListingImageCarousel = () => {
                const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
                const [isHovering, setIsHovering] = React.useState(false);
                const images = listing.media || [];

                React.useEffect(() => {
                  if (isHovering && images.length > 1) {
                    const interval = setInterval(() => {
                      setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    }, 2000); // 2 second interval
                    return () => clearInterval(interval);
                  }
                }, [isHovering, images.length]);

                return (
                  <div 
                    style={{
                      width: '100%',
                      height: '200px',
                      position: 'relative'
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => {
                      setIsHovering(false);
                      setCurrentImageIndex(0);
                    }}
                  >
                    {images.length > 0 ? (
                      <>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url(${images[currentImageIndex]})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transition: 'opacity 0.5s ease-in-out'
                        }}>
                          {/* Badge Overlay */}
                          <BadgeOverlay badges={listing.badges} size="sm" maxDisplay={2} />
                          
                          {listing.trial_available && (
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: '#10b981',
                              color: 'white',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              zIndex: 2
                            }}>
                              <Sparkles size={14} />
                              Trial Available
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Users size={48} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                  </div>
                );
              };

              return (
              <div
                key={listing.id}
                data-testid={`listing-card-${listing.id}`}
                onClick={() => navigate(`/listings/${listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <ListingImageCarousel />

                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 data-testid={`listing-title-${listing.id}`} style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '0.25rem',
                        color: '#1e293b'
                      }}>{listing.title}</h3>
                      {listing.subtitle && (
                        <p style={{ fontSize: '14px', color: '#64748b' }}>{listing.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Users size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Age {listing.age_min}-{listing.age_max}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={16} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {listing.duration_minutes} min
                      </span>
                    </div>
                    {listing.rating_avg > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Star size={16} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {listing.rating_avg}
                        </span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>({listing.rating_count})</span>
                      </div>
                    )}
                  </div>

                  {/* Location Info - Compact */}
                  {listing.venue && (
                    <div style={{ marginBottom: '1rem' }}>
                      <EnhancedLocationCard listing={listing} venue={listing.venue} compact={true} />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        ₹{listing.base_price_inr}
                      </div>
                      <div style={{ fontSize: '13px', color: '#06b6d4', fontWeight: '600' }}>
                        or {listing.base_price_inr} credits
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>per session</div>
                    </div>
                    <button data-testid={`view-details-${listing.id}`} style={{
                      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      color: 'white',
                      padding: '0.625rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
