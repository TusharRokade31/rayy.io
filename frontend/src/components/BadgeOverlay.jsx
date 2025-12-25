import React from 'react';
import { Check, Award, Star, Flame } from 'lucide-react';

/**
 * Badge Overlay Component for Listing Cards
 * Displays trust badges on listing images (top-right corner)
 */

const BADGE_CONFIG = {
  verified: {
    label: 'Verified',
    icon: Check,
    bgColor: '#10b981',
    textColor: '#ffffff',
    priority: 1
  },
  top_rated: {
    label: 'Top Rated',
    icon: Star,
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    priority: 2
  },
  founding_partner: {
    label: 'Founding Partner',
    icon: Award,
    bgColor: '#8b5cf6',
    textColor: '#ffffff',
    priority: 3
  },
  popular: {
    label: 'Popular',
    icon: Flame,
    bgColor: '#ef4444',
    textColor: '#ffffff',
    priority: 4
  }
};

const BadgeOverlay = ({ badges = [], maxDisplay = 2, size = 'md' }) => {
  if (!badges || badges.length === 0) return null;

  // Sort badges by priority and take top badges
  const sortedBadges = badges
    .filter(badge => BADGE_CONFIG[badge])
    .sort((a, b) => BADGE_CONFIG[a].priority - BADGE_CONFIG[b].priority)
    .slice(0, maxDisplay);

  if (sortedBadges.length === 0) return null;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: '0.25rem 0.5rem',
      fontSize: '10px',
      iconSize: 12,
      gap: '0.25rem',
      borderRadius: '6px'
    },
    md: {
      padding: '0.375rem 0.625rem',
      fontSize: '11px',
      iconSize: 14,
      gap: '0.375rem',
      borderRadius: '8px'
    },
    lg: {
      padding: '0.5rem 0.75rem',
      fontSize: '12px',
      iconSize: 16,
      gap: '0.5rem',
      borderRadius: '10px'
    }
  };

  const config = sizeConfig[size];

  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 10
    }}>
      {sortedBadges.map((badgeType) => {
        const badge = BADGE_CONFIG[badgeType];
        const IconComponent = badge.icon;

        return (
          <div
            key={badgeType}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: config.gap,
              padding: config.padding,
              background: badge.bgColor,
              color: badge.textColor,
              borderRadius: config.borderRadius,
              fontSize: config.fontSize,
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.02em'
            }}
            title={badge.label}
          >
            <IconComponent size={config.iconSize} strokeWidth={2.5} />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Inline Badge Component for use in listing details
 */
export const InlineBadge = ({ badgeType, size = 'md' }) => {
  const badge = BADGE_CONFIG[badgeType];
  if (!badge) return null;

  const IconComponent = badge.icon;

  const sizeStyles = {
    sm: { padding: '0.25rem 0.5rem', fontSize: '11px', iconSize: 12 },
    md: { padding: '0.375rem 0.625rem', fontSize: '12px', iconSize: 14 },
    lg: { padding: '0.5rem 0.75rem', fontSize: '14px', iconSize: 16 }
  };

  const style = sizeStyles[size];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: style.padding,
      background: badge.bgColor,
      color: badge.textColor,
      borderRadius: '8px',
      fontSize: style.fontSize,
      fontWeight: '600',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <IconComponent size={style.iconSize} strokeWidth={2.5} />
      <span>{badge.label}</span>
    </div>
  );
};

export default BadgeOverlay;
