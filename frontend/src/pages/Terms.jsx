import React from 'react';
import Navbar from '../components/Navbar';
import { FileText } from 'lucide-react';

const Terms = () => {
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
            <FileText size={40} color="white" />
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748B' }}>
            Last updated: January 2025
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ lineHeight: '1.8', color: '#334155' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              By accessing and using rayy's platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              2. Use of Services
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              rayy provides a platform connecting students with educational classes and activities. You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account information.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              3. Bookings and Payments
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              All bookings are subject to availability and confirmation. Payment must be made at the time of booking. Refunds are governed by our cancellation policy: 100% refund for cancellations 6+ hours before the session, 50% refund for 2-6 hours before, no refund within 2 hours of the session.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              4. Partner Responsibilities
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              Partners listing classes on rayy must provide accurate information, maintain proper licensing and insurance, ensure safe environments, and comply with all applicable laws and regulations.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              5. Liability and Disclaimers
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              rayy acts as a platform connecting users with service providers. We are not responsible for the quality, safety, or legality of classes listed, the ability of partners to provide services, or the conduct of users. All bookings are between the user and the partner.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              6. Intellectual Property
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              All content on the rayy platform, including text, graphics, logos, and software, is the property of rayy or its content suppliers and is protected by copyright and other intellectual property laws.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              7. Modifications to Terms
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              rayy reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
            </p>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              8. Contact Information
            </h2>
            <p>
              For questions about these Terms of Service, please contact us at legal@rrray.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;