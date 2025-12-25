import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is rayy?',
          a: 'rayy is a marketplace platform connecting students (ages 1-24) with quality classes across various categories including art, coding, dance, fitness, and more.'
        },
        {
          q: 'How do I sign up?',
          a: 'Click the "Login / Sign Up" button in the top right corner. You can create a customer account to book classes or a partner account to list your studio.'
        },
        {
          q: 'Is rayy available in my city?',
          a: 'We\'re currently available in 25+ cities across India and growing. You can also access online classes from anywhere!'
        }
      ]
    },
    {
      category: 'For Customers',
      questions: [
        {
          q: 'How do I book a class?',
          a: 'Browse classes, select your preferred session, add your child\'s information, choose a payment method, and confirm your booking. You\'ll receive instant confirmation.'
        },
        {
          q: 'What is the cancellation policy?',
          a: '100% refund for cancellations 6+ hours before the session, 50% refund for 2-6 hours before, no refund within 2 hours of the session start time.'
        },
        {
          q: 'Can I reschedule a booking?',
          a: 'Yes! Go to "My Bookings" and click "Reschedule" on any confirmed booking to select a different session.'
        },
        {
          q: 'What are rayy Credits?',
          a: 'Credits are a payment method you can purchase in bundles. 1 credit = ₹20. Use credits for bookings and get discounts on bulk purchases.'
        },
        {
          q: 'Are trial classes available?',
          a: 'Yes! Many partners offer trial sessions at discounted rates. Look for the "Trial Available" badge on listings.'
        }
      ]
    },
    {
      category: 'For Partners',
      questions: [
        {
          q: 'How do I become a partner?',
          a: 'Click "Become a Partner" and complete the registration form with your studio details, KYC documents, and bank information. Our team will review and approve your account.'
        },
        {
          q: 'What is the commission structure?',
          a: 'rayy charges a 15% commission on each booking. You receive 85% of the booking amount, paid out weekly after successful session completion.'
        },
        {
          q: 'How do I manage my schedule?',
          a: 'Use the Partner Dashboard to create sessions, set availability, manage bookings, and track attendance all in one place.'
        },
        {
          q: 'When will I receive my payments?',
          a: 'Payouts are processed weekly for all sessions marked as "attended". You can request a payout once your balance reaches ₹500.'
        },
        {
          q: 'Can I offer discounts or promotions?',
          a: 'Yes! You can create trial sessions, multi-session plans with discounts, and special pricing to attract more students.'
        }
      ]
    },
    {
      category: 'Safety & Trust',
      questions: [
        {
          q: 'How are partners verified?',
          a: 'All partners undergo KYC verification including document checks, address verification, and background validation before being approved.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, all payments are processed through secure, PCI-compliant payment gateways. We never store your complete card details.'
        },
        {
          q: 'What if I have a safety concern?',
          a: 'Report any safety concerns immediately to safety@rrray.com. We take all reports seriously and investigate promptly.'
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

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
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B' }}>
            Find quick answers to common questions
          </p>
        </div>

        {faqs.map((section, catIdx) => (
          <div key={catIdx} style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              fontFamily: 'Outfit, sans-serif',
              color: '#1E293B'
            }}>
              {section.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {section.questions.map((item, qIdx) => {
                const isOpen = openIndex === `${catIdx}-${qIdx}`;
                return (
                  <div key={qIdx} style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => toggleFAQ(catIdx, qIdx)}
                      style={{
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isOpen ? '#F0F9FF' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: isOpen ? '#0891B2' : '#334155',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        {item.q}
                      </span>
                      {isOpen ? <ChevronUp size={20} color="#0891B2" /> : <ChevronDown size={20} color="#64748B" />}
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '1.5rem',
                        borderTop: '1px solid #E2E8F0',
                        background: '#F9FAFB'
                      }}>
                        <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          padding: '3rem',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Still have questions?
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
            Our support team is here to help
          </p>
          <button style={{
            background: 'white',
            color: '#3B82F6',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;