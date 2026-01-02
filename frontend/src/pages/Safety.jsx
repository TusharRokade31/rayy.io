import React from 'react';
import Navbar from '../components/Navbar';
import { Shield, Lock, Eye, AlertCircle } from 'lucide-react';

const Safety = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
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
            Safety & Trust
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Your child's safety is our top priority
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {[
            {
              icon: Shield,
              title: 'Verified Partners',
              desc: 'All partner studios undergo thorough verification including background checks and credential validation.'
            },
            {
              icon: Lock,
              title: 'Secure Payments',
              desc: 'Your payment information is encrypted and processed through industry-leading secure payment gateways.'
            },
            {
              icon: Eye,
              title: 'Transparent Reviews',
              desc: 'Read authentic reviews from real parents to make informed decisions about classes for your child.'
            },
            {
              icon: AlertCircle,
              title: 'Safety Standards',
              desc: 'Partners must maintain safety protocols, insurance coverage, and age-appropriate environments.'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
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

        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '3rem'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Outfit, sans-serif' }}>
            Our Safety Commitments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              'Partner Background Verification: All instructors undergo background verification before being approved on rayy.',
              'Secure Data: We use bank-grade encryption to protect your personal and payment information.',
              'Emergency Protocols: All partner venues must have clear emergency procedures and first-aid capabilities.',
              'Parent Communication: Direct communication channels with instructors for any concerns or questions.',
              'Cancellation Protection: Fair cancellation policies ensure you\'re never locked into unsafe situations.',
              'Community Standards: Clear guidelines for partner behavior and student safety.'
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  minWidth: '24px',
                  height: '24px',
                  background: '#10B981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>✓</div>
                <p style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          padding: '3rem',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Report a Safety Concern
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
            If you have any safety concerns, please contact us immediately at safety@rrray.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Safety;