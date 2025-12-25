import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { 
  Plus, Search, Filter, Edit, Eye, Archive, 
  TrendingUp, Users, Clock, IndianRupee, Star,
  MoreVertical, Copy, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const PartnerListingsManager = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, draft, archived

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/partner/listings/new');
  };

  const handleEdit = (listingId) => {
    navigate(`/partner/listings/edit/${listingId}`);
  };

  const handleView = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  const handleArchive = async (listingId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.patch(
        `${API}/listings/${listingId}`,
        { status: 'archived' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Listing archived successfully');
      fetchListings();
    } catch (error) {
      toast.error('Failed to archive listing');
    }
  };

  const handleDuplicate = async (listingId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(
        `${API}/listings/${listingId}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Listing duplicated successfully');
      fetchListings();
    } catch (error) {
      toast.error('Failed to duplicate listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#FBBF24';
      case 'archived': return '#64748B';
      default: return '#64748B';
    }
  };

  const ListingCard = ({ listing }) => (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '2px solid #f1f5f9'
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%',
        height: '200px',
        backgroundImage: listing.media?.[0] ? `url(${listing.media[0]})` : 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <div style={{
            background: getStatusColor(listing.status),
            color: 'white',
            padding: '0.375rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'Outfit, sans-serif'
          }}>
            {listing.status}
          </div>
          {listing.trial_available && (
            <div style={{
              background: '#FBBF24',
              color: 'white',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Trial ₹{listing.trial_price_inr}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#1E293B',
          marginBottom: '0.5rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {listing.title}
        </h3>
        <p style={{
          fontSize: '0.95rem',
          color: '#64748B',
          marginBottom: '1rem',
          fontFamily: 'Outfit, sans-serif',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {listing.description}
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#F9FAFB',
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
              Price
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', fontFamily: 'Outfit, sans-serif' }}>
              ₹{listing.base_price_inr}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
              Duration
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', fontFamily: 'Outfit, sans-serif' }}>
              {listing.duration_minutes}min
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>
              Age
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', fontFamily: 'Outfit, sans-serif' }}>
              {listing.age_min}-{listing.age_max}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleView(listing.id)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'white',
              color: '#3B82F6',
              border: '2px solid #3B82F6',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Eye size={16} />
            View
          </button>
          <button
            onClick={() => handleEdit(listing.id)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => handleArchive(listing.id)}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'white',
              color: '#EF4444',
              border: '2px solid #FEE2E2',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <Archive size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading listings...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1E293B',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.5rem'
            }}>
              My Listings
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Manage your classes and sessions
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="btn-scale"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              border: 'none',
              boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={20} />
            Create New Listing
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'active', 'draft', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: filterStatus === status ? 'none' : '2px solid #e2e8f0',
                  background: filterStatus === status ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : 'white',
                  color: filterStatus === status ? 'white' : '#64748B',
                  fontWeight: '600',
                  fontSize: '14px',
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '4rem 2rem',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              No listings yet
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              marginBottom: '2rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Create your first listing to start accepting bookings
            </p>
            <button
              onClick={handleCreateNew}
              className="btn-scale"
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={20} />
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerListingsManager;
