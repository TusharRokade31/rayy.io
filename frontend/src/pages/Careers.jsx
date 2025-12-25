import React from 'react';
import Navbar from '../components/Navbar';
import { Briefcase, Heart, Zap, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';

const Careers = () => {
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
            Join Our Team
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Help us build the future of learning. We're always looking for passionate people to join our mission.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {[
            { icon: Heart, title: 'Impact', desc: 'Your work directly helps children discover their potential' },
            { icon: Zap, title: 'Innovation', desc: 'Work with cutting-edge tech and creative solutions' },
            { icon: Globe, title: 'Growth', desc: 'Learn, grow, and scale with a fast-moving startup' },
            { icon: Briefcase, title: 'Culture', desc: 'Join a team that values creativity, empathy, and excellence' }
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
              <p style={{ color: '#64748B' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Open Positions
          </h2>
          <p style={{ color: '#64748B', marginBottom: '2rem' }}>
            We're currently building our team. Check back soon for open positions or send your resume to careers@rrray.com
          </p>
          <button style={{
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: '600',
            border: 'none'
          }}>
            careers@rrray.com
          </button>
        </div>
      </div>
    </div>
  );
};

export default Careers;