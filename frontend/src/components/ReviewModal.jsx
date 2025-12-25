import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { X, Star, Send } from 'lucide-react';
import StarRating from './StarRating';

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [reviewType, setReviewType] = useState('listing'); // 'listing' or 'partner'
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('yuno_token');
      const targetId = reviewType === 'listing' ? booking.listing_id : booking.partner_id;

      await axios.post(
        `${API}/reviews`,
        {
          booking_id: booking.id,
          review_type: reviewType,
          target_id: targetId,
          rating: rating,
          review_text: reviewText.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess && onSuccess();
      onClose();
      
      // Reset form
      setRating(0);
      setReviewText('');
      setReviewType('listing');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.25rem'
            }}>
              Write a Review
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {booking.listing_title || 'Class'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Review Type Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Review for
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setReviewType('listing')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${reviewType === 'listing' ? '#06b6d4' : '#e2e8f0'}`,
                  background: reviewType === 'listing' ? '#e0f2fe' : 'white',
                  color: reviewType === 'listing' ? '#0891b2' : '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📚 Class/Listing
              </button>
              <button
                type="button"
                onClick={() => setReviewType('partner')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${reviewType === 'partner' ? '#06b6d4' : '#e2e8f0'}`,
                  background: reviewType === 'partner' ? '#e0f2fe' : 'white',
                  color: reviewType === 'partner' ? '#0891b2' : '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🏢 Studio/Partner
              </button>
            </div>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.75rem',
              display: 'block'
            }}>
              Your Rating *
            </label>
            <StarRating
              rating={rating}
              interactive={true}
              size={32}
              onChange={setRating}
            />
            {rating > 0 && (
              <p style={{
                fontSize: '13px',
                color: '#64748b',
                marginTop: '0.5rem'
              }}>
                {rating === 5 && '⭐ Excellent!'}
                {rating === 4 && '👍 Very Good'}
                {rating === 3 && '😊 Good'}
                {rating === 2 && '😐 Fair'}
                {rating === 1 && '👎 Poor'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Your Review *
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience... (minimum 10 characters)"
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '0.25rem'
            }}>
              <span>{reviewText.length} characters</span>
              <span>{reviewText.length >= 10 ? '✓ Valid' : 'Min. 10 characters'}</span>
            </div>
          </div>

          {/* Info Notice */}
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: '13px',
              color: '#92400e',
              margin: 0
            }}>
              ℹ️ Your review will be visible after admin approval. This helps maintain quality and trust.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              marginBottom: '1rem'
            }}>
              <p style={{
                fontSize: '13px',
                color: '#991b1b',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              border: 'none',
              background: rating === 0 || reviewText.trim().length < 10 ? '#cbd5e1' : '#06b6d4',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: rating === 0 || reviewText.trim().length < 10 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </form>

        <style>{`
          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReviewModal;
