import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Search, MapPin, Users, Sparkles, Clock, Star, ChevronRight } from 'lucide-react';

const Home = () => {
  const { user, showAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedAge, setSelectedAge] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const ageBands = [
    { label: '1-3', value: '1-3', color: '#fbbf24' },
    { label: '4-6', value: '4-6', color: '#f97316' },
    { label: '7-12', value: '7-12', color: '#06b6d4' },
    { label: '13-18', value: '13-18', color: '#8b5cf6' },
    { label: '19-24', value: '19-24', color: '#ec4899' }
  ];

  const categories = [
    { icon: '🕺', name: 'Dance', slug: 'dance' },
    { icon: '💻', name: 'Coding', slug: 'coding' },
    { icon: '🥋', name: 'Martial Arts', slug: 'karate' },
    { icon: '🎨', name: 'Art & Craft', slug: 'art' },
    { icon: '👶', name: 'Toddler Play', slug: 'toddler' },
    { icon: '💪', name: 'Fitness', slug: 'fitness' }
  ];

  const handleSearch = () => {
    let query = '?';
    if (selectedAge) query += `age=${selectedAge}&`;
    query += `is_online=${isOnline}`;
    navigate(`/search${query}`);
  };

  return (
    <div data-testid="home-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div className="animate-fade-in" style={{
          marginBottom: '3rem'
        }}>
          <h1 data-testid="hero-heading" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontFamily: 'Space Grotesk, sans-serif',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.2'
          }}>
            Find awesome classes near you
          </h1>
          <p data-testid="hero-subheading" style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#64748b',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Pick your age & interests — book in 3 taps. Try a trial. Love it. Join with credits.
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
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    background: selectedAge === band.value ? band.color : '#f1f5f9',
                    color: selectedAge === band.value ? 'white' : '#64748b',
                    fontWeight: '600',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    transform: selectedAge === band.value ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selectedAge === band.value ? `0 4px 12px ${band.color}40` : 'none'
                  }}
                >
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
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'transform 0.2s',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Search size={20} />
            Search Classes
          </button>
        </div>
      </section>

      {/* Categories */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        <h2 data-testid="categories-heading" style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          textAlign: 'center',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Explore by Category</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem'
        }}>
          {categories.map((cat) => (
            <div
              key={cat.slug}
              data-testid={`category-${cat.slug}`}
              onClick={() => navigate(`/search?category=${cat.slug}`)}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
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
              <div style={{ fontSize: '48px', marginBottom: '0.75rem' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem 5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div data-testid="feature-book-last-minute" style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(251, 146, 60, 0.2)'
          }}>
            <Clock size={40} style={{ color: '#f97316', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>Book Last Minute</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>Book classes up to 1 hour before they start. Spontaneous? We've got you covered.</p>
          </div>

          <div data-testid="feature-try-before" style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #a7f3d0 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <Sparkles size={40} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>Try Before You Join</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>Most classes offer trial sessions. Find the perfect fit for your child.</p>
          </div>

          <div data-testid="feature-credit-plans" style={{
            background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <Users size={40} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>Flexible Credit Plans</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>Subscribe and use credits across any class. Save money, stay flexible.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <h2 data-testid="cta-heading" style={{
            fontSize: '36px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '1rem',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>Ready to get started?</h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem' }}>
            Join thousands of parents finding the perfect activities
          </p>
          <button
            data-testid="cta-signup-button"
            onClick={() => showAuth()}
            style={{
              background: 'white',
              color: '#3b82f6',
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '18px',
              transition: 'transform 0.2s',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Sign Up Free
          </button>
        </section>
      )}
    </div>
  );
};

export default Home;
