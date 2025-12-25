import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Share2, ExternalLink, Info, Car, 
  Train, Footprints, Clock, Phone, Bookmark, X, Map as MapIcon,
  ChevronRight, Maximize2
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const EnhancedLocationCard = ({ listing, venue, compact = false }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedMode, setSelectedMode] = useState('drive'); // walk, drive, transit
  const [showMapModal, setShowMapModal] = useState(false);
  const [travelTimes, setTravelTimes] = useState({
    walk: null,
    drive: null,
    transit: null
  });

  // Check if it's an online class
  if (listing?.is_online) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '2px solid #93C5FD',
          borderRadius: compact ? '12px' : '16px',
          padding: compact ? '1rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <MapPin size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1E40AF', marginBottom: '0.25rem' }}>
            🌐 Online Studio
          </div>
          <div style={{ fontSize: '0.875rem', color: '#60A5FA' }}>
            Join from anywhere • Link shared before class
          </div>
        </div>
      </motion.div>
    );
  }

  // For offline classes, venue is required
  if (!venue) {
    return null;
  }

  useEffect(() => {
    // Try to get saved location first
    const savedLocation = localStorage.getItem('locationPreference');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        if (location.lat && location.lng) {
          setUserLocation({ lat: location.lat, lng: location.lng });
        }
      } catch (e) {
        console.error('Error parsing saved location', e);
      }
    }
  }, []);

  useEffect(() => {
    // Calculate distance and travel times if both locations available
    if (userLocation && venue?.lat && venue?.lng) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        venue.lat,
        venue.lng
      );
      setDistance(dist);
      
      // Calculate estimated travel times
      estimateTravelTimes(dist);
    }
  }, [userLocation, venue]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const estimateTravelTimes = (dist) => {
    // Rough estimates - in real world, would use Google Maps Distance Matrix API
    const walkSpeed = 5; // km/h
    const driveSpeed = 30; // km/h average in city
    const transitSpeed = 20; // km/h average
    
    setTravelTimes({
      walk: Math.round((dist / walkSpeed) * 60), // minutes
      drive: Math.round((dist / driveSpeed) * 60),
      transit: Math.round((dist / transitSpeed) * 60) + 5 // +5 for waiting
    });
  };

  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    } else {
      return `${dist.toFixed(1)}km`;
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const requestLiveLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setLoadingLocation(false);
          toast.success('📍 Location updated');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location');
          setLoadingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation not supported');
      setLoadingLocation(false);
    }
  };

  const openGoogleMaps = () => {
    if (venue.lat && venue.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = () => {
    let url;
    if (userLocation && venue.lat && venue.lng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${venue.lat},${venue.lng}&travelmode=${selectedMode === 'walk' ? 'walking' : selectedMode === 'transit' ? 'transit' : 'driving'}`;
    } else if (venue.lat && venue.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=${selectedMode === 'walk' ? 'walking' : selectedMode === 'transit' ? 'transit' : 'driving'}`;
    }
    
    // On mobile, try to open native Google Maps app
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|ipad|iphone|ipod/i.test(userAgent.toLowerCase());
    
    if (isMobile && venue.lat && venue.lng) {
      // Try Google Maps app URL scheme
      const mapsUrl = userLocation 
        ? `google.navigation:q=${venue.lat},${venue.lng}&mode=${selectedMode === 'walk' ? 'w' : selectedMode === 'transit' ? 'r' : 'd'}`
        : `geo:0,0?q=${venue.lat},${venue.lng}`;
      window.location.href = mapsUrl;
      
      // Fallback to web after 2 seconds if app doesn't open
      setTimeout(() => {
        window.open(url, '_blank');
      }, 2000);
    } else {
      window.open(url, '_blank');
    }
  };

  const shareLocation = async () => {
    const shareData = {
      title: venue.name,
      text: `${venue.name}\n${venue.address}, ${venue.city}${venue.pincode ? ' - ' + venue.pincode : ''}`,
      url: venue.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address + ', ' + venue.city)}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Location shared');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `${venue.name}\n${venue.address}, ${venue.city}${venue.pincode ? ' - ' + venue.pincode : ''}\n${venue.google_maps_link || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('📋 Address copied');
    }).catch(() => {
      toast.error('Could not copy address');
    });
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'walk': return <Footprints size={16} />;
      case 'drive': return <Car size={16} />;
      case 'transit': return <Train size={16} />;
      default: return <Car size={16} />;
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'walk': return '#10B981';
      case 'drive': return '#3B82F6';
      case 'transit': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  // Compact view for search results
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={20} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.25rem' }}>
              {venue.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4' }}>
              {venue.address}, {venue.city}
            </div>
          </div>
        </div>

        {distance && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '0.75rem',
            flexWrap: 'wrap'
          }}>
            {['walk', 'drive', 'transit'].map((mode) => (
              <div
                key={mode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.625rem',
                  background: selectedMode === mode ? `${getModeColor(mode)}15` : '#F8FAFC',
                  border: `1px solid ${selectedMode === mode ? getModeColor(mode) : '#E2E8F0'}`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: selectedMode === mode ? getModeColor(mode) : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedMode(mode)}
              >
                {getModeIcon(mode)}
                <span>{travelTimes[mode] ? formatTime(travelTimes[mode]) : formatDistance(distance)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={getDirections}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
            }}
          >
            <Navigation size={14} />
            Navigate
          </button>
          <button
            onClick={shareLocation}
            style={{
              padding: '0.625rem 0.875rem',
              background: 'white',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: '8px'
            }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Full view for listing detail page
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'white',
          border: '2px solid #E2E8F0',
          borderRadius: '16px',
          overflow: 'hidden',
          marginTop: '2rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
          padding: '1.5rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                📍 Venue Location
              </h3>
              <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                {venue.name}
              </p>
            </div>
          </div>

          {/* Transport Mode Selector */}
          {distance && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem',
              borderRadius: '12px'
            }}>
              {['walk', 'drive', 'transit'].map((mode) => (
                <motion.div
                  key={mode}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMode(mode)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: selectedMode === mode ? 'white' : 'transparent',
                    color: selectedMode === mode ? getModeColor(mode) : 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    boxShadow: selectedMode === mode ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {getModeIcon(mode)}
                    <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: '600' }}>
                      {mode}
                    </span>
                  </div>
                  {travelTimes[mode] && (
                    <div style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                      {formatTime(travelTimes[mode])}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Map Preview */}
        {venue.lat && venue.lng && (
          <div 
            style={{ 
              position: 'relative',
              height: '250px',
              background: '#F1F5F9',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            onClick={() => setShowMapModal(true)}
          >
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=&q=${venue.lat},${venue.lng}&zoom=15`}
              allowFullScreen
              title="Venue Location Map"
            />
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem 0.75rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#3B82F6'
            }}>
              <Maximize2 size={14} />
              Expand
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Address */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Full Address
            </div>
            <div style={{ fontSize: '1rem', color: '#1E293B', lineHeight: '1.6', marginBottom: '0.75rem' }}>
              {venue.address}<br />
              {venue.city}{venue.pincode && `, ${venue.pincode}`}
            </div>
            {distance && (
              <div style={{
                paddingTop: '0.75rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="#06B6D4" />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#06B6D4' }}>
                    {formatDistance(distance)} away • {travelTimes[selectedMode] ? formatTime(travelTimes[selectedMode]) : 'Calculating...'}
                  </span>
                </div>
                <button
                  onClick={requestLiveLocation}
                  disabled={loadingLocation}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                >
                  {loadingLocation ? '📍 Updating...' : 'Update Location'}
                </button>
              </div>
            )}
            {!distance && (
              <button
                onClick={requestLiveLocation}
                disabled={loadingLocation}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.625rem 1rem',
                  background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}
              >
                <Navigation size={14} />
                {loadingLocation ? 'Getting location...' : 'Show distance from me'}
              </button>
            )}
          </div>

          {/* Landmarks */}
          {venue.landmarks && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '2px solid #FCD34D',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '1rem'
            }}>
              <Info size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#92400E', marginBottom: '0.5rem' }}>
                  💡 Helpful Tips
                </div>
                <div style={{ fontSize: '0.875rem', color: '#78350F', lineHeight: '1.6' }}>
                  {venue.landmarks}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <button
              onClick={getDirections}
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '700',
                fontSize: '1rem',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Navigation size={18} />
              Get Directions
            </button>
            <button
              onClick={openGoogleMaps}
              style={{
                padding: '1rem',
                background: 'white',
                color: '#3B82F6',
                border: '2px solid #3B82F6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '700',
                fontSize: '1rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <ExternalLink size={18} />
              Open in Maps
            </button>
            <button
              onClick={shareLocation}
              style={{
                padding: '1rem',
                background: 'white',
                color: '#64748B',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                fontSize: '1rem',
                gridColumn: 'span 2',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <Share2 size={18} />
              Share Location
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMapModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1E293B' }}>
                    {venue.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
                    {venue.address}, {venue.city}
                  </p>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  style={{
                    padding: '0.5rem',
                    background: '#F8FAFC',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#64748B'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ flex: 1, minHeight: '500px' }}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=&q=${venue.lat},${venue.lng}&zoom=16`}
                  allowFullScreen
                  title="Full Venue Map"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedLocationCard;
