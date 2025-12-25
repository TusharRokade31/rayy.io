import React from 'react';
import Navbar from '../components/Navbar';
import { HelpCircle, Mail, Phone, MessageCircle, Book, FileText } from 'lucide-react';

const Support = () => {
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
            <HelpCircle size={40} color="white" />
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
            Support Center
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748B' }}>
            We're here to help! Get support for rayy - Kids Classes
          </p>
        </div>

        {/* Contact Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {[
            { icon: Mail, title: 'Email Support', desc: 'support@rrray.com', link: 'mailto:support@rrray.com' },
            { icon: Phone, title: 'Phone Support', desc: '+91 9876543210', link: 'tel:+919876543210' },
            { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with us', link: '/help-center' },
            { icon: Book, title: 'Help Center', desc: 'Browse articles', link: '/help-center' }
          ].map((item, idx) => (
            <a key={idx} href={item.link} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}>
              <item.icon size={32} color="#3B82F6" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1rem' }}>{item.title}</div>
              <div style={{ color: '#64748B', fontSize: '0.875rem' }}>{item.desc}</div>
            </a>
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
              Frequently Asked Questions
            </h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                How do I book a class?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Browse classes on our platform, select a session that works for you, and complete the booking with your preferred payment method. You'll receive instant confirmation via email.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                What is the cancellation policy?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Free cancellation is available up to 6 hours before the class starts with 100% refund. Cancellations between 2-6 hours receive 50% refund. No refund for cancellations within 2 hours of class start time.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                How do credits work?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Purchase credit packages at discounted rates and use them to book classes. 1 credit = ₹1. Credits never expire and can be used for any class on our platform.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Can I reschedule a booking?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Yes! You can reschedule your booking once to another available session for the same class. The reschedule option is available in your bookings page.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Are the activity providers verified?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Yes! All partners go through a verification process including KYC documentation. We also collect reviews from parents to help you make informed decisions.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                How do I become a partner?
              </h3>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Click on "List Your Studio" to start the partner onboarding process. Complete your profile, submit verification documents, and start listing your classes once approved.
              </p>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '3rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
              Still Need Help?
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Our support team is available Monday to Saturday, 9 AM to 6 PM IST. Reach out via:
            </p>
            
            <div style={{ 
              background: '#EFF6FF', 
              padding: '1.5rem', 
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Mail size={20} color="#3B82F6" style={{ marginRight: '0.75rem' }} />
                <strong>Email:</strong>&nbsp;
                <a href="mailto:support@rrray.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                  support@rrray.com
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Phone size={20} color="#3B82F6" style={{ marginRight: '0.75rem' }} />
                <strong>Phone:</strong>&nbsp;
                <a href="tel:+919876543210" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                  +91 9876543210
                </a>
              </div>
            </div>

            <div style={{
              background: '#F0FDF4',
              borderLeft: '4px solid #10B981',
              padding: '1rem 1.5rem',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <FileText size={20} color="#10B981" style={{ marginRight: '0.75rem' }} />
                <strong style={{ color: '#059669' }}>Quick Links</strong>
              </div>
              <div style={{ marginLeft: '2rem', color: '#059669' }}>
                <a href="/privacy" style={{ display: 'block', marginBottom: '0.5rem', color: '#059669', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
                <a href="/terms" style={{ display: 'block', marginBottom: '0.5rem', color: '#059669', textDecoration: 'none' }}>
                  Terms of Service
                </a>
                <a href="/faq" style={{ display: 'block', color: '#059669', textDecoration: 'none' }}>
                  FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
