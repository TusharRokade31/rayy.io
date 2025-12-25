import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';

const PartnerBookings = () => {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // In real app, would need a /api/bookings/partner endpoint
    // For now, showing empty state
  }, []);

  return (
    <div data-testid="partner-bookings" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Bookings</h1>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '4rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Partner bookings view - feature in development</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerBookings;
