import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { LayoutDashboard, ListChecks, Calendar, Package } from 'lucide-react';

const PartnerDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Analytics Dashboard', path: '/partner/analytics', color: '#3B82F6', featured: true },
    { icon: ListChecks, label: 'My Listings', path: '/partner/listings', color: '#06b6d4' },
    { icon: Calendar, label: 'Sessions', path: '/partner/sessions', color: '#8b5cf6' },
    { icon: Package, label: 'Bookings', path: '/partner/bookings', color: '#10b981' }
  ];

  return (
    <div data-testid="partner-dashboard" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          marginBottom: '3rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Partner Dashboard</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {menuItems.map((item) => (
            <div
              key={item.path}
              data-testid={item.path.split('/').pop()}
              onClick={() => navigate(item.path)}
              style={{
                background: item.featured ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                borderRadius: '20px',
                padding: '2.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: item.featured ? '0 12px 32px rgba(102, 126, 234, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.08)',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <item.icon size={48} style={{ color: item.featured ? 'white' : item.color, marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: item.featured ? 'white' : '#1e293b' }}>{item.label}</h2>
              {item.featured && (
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginTop: '0.5rem' }}>
                  Complete business insights
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
