import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import StarRating from './StarRating';
import { User, Calendar } from 'lucide-react';

const ReviewSection = ({ listingId, partnerId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listing'); // 'listing' or 'partner'

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [listingId, partnerId, activeTab]);

  const fetchReviews = async () => {
    try {
      const endpoint = activeTab === 'listing'
        ? `/reviews/listing/${listingId}`
        : `/reviews/partner/${partnerId}`;
      
      const response = await axios.get(`${API}${endpoint}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'listing'
        ? `/reviews/stats/listing/${listingId}`
        : `/reviews/stats/partner/${partnerId}`;
      
      const response = await axios.get(`${API}${endpoint}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#06b6d4',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '0.5rem'
        }}>
          Reviews & Ratings
        </h2>
        
        {/* Tab Switcher */}
        {partnerId && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '0.5rem'
          }}>
            <button
              onClick={() => setActiveTab('listing')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'listing' ? '#06b6d4' : 'transparent',
                color: activeTab === 'listing' ? 'white' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Class Reviews
            </button>
            <button
              onClick={() => setActiveTab('partner')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'partner' ? '#06b6d4' : 'transparent',
                color: activeTab === 'partner' ? 'white' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Studio Reviews
            </button>
          </div>
        )}
      </div>

      {stats && stats.total_reviews > 0 ? (
        <>
          {/* Stats Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '12px'
          }}>
            {/* Overall Rating */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                {stats.average_rating.toFixed(1)}
              </div>
              <StarRating rating={stats.average_rating} size={24} />
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                marginTop: '0.5rem'
              }}>
                Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_distribution[star] || 0;
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

                return (
                  <div key={star} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      minWidth: '60px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#64748b'
                    }}>
                      {star} ⭐
                    </div>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: '#f59e0b',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{
                      minWidth: '40px',
                      fontSize: '14px',
                      color: '#64748b',
                      textAlign: 'right'
                    }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white'
                }}
              >
                {/* Review Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {review.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1e293b',
                        fontSize: '15px'
                      }}>
                        {review.customer_name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.125rem'
                      }}>
                        <Calendar size={12} />
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={18} />
                </div>

                {/* Review Text */}
                <p style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {review.review_text}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#94a3b8'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>
            No reviews yet
          </h3>
          <p style={{ fontSize: '14px' }}>
            Be the first to share your experience!
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReviewSection;
