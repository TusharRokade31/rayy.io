import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import BadgeOverlay from './BadgeOverlay';

const CampCarousel = ({ camps }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (camps.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % camps.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [camps.length]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'coding': '#3B82F6',
      'art': '#F472B6',
      'sports': '#10B981',
      'music': '#F59E0B',
      'drama': '#8B5CF6',
      'fitness': '#6EE7B7'
    };
    return colors[category] || '#64748b';
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % camps.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + camps.length) % camps.length);
  };

  if (!camps || camps.length === 0) return null;

  const currentCamp = camps[currentIndex];

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          height: '450px',
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => navigate(`/listings/${currentCamp.id}`)}
      >
        {/* Background Image */}
        {currentCamp.media && currentCamp.media[0] && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${currentCamp.media[0]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }} />
        )}

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
        }} />

        {/* Trust Badges */}
        <BadgeOverlay badges={currentCamp.badges} size="md" maxDisplay={2} />

        {/* Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '2rem',
          color: 'white'
        }}>
          {/* Category Badge */}
          <div style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            background: getCategoryColor(currentCamp.category),
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {currentCamp.category}
          </div>

          {/* Camp Duration Badge */}
          <div style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={16} />
            {currentCamp.camp_duration_days} Days
          </div>

          {/* Title & Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '800',
              marginBottom: '1rem',
              lineHeight: '1.2',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              {currentCamp.title}
            </h2>
            <p style={{
              fontSize: '16px',
              lineHeight: '1.6',
              opacity: 0.95,
              maxWidth: '700px',
              textShadow: '0 1px 5px rgba(0,0,0,0.3)'
            }}>
              {currentCamp.description}
            </p>
          </div>

          {/* Meta Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={18} />
              <div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Start Date</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {formatDate(currentCamp.event_date)}
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users size={18} />
              <div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Age Group</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {currentCamp.age_min}-{currentCamp.age_max} years
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Award size={18} />
              <div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Capacity</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {currentCamp.capacity} kids
                </div>
              </div>
            </div>
          </div>

          {/* Price & CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '0.25rem' }}>
                Package Price
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '800',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                ₹{currentCamp.base_price_inr}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/listings/${currentCamp.id}`);
              }}
              style={{
                background: 'white',
                color: '#1e293b',
                padding: '1rem 2rem',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              Enroll Now →
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {camps.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {camps.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {camps.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                style={{
                  width: idx === currentIndex ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .camp-carousel h2 {
            font-size: 28px !important;
          }
          
          .camp-carousel p {
            font-size: 14px !important;
          }
          
          .camp-carousel > div {
            height: 400px !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CampCarousel;
