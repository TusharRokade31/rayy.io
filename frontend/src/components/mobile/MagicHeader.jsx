import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MagicHeader = ({ title, subtitle, gradient = 'from-blue-500 via-purple-500 to-pink-500', onBack, children }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`relative bg-gradient-to-br ${gradient} pt-5 pb-6 overflow-hidden`}>
      {/* Top overlay to hide blue line - matches page gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} style={{ zIndex: 999999 }} />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4">
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white drop-shadow-lg"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-white/90"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
        {children}
      </div>

      <style>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};

export default MagicHeader;
