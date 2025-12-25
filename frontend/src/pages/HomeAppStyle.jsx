import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navbar from '../components/Navbar';
import BadgeOverlay from '../components/BadgeOverlay';
import StarRating from '../components/StarRating';
import { 
  Search, MapPin, Clock, Users, TrendingUp, Zap, 
  Flame, Star, ChevronRight, Filter
} from 'lucide-react';

const HomeAppStyle = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [listings, setListings] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [startingSoon, setStartingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeViewers, setActiveViewers] = useState(124); // Simulated live count

  const categories = [
    { id: 'all', name: 'All Classes', icon: '🎯' },
    { id: 'dance', name: 'Dance', icon: '💃' },
    { id: 'art', name: 'Art & Craft', icon: '🎨' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'coding', name: 'Coding', icon: '💻' },
    { id: 'language', name: 'Language', icon: '🗣️' }
  ];

  useEffect(() => {
    fetchData();
    // Simulate live viewer count changes
    const interval = setInterval(() => {
      setActiveViewers(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsRes, trendingRes] = await Promise.all([
        axios.get(`${API}/search`, {
          params: selectedCategory !== 'all' ? { category: selectedCategory } : {}
        }),
        axios.get(`${API}/home/trending`)
      ]);

      setListings(listingsRes.data.listings || []);
      setTrendingListings(trendingRes.data.listings || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getUrgencyBadge = (listing) => {
    // Simulate urgency indicators
    const seatsLeft = listing.next_session?.seats_available || 0;
    if (seatsLeft > 0 && seatsLeft <= 3) {
      return { text: `${seatsLeft} spots left!`, color: '#ef4444', icon: '🔥' };
    }
    return null;
  };

  const getBookingsToday = () => Math.floor(Math.random() * 20) + 5;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      
      {/* Compact Hero + Search */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        padding: '2rem 1rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Live Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '14px',
            opacity: 0.95
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span>{activeViewers} parents browsing now</span>
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '0.5rem',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            Find Your Child's Next Adventure
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '1.5rem' }}>
            Book trials in 3 taps • {listings.length}+ classes available
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              background: 'white',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Search size={22} color="#64748b" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dance, art, coding, sports..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#1e293b'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#06b6d4',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '2rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: selectedCategory === cat.id ? '#06b6d4' : 'white',
                color: selectedCategory === cat.id ? 'white' : '#475569',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === cat.id 
                  ? '0 4px 12px rgba(6, 182, 212, 0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Flame size={24} color="#ef4444" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                {getBookingsToday()}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Booked Today</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Zap size={24} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                {listings.length}+
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Classes Available</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Star size={24} color="#10b981" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                4.8★
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Trending Classes - Horizontal Scroll */}
        {trendingListings.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={24} color="#06b6d4" />
                Trending Now
              </h2>
              <button
                onClick={() => navigate('/search')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#06b6d4',
                  fontWeight: '600',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                View All
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              paddingBottom: '1rem',
              scrollbarWidth: 'thin'
            }}>
              {trendingListings.slice(0, 6).map((listing) => {
                const urgency = getUrgencyBadge(listing);
                return (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    style={{
                      minWidth: '280px',
                      background: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        height: '160px',
                        backgroundImage: `url(${listing.media?.[0] || 'https://via.placeholder.com/280x160'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                      <BadgeOverlay badges={listing.badges} size="sm" maxDisplay={2} />
                      {urgency && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          background: urgency.color,
                          color: 'white',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {urgency.icon} {urgency.text}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {listing.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <StarRating rating={listing.rating_avg || 4.5} size={14} />
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: '#06b6d4'
                        }}>
                          ₹{listing.base_price_inr || 299}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <MapPin size={12} />
                        {listing.location?.area || 'Multiple locations'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Classes Grid */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1e293b'
            }}>
              {selectedCategory === 'all' ? 'All Classes' : `${categories.find(c => c.id === selectedCategory)?.name} Classes`}
            </h2>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '600'
            }}>
              {listings.length} results
            </div>
          </div>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  style={{
                    background: '#e2e8f0',
                    borderRadius: '16px',
                    height: '350px',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {listings.map((listing) => {
                const urgency = getUrgencyBadge(listing);
                return (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s',
                      border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        height: '200px',
                        backgroundImage: `url(${listing.media?.[0] || 'https://via.placeholder.com/400x200'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                      <BadgeOverlay badges={listing.badges} size="sm" maxDisplay={2} />
                      {urgency && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          background: urgency.color,
                          color: 'white',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          {urgency.icon} {urgency.text}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {listing.title}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <StarRating 
                          rating={listing.rating_avg || 0} 
                          size={16} 
                          showCount={true}
                          reviewCount={listing.rating_count || 0}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.75rem',
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={14} />
                          {listing.session_duration || 60} min
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Users size={14} />
                          Age {listing.age_min}-{listing.age_max}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#06b6d4'
                          }}>
                            ₹{listing.base_price_inr || 299}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            per session
                          </div>
                        </div>
                        <button
                          style={{
                            padding: '0.625rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#06b6d4',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#0891b2'}
                          onMouseLeave={(e) => e.target.style.background = '#06b6d4'}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div style={{
          marginTop: '4rem',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            List Your Studio on rayy
          </h2>
          <p style={{
            fontSize: '18px',
            marginBottom: '2rem',
            opacity: 0.95
          }}>
            Join 100+ partners and reach thousands of parents
          </p>
          <button
            onClick={() => navigate('/list-studio')}
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              border: '2px solid white',
              background: 'white',
              color: '#0891b2',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Become a Partner →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        div::-webkit-scrollbar {
          height: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default HomeAppStyle;
