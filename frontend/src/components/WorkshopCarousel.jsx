import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import BadgeOverlay from './BadgeOverlay';

const WorkshopCarousel = ({ workshops }) => {
  const navigate = useNavigate();

  const handleWorkshopClick = (workshop) => {
    if (workshop.is_external && workshop.external_booking_url) {
      window.open(workshop.external_booking_url, '_blank');
    } else {
      navigate(`/listings/${workshop.id}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (!workshops || workshops.length === 0) return null;

  return (
    <div style={{
      overflowX: 'auto',
      overflowY: 'hidden',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      padding: '1rem 0'
    }}
    className="workshop-scroll-container">
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '0 2rem'
      }}>
        {workshops.map((workshop) => (
          <div
            key={workshop.id}
            onClick={() => handleWorkshopClick(workshop)}
            style={{
              minWidth: '320px',
              maxWidth: '320px',
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}
          >
            {/* Speaker Photo Section */}
            <div style={{
              position: 'relative',
              height: '200px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '1rem'
            }}>
              {/* Trust Badges */}
              <BadgeOverlay badges={workshop.badges} size="sm" maxDisplay={2} />
              
              {workshop.media && workshop.media[0] && (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid white',
                  marginBottom: '0.75rem',
                  background: 'white'
                }}>
                  <img
                    src={workshop.media[0]}
                    alt={workshop.speaker_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {workshop.speaker_name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {workshop.speaker_credentials?.split('|')[0]}
                </div>
              </div>

              {/* External Badge */}
              {workshop.is_external && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ExternalLink size={12} />
                  External
                </div>
              )}
            </div>

            {/* Workshop Details */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '0.75rem',
                lineHeight: '1.4',
                minHeight: '44px'
              }}>
                {workshop.title}
              </h3>

              {/* Meta Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  <span>{formatDate(workshop.event_date)} • {workshop.duration_minutes} mins</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} />
                  <span>Ages {workshop.age_min}-{workshop.age_max}</span>
                </div>
              </div>

              {/* Urgency Message */}
              {workshop.urgency_message && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: workshop.urgency_message.includes('🔥') ? '#fef3c7' : '#dbeafe',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: workshop.urgency_message.includes('🔥') ? '#92400e' : '#1e40af',
                  marginBottom: '1rem'
                }}>
                  {workshop.urgency_message}
                </div>
              )}

              {/* Price & CTA */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: workshop.base_price_inr === 0 ? '#10b981' : '#3B82F6',
                  marginBottom: '0.75rem'
                }}>
                  {workshop.base_price_inr === 0 ? 'FREE' : `₹${workshop.base_price_inr}`}
                </div>

                <button
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {workshop.is_external ? (
                    <>Register <ExternalLink size={16} /></>
                  ) : (
                    'Book Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .workshop-scroll-container::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .workshop-scroll-container {
            padding: 0.5rem 0;
          }
          
          .workshop-scroll-container > div {
            padding: 0 1rem;
            gap: 1rem;
          }
          
          .workshop-scroll-container > div > div {
            min-width: 280px;
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkshopCarousel;
