import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Book, Lightbulb, TrendingUp, FileText } from 'lucide-react';

const Resources = () => {
  const navigate = useNavigate();

  const resources = [
    {
      category: 'Getting Started',
      icon: Book,
      items: [
        'Quick Start Guide for New Partners',
        'Setting Up Your First Class',
        'Creating Compelling Listings',
        'Pricing Your Classes Effectively'
      ]
    },
    {
      category: 'Best Practices',
      icon: Lightbulb,
      items: [
        'Engaging Students in Online Classes',
        'Building a Strong Partner Profile',
        'Managing Bookings Efficiently',
        'Handling Cancellations Professionally'
      ]
    },
    {
      category: 'Growth Tips',
      icon: TrendingUp,
      items: [
        'Maximizing Your Visibility on rayy',
        'Getting More 5-Star Reviews',
        'Running Successful Trial Sessions',
        'Seasonal Marketing Strategies'
      ]
    },
    {
      category: 'Policies & Guidelines',
      icon: FileText,
      items: [
        'Partner Code of Conduct',
        'Safety and Compliance Standards',
        'Payout and Commission Structure',
        'Refund and Cancellation Policies'
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
            Partner Resources
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Everything you need to succeed as an rayy partner
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {resources.map((section, idx) => (
            <div key={idx} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <section.icon size={24} color="white" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
                  {section.category}
                </h2>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.items.map((item, i) => (
                  <li key={i} style={{
                    padding: '0.75rem 0',
                    borderBottom: i < section.items.length - 1 ? '1px solid #E2E8F0' : 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3B82F6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#334155'}>
                    <span style={{ marginRight: '0.5rem' }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '3rem',
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          padding: '3rem',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Need More Help?
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
            Our partner success team is here to support you
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/help-center')}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Visit Help Center
            </button>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontWeight: '600',
                border: '2px solid white',
                cursor: 'pointer'
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;