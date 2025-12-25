import React from 'react';
import Navbar from '../components/Navbar';
import { Newspaper, Mail, Download } from 'lucide-react';
import { Button } from '../components/ui/button';

const Press = () => {
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
            Press & Media
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Latest news, press releases, and media resources
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{
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
              <Newspaper size={30} color="white" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Press Releases
            </h3>
            <p style={{ color: '#64748B', marginBottom: '1rem' }}>
              Latest announcements and company news
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Download size={30} color="white" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Media Kit
            </h3>
            <p style={{ color: '#64748B', marginBottom: '1rem' }}>
              Logos, brand guidelines, and assets
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Mail size={30} color="white" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Media Contact
            </h3>
            <p style={{ color: '#64748B', marginBottom: '1rem' }}>
              Get in touch with our PR team
            </p>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
            For Media Inquiries
          </h2>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748B', marginBottom: '2rem', lineHeight: '1.6' }}>
              For press inquiries, interview requests, or partnership opportunities, please contact our media team.
            </p>
            <button style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none'
            }}>
              press@rrray.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;