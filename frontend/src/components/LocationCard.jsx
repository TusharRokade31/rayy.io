import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Share2, ExternalLink, Info } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const LocationCard = ({ listing, venue, compact = false }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Check if it's an online class
  if (listing?.is_online) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: '2px solid #93C5FD',
        borderRadius: compact ? '8px' : '12px',
        padding: compact ? '0.75rem' : '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#3B82F6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MapPin size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1E40AF' }}>
            Online Studio
          </div>
          <div style={{ fontSize: '0.75rem', color: '#60A5FA' }}>
            Link will be shared before class
          </div>
        </div>
      </div>
    );
  }

  // For offline classes, venue is required
  if (!venue) {
    return null;
  }

  useEffect(() => {
    // Try to get user's location for distance calculation
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
    // Calculate distance if both locations available
    if (userLocation && venue?.lat && venue?.lng) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        venue.lat,
        venue.lng
      );
      setDistance(dist);
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
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m away`;
    } else if (dist < 10) {
      return `${dist.toFixed(1)}km away`;
    } else {
      return `${Math.round(dist)}km away`;
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
          toast.success('Location updated');
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
      // Open with coordinates
      const url = `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
      window.open(url, '_blank');
    } else if (venue.google_maps_link) {
      // Use provided Google Maps link
      window.open(venue.google_maps_link, '_blank');
    } else {
      // Fallback to address search
      const address = encodeURIComponent(`${venue.address}, ${venue.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const getDirections = () => {
    if (userLocation && venue.lat && venue.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${venue.lat},${venue.lng}`;
      window.open(url, '_blank');
    } else if (venue.lat && venue.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
      window.open(url, '_blank');
    } else {
      toast.error('Location coordinates not available');
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
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to copying
          copyToClipboard();
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `${venue.name}\n${venue.address}, ${venue.city}${venue.pincode ? ' - ' + venue.pincode : ''}\n${venue.google_maps_link || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Address copied to clipboard');
    }).catch(() => {
      toast.error('Could not copy address');
    });
  };

  if (compact) {
    // Compact view for search results
    return (
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <MapPin size={16} color="#06B6D4" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1E293B', marginBottom: '0.25rem' }}>
            {venue.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4' }}>
            {venue.address}, {venue.city}
          </div>
          {distance && (
            <div style={{ fontSize: '0.75rem', color: '#06B6D4', marginTop: '0.25rem', fontWeight: '600' }}>
              {formatDistance(distance)}
            </div>
          )}
        </div>
        <button
          onClick={openGoogleMaps}
          style={{
            padding: '0.375rem',
            background: '#F0FDFA',
            border: '1px solid #99F6E4',
            color: '#0891B2',
            borderRadius: '6px',
            flexShrink: 0
          }}
        >
          <ExternalLink size={14} />
        </button>
      </div>
    );
  }

  // Full view for listing detail page
  return (
    <div style={{
      background: 'white',
      border: '2px solid #E2E8F0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MapPin size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.25rem' }}>
            Venue Location
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            {venue.name}
          </p>
        </div>
      </div>

      {/* Address */}
      <div style={{
        background: '#F8FAFC',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
          Full Address
        </div>
        <div style={{ fontSize: '0.9375rem', color: '#1E293B', lineHeight: '1.6' }}>
          {venue.address}<br />
          {venue.city}{venue.pincode && `, ${venue.pincode}`}
        </div>
        {distance && (
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Navigation size={14} color="#06B6D4" />
            <span style={{ fontSize: '0.875rem', color: '#06B6D4', fontWeight: '600' }}>
              {formatDistance(distance)}
            </span>
            <button
              onClick={requestLiveLocation}
              disabled={loadingLocation}
              style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.75rem',
                background: 'white',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                fontSize: '0.75rem',
                borderRadius: '6px'
              }}
            >
              {loadingLocation ? 'Updating...' : 'Update Location'}
            </button>
          </div>
        )}
        {!distance && (
          <button
            onClick={requestLiveLocation}
            disabled={loadingLocation}
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '0.875rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
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
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Info size={16} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400E', marginBottom: '0.375rem' }}>
              Helpful Tips
            </div>
            <div style={{ fontSize: '0.875rem', color: '#78350F', lineHeight: '1.5' }}>
              {venue.landmarks}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <button
          onClick={openGoogleMaps}
          style={{
            padding: '0.875rem',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}
        >
          <ExternalLink size={16} />
          Open in Maps
        </button>
        <button
          onClick={getDirections}
          style={{
            padding: '0.875rem',
            background: 'white',
            color: '#06B6D4',
            border: '2px solid #06B6D4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}
        >
          <Navigation size={16} />
          Directions
        </button>
        <button
          onClick={shareLocation}
          style={{
            padding: '0.875rem',
            background: 'white',
            color: '#64748B',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '600',
            gridColumn: 'span 2'
          }}
        >
          <Share2 size={16} />
          Share Location
        </button>
      </div>
    </div>
  );
};

export default LocationCard;
