import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Interactive Star Rating Component
 * Can be used for display or input
 */
const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 20, 
  interactive = false, 
  onChange = () => {},
  showCount = false,
  reviewCount = 0
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const handleClick = (value) => {
    if (!interactive) return;
    setSelectedRating(value);
    onChange(value);
  };

  const handleMouseEnter = (value) => {
    if (!interactive) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const displayRating = interactive ? (hoverRating || selectedRating) : rating;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isHalfFilled = !interactive && starValue - 0.5 <= rating && starValue > rating;

          return (
            <div
              key={index}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'transform 0.1s',
                transform: interactive && hoverRating === starValue ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {isHalfFilled ? (
                // Half star for display mode
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Star size={size} fill="#e5e7eb" color="#e5e7eb" />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '50%',
                    overflow: 'hidden'
                  }}>
                    <Star size={size} fill="#f59e0b" color="#f59e0b" />
                  </div>
                </div>
              ) : (
                <Star
                  size={size}
                  fill={isFilled ? '#f59e0b' : '#e5e7eb'}
                  color={isFilled ? '#f59e0b' : '#e5e7eb'}
                  strokeWidth={1.5}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {showCount && reviewCount > 0 && (
        <span style={{
          fontSize: '14px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          ({reviewCount})
        </span>
      )}
      
      {!showCount && rating > 0 && (
        <span style={{
          fontSize: '14px',
          color: '#64748b',
          fontWeight: '600'
        }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
