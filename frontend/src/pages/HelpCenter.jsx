import React from 'react';
import Navbar from '../components/Navbar';
import { HelpCircle, BookOpen, MessageCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

const HelpCenter = () => {
  const faqs = [
    {
      category: 'Booking',
      questions: [
        { q: 'How do I book a class?', a: 'Browse classes, click on your preferred option, select a session, and complete the checkout process.' },
        { q: 'Can I cancel a booking?', a: 'Yes, cancellations made 6+ hours before the session receive 100% refund. 2-6 hours: 50% refund.' },
        { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards via Razorpay, and rayy Credits from your wallet.' }
      ]
    },
    {
      category: 'Classes',
      questions: [
        { q: 'Are trial classes available?', a: 'Many partners offer trial classes at a discounted rate. Look for the "Trial Available" badge.' },
        { q: 'What age groups do you cater to?', a: 'We offer classes for ages 1-24, from toddlers to young adults.' },
        { q: 'Are classes online or offline?', a: 'We offer both! Filter your search to find online-only or location-based classes.' }
      ]
    },
    {
      category: 'Account',
      questions: [
        { q: 'How do I add child profiles?', a: 'Go to Profile > Add Child Profile. You can add multiple children to your account.' },
        { q: 'How do rayy Credits work?', a: 'Credits can be purchased in bundles and used for bookings. 1 credit = ₹20 value.' },
        { q: 'Can I update my location?', a: 'Yes, click the location badge in the navbar to update your preferred area.' }
      ]
    }
  ];

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
            Help Center
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Find answers to common questions
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <BookOpen size={32} color="#3B82F6" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '600' }}>Browse FAQs</div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <MessageCircle size={32} color="#3B82F6" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '600' }}>Live Chat</div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <Mail size={32} color="#3B82F6" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '600' }}>Email Support</div>
          </div>
        </div>

        {/* FAQs */}
        {faqs.map((section, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              fontFamily: 'Outfit, sans-serif',
              color: '#1E293B'
            }}>
              {section.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {section.questions.map((item, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <HelpCircle size={20} color="#3B82F6" />
                    {item.q}
                  </div>
                  <p style={{ color: '#64748B', lineHeight: '1.6', paddingLeft: '1.75rem' }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact Section */}
        <div style={{
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          padding: '3rem',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Still need help?
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
            Our support team is here to assist you
          </p>
          <button style={{
            background: 'white',
            color: '#3B82F6',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: '600',
            border: 'none'
          }}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;