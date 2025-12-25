import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../App';
import { API } from '../App';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Search, MapPin, Users, Sparkles, Clock, Star, ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const HomeEnriched = () => {
  const { user, showAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedAge, setSelectedAge] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // Section data
  const [trending, setTrending] = useState([]);
  const [trials, setTrials] = useState([]);
  const [startingSoon, setStartingSoon] = useState([]);
  const [weekendCamps, setWeekendCamps] = useState([]);
  const [forAge, setForAge] = useState([]);
  const [topPartners, setTopPartners] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);

  const ageBands = [
    { label: '1-3', value: '1-3', color: '#FBBF24', age: 2, emoji: '🍼' },
    { label: '4-6', value: '4-6', color: '#F472B6', age: 5, emoji: '👦🏽' },
    { label: '7-12', value: '7-12', color: '#6EE7B7', age: 9, emoji: '🧑🏻‍💻' },
    { label: '13-18', value: '13-18', color: '#8b5cf6', age: 15, emoji: '🧘🏻‍♀️' },
    { label: '19-24', value: '19-24', color: '#3B82F6', age: 21, emoji: '💼' }
  ];

  useEffect(() => {
    fetchHomeData();
    
    // Refresh starting soon every minute
    const interval = setInterval(() => {
      fetchStartingSoon();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (selectedAge) {
      const band = ageBands.find(b => b.value === selectedAge);
      if (band) {
        fetchForAge(band.age);
      }
    }
  }, [selectedAge]);

  const fetchHomeData = async () => {
    try {
      const [trendingRes, trialsRes, soonRes, campsRes, partnersRes] = await Promise.all([
        axios.get(`${API}/home/trending`),
        axios.get(`${API}/home/trials`),
        axios.get(`${API}/home/starting-soon`),
        axios.get(`${API}/home/weekend-camps`),
        axios.get(`${API}/home/top-partners`)
      ]);
      
      setTrending(trendingRes.data.listings || []);
      setTrials(trialsRes.data.listings || []);
      setStartingSoon(soonRes.data.sessions || []);
      setWeekendCamps(campsRes.data.sessions || []);
      setTopPartners(partnersRes.data.partners || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
    setLoading(false);
  };
  
  const fetchStartingSoon = async () => {
    try {
      const res = await axios.get(`${API}/home/starting-soon`);
      setStartingSoon(res.data.sessions || []);
    } catch (error) {
      console.error('Error fetching starting soon:', error);
    }
  };
  
  const fetchForAge = async (age) => {
    try {
      const res = await axios.get(`${API}/home/for-age/${age}`);
      setForAge(res.data.listings || []);
    } catch (error) {
      console.error('Error fetching for age:', error);
    }
  };

  const handleSearch = () => {
    let query = '?';
    if (selectedAge) query += `age=${selectedAge}&`;
    query += `is_online=${isOnline}`;
    navigate(`/search${query}`);
  };
  
  const Countdown = ({ seconds }) => {
    const [remaining, setRemaining] = useState(seconds);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }, []);
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;
    
    return (
      <span style={{ fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <div data-testid="home-enriched" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 2rem 2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Animated gradient background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(110, 231, 183, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <h1 data-testid="hero-heading" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            marginBottom: '1.5rem',
            fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.2'
          }}>
            Discover cool classes that make you shine
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#64748B',
            maxWidth: '700px',
            margin: '0 auto 2rem',
            lineHeight: '1.6',
            fontFamily: 'Outfit, sans-serif'
          }}>
            From art to AI — book trials in 3 taps 💫
          </p>
        </div>

        {/* Search Widget */}
        <div data-testid="search-widget" style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          maxWidth: '900px',
          margin: '0 auto',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>Select Age</h3>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {ageBands.map((band) => (
                <button
                  key={band.value}
                  data-testid={`age-band-${band.value}`}
                  onClick={() => setSelectedAge(band.value)}
                  className="btn-scale"
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '16px',
                    background: selectedAge === band.value ? band.color : '#f1f5f9',
                    color: selectedAge === band.value ? 'white' : '#64748B',
                    fontWeight: '600',
                    fontSize: '16px',
                    fontFamily: 'Outfit, sans-serif',
                    border: selectedAge === band.value ? 'none' : '2px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: selectedAge === band.value ? `0 4px 12px ${band.color}40` : 'none'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{band.emoji}</span>
                  {band.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            justifyContent: 'center'
          }}>
            <button
              data-testid="location-near-me"
              onClick={() => setIsOnline(false)}
              style={{
                flex: 1,
                maxWidth: '200px',
                padding: '0.875rem',
                borderRadius: '12px',
                background: !isOnline ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : '#f1f5f9',
                color: !isOnline ? 'white' : '#64748b',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MapPin size={18} />
              Near Me
            </button>
            <button
              data-testid="location-online"
              onClick={() => setIsOnline(true)}
              style={{
                flex: 1,
                maxWidth: '200px',
                padding: '0.875rem',
                borderRadius: '12px',
                background: isOnline ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : '#f1f5f9',
                color: isOnline ? 'white' : '#64748b',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={18} />
              Online
            </button>
          </div>

          <button
            data-testid="search-button"
            onClick={handleSearch}
            className="btn-scale"
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              border: 'none',
              boxShadow: '0 8px 24px rgba(110, 231, 183, 0.3)'
            }}
          >
            <Search size={20} />
            Search Classes
          </button>
        </div>
      </section>

      {/* SECTION 1: Trending Near You */}
      {trending.length >= 4 && (
        <section style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={28} style={{ color: '#06b6d4' }} />
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#1e293b'
              }}>Trending Near You</h2>
            </div>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Parents booked these most this week</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {trending.slice(0, 10).map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                {listing.media && listing.media[0] && (
                  <div style={{
                    width: '100%',
                    height: '160px',
                    backgroundImage: `url(${listing.media[0]}?w=400&h=160&fit=crop)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                )}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                    {listing.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Users size={14} style={{ color: '#06b6d4' }} />
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Age {listing.age_min}-{listing.age_max}</span>
                    </div>
                    {listing.rating_avg > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{listing.rating_avg}</span>
                      </div>
                    )}
                  </div>
                  
                  {listing.next_session && (
                    <>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                        Next: {format(new Date(listing.next_session.start_at), 'MMM dd, h:mm a')}
                      </div>
                      
                      {/* Seat progress bar */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          marginBottom: '0.375rem',
                          color: '#64748b'
                        }}>
                          <span>Seats available</span>
                          <span style={{ fontWeight: '600', color: listing.next_session.seats_available <= 3 ? '#ef4444' : '#10b981' }}>
                            {listing.next_session.seats_available} left
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(listing.next_session.seats_available / 10) * 100}%`,
                            height: '100%',
                            background: listing.next_session.seats_available <= 3 ? '#ef4444' : '#10b981',
                            transition: 'width 0.5s ease-out'
                          }} />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <button style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Quick Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: Trial Sessions */}
      {trials.length >= 4 && (
        <section style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderRadius: '24px',
          marginLeft: '2rem',
          marginRight: '2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Sparkles size={28} style={{ color: '#10b981' }} />
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#1e293b'
              }}>Trial Sessions This Week</h2>
            </div>
            <p style={{ fontSize: '15px', color: '#047857' }}>Try before you join • First-timer friendly</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {trials.slice(0, 8).map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                  border: '2px solid #d1fae5'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '0.375rem 0.875rem',
                  background: '#d1fae5',
                  color: '#065f46',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Trial: ₹{listing.trial_price_inr || 'Free'}
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>
                  {listing.title}
                </h3>
                
                {listing.next_session && (
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem' }}>
                    {format(new Date(listing.next_session.start_at), 'EEE, MMM dd • h:mm a')}
                  </div>
                )}
                
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}>
                  Book Trial
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Starting Soon */}
      {startingSoon.length >= 4 && (
        <section style={{
          maxWidth: '1400px',
          margin: '3rem auto',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Clock size={28} style={{ color: '#ef4444' }} />
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#1e293b'
              }}>Starting Soon</h2>
            </div>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Last-minute plans? We've got you</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {startingSoon.map((session) => (
              <div
                key={session.id}
                onClick={() => session.listing && navigate(`/listings/${session.listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
                  border: '2px solid #fee2e2'
                }}
              >
                {session.listing && (
                  <>
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>Starts in</div>
                    <div style={{ fontSize: '32px', marginBottom: '1rem' }}>
                      <Countdown seconds={session.countdown_seconds} />
                    </div>
                    
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                      {session.listing.title}
                    </h3>
                    
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem' }}>
                      {format(new Date(session.start_at), 'h:mm a')} • Age {session.listing.age_min}-{session.listing.age_max}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                        ₹{session.listing.base_price_inr}
                      </div>
                      <button
                        disabled={session.countdown_seconds < 3600}
                        style={{
                          padding: '0.625rem 1.25rem',
                          background: session.countdown_seconds >= 3600 ? '#ef4444' : '#e2e8f0',
                          color: session.countdown_seconds >= 3600 ? 'white' : '#94a3b8',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: session.countdown_seconds >= 3600 ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: Weekend Camps */}
      {weekendCamps.length >= 4 && (
        <section style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>Weekend Camps & Workshops</h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Bigger sessions for big smiles</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem'
          }}>
            {weekendCamps.slice(0, 6).map((session) => (
              session.listing && (
                <div
                  key={session.id}
                  onClick={() => navigate(`/listings/${session.listing.id}`)}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {session.listing.media && session.listing.media[0] && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundImage: `url(${session.listing.media[0]}?w=500&h=200&fit=crop)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />
                  )}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.375rem 0.875rem',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      {format(new Date(session.start_at), 'EEE, MMM dd')}
                    </div>
                    
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
                      {session.listing.title}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>Duration</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                          {session.listing.duration_minutes} min
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>Price</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                          ₹{session.listing.base_price_inr}
                        </div>
                      </div>
                    </div>
                    
                    <button style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}>
                      Book Workshop
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: For Your Child's Age */}
      {forAge.length >= 4 && selectedAge && (
        <section style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>For Your Child's Age ({selectedAge})</h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Handpicked for this age band</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {forAge.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>
                  {listing.title}
                </h3>
                
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem' }}>
                  {listing.duration_minutes} min • ₹{listing.base_price_inr}
                </div>
                
                {listing.next_session && (
                  <div style={{ fontSize: '13px', color: '#06b6d4', fontWeight: '600', marginBottom: '1rem' }}>
                    Next: {format(new Date(listing.next_session.start_at), 'MMM dd, h:mm a')}
                  </div>
                )}
                
                <button style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: '#f1f5f9',
                  color: '#1e293b',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 6: Top-Rated Partners */}
      {topPartners.length >= 4 && (
        <section style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 2rem 5rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>Top-Rated Partners</h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Loved by parents nearby</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {topPartners.map((partner) => (
              <div
                key={partner.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/search?partner=${partner.id}`)}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Star size={20} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                      {partner.avg_rating?.toFixed(1) || '4.8'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                    {partner.brand_name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '0.375rem' }} />
                    {partner.city}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {partner.categories && partner.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: '#f1f5f9',
                        color: '#64748b',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  View Classes
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeEnriched;
