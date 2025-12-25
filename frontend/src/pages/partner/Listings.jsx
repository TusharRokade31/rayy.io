import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PartnerListings = () => {
  const { token } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API}/listings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(response.data.listings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div data-testid="partner-listings" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            fontFamily: 'Space Grotesk, sans-serif',
            color: '#1e293b'
          }}>My Listings</h1>
          <button onClick={() => alert('Create listing - Feature coming soon!')} style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <Plus size={20} />
            New Listing
          </button>
        </div>

        {listings.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '4rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>No listings yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {listings.map((listing) => (
              <div key={listing.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                      {listing.title}
                    </h3>
                    <p style={{ color: '#64748b' }}>₹{listing.base_price_inr} | Age {listing.age_min}-{listing.age_max}</p>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: listing.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: listing.status === 'active' ? '#16a34a' : '#6b7280',
                    borderRadius: '8px',
                    height: 'fit-content',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {listing.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerListings;
