import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', onClick, delay = 0, hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      whileHover={hover ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-3xl opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
