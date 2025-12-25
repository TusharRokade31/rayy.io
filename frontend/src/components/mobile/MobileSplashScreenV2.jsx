import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileSplashScreenV2 = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
        >
          {/* Background animated circles */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute bottom-32 left-10 w-60 h-60 bg-white/20 rounded-full blur-3xl"
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
              className="mb-8"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl" />
                
                {/* Logo text */}
                <h1 className="relative text-8xl font-black text-white tracking-tight">
                  rayy
                </h1>
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut"
              }}
              className="space-y-2"
            >
              <p className="text-white text-xl font-semibold text-center tracking-wide">
                Learn • Play • Shine
              </p>
              
              {/* Animated underline */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.6,
                  ease: "easeOut"
                }}
                className="h-0.5 bg-white/60 mx-auto"
              />
            </motion.div>

            {/* Sparkle animations */}
            <motion.div
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full"
            />
            <motion.div
              animate={{
                scale: [0, 1, 0],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-white rounded-full"
            />
            <motion.div
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-1/2 left-1/3 w-2 h-2 bg-white rounded-full"
            />
          </div>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-20"
          >
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSplashScreenV2;
