import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Sparkles, TrendingUp, Users, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';

const ListStudio = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="mobile-heading-xl" style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Outfit, sans-serif'
          }}>
            List Your Studio on rayy
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto 2rem' }}>
            Reach thousands of motivated learners and grow your business
          </p>
          <button
            onClick={() => navigate('/partner-landing')}
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              padding: '1rem 3rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: 'none',
              boxShadow: '0 8px 24px rgba(110, 231, 183, 0.4)'
            }}
          >
            Get Started Today
          </button>
        </div>

        {/* Benefits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {[
            {
              icon: Users,
              title: 'Expand Your Reach',
              desc: 'Connect with thousands of parents actively searching for classes in your area'
            },
            {
              icon: TrendingUp,
              title: 'Boost Revenue',
              desc: 'Fill empty slots and increase bookings with our smart recommendation engine'
            },
            {
              icon: Calendar,
              title: 'Easy Management',
              desc: 'Manage bookings, schedules, and payments all in one intuitive dashboard'
            },
            {
              icon: Sparkles,
              title: 'Marketing Support',
              desc: 'Get featured in our campaigns and benefit from our growing user base'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <item.icon size={30} color="white" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                {item.title}
              </h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '3rem'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your partner account in minutes' },
              { step: '2', title: 'Add Classes', desc: 'List your programs and set your schedule' },
              { step: '3', title: 'Get Bookings', desc: 'Start receiving bookings from interested students' },
              { step: '4', title: 'Grow Together', desc: 'Track performance and scale your business' }
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'white'
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.95rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          padding: '3rem',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Ready to Grow Your Studio?
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            Join 500+ successful partners already on rayy
          </p>
          <button
            onClick={() => navigate('/partner-landing')}
            style={{
              background: 'white',
              color: '#3B82F6',
              padding: '1rem 3rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: 'none'
            }}
          >
            Start Your Partnership
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListStudio;