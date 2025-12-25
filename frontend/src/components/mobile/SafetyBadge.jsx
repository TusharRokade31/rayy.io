import React from 'react';
import { Shield, CheckCircle, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const SafetyBadge = ({ type = 'verified', size = 'default' }) => {
  const badges = {
    verified: {
      icon: Shield,
      text: 'Safety Verified',
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
      textColor: 'text-green-700'
    },
    background_check: {
      icon: CheckCircle,
      text: 'Background Checked',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    hygiene: {
      icon: Heart,
      text: 'Hygiene Certified',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
      textColor: 'text-pink-700'
    },
    premium: {
      icon: Star,
      text: 'Premium Partner',
      color: 'from-yellow-500 to-amber-500',
      bg: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  };

  const badge = badges[type] || badges.verified;
  const Icon = badge.icon;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-xs',
    large: 'px-4 py-2 text-sm'
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 ${badge.bg} ${badge.textColor} ${sizeClasses[size]} rounded-full font-semibold shadow-sm`}
    >
      <Icon className="w-3 h-3" />
      <span>{badge.text}</span>
    </motion.div>
  );
};

export default SafetyBadge;
