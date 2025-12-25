import React from 'react';
import Navbar from '../components/Navbar';
import { Lock, Eye, Shield, Database } from 'lucide-react';

const Privacy = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Lock size={40} color="white" />
          </div>
          <h1 className="mobile-heading-xl" style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748B' }}>
            Last updated: January 2025
          </p>
        </div>

        {/* Key Principles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {[
            { icon: Shield, title: 'Data Protection', desc: 'Your data is encrypted and secure' },
            { icon: Eye, title: 'Transparency', desc: 'Clear about what we collect' },
            { icon: Lock, title: 'Privacy First', desc: 'We never sell your data' },
            { icon: Database, title: 'Your Control', desc: 'Access and delete anytime' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              textAlign: 'center'
            }}>
              <item.icon size={32} color="#3B82F6" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1rem' }}>{item.title}</div>
              <div style={{ color: '#64748B', fontSize: '0.875rem' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ lineHeight: '1.8', color: '#334155' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              We collect information you provide directly to us, such as when you create an account, make a booking, or contact us. This includes name, email address, phone number, payment information, and information about your children (age, interests) for class recommendations.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process bookings and transactions</li>
              <li>Send you booking confirmations and updates</li>
              <li>Recommend relevant classes based on your preferences</li>
              <li>Respond to your comments and questions</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Information Sharing
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              We share your information with partner studios when you make a booking, with service providers who perform services on our behalf, and when required by law. We never sell your personal information to third parties.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Data Security
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              We use industry-standard security measures to protect your personal information, including encryption of sensitive data and secure payment processing through certified payment gateways.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Your Rights
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              You have the right to access, update, or delete your personal information at any time through your account settings. You can also contact us at privacy@rrray.com to exercise these rights.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Children's Privacy
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              We take special care with information about children. Parents or guardians must create accounts and make bookings on behalf of children. We only collect information necessary to provide our services.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at privacy@rrray.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;