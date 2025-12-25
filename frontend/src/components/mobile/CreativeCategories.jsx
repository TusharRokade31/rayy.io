import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CreativeCategories = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'activity',
      name: 'Activity',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      query: 'fitness',
      animation: 'bounce'
    },
    {
      id: 'sports',
      name: 'Sports',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      query: 'sports',
      animation: 'spin'
    },
    {
      id: 'educational',
      name: 'Educational',
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      query: 'coding',
      animation: 'pulse'
    }
  ];

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id);
    navigate(`/search?category=${category.query}`);
  };

  // SVG Icon Components with Animations
  const ActivityIcon = ({ isActive }) => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
      {/* Running person with animated legs */}
      <motion.g
        animate={isActive ? {
          rotate: [0, -5, 5, 0],
          y: [0, -2, 0]
        } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        {/* Head */}
        <motion.circle
          cx="32"
          cy="16"
          r="6"
          className="fill-current text-pink-500"
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Body */}
        <path
          d="M32 22 L32 38"
          className="stroke-current text-pink-500"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Arms */}
        <motion.path
          d="M32 26 L40 32"
          className="stroke-current text-pink-500"
          strokeWidth="3"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M32 26 L40 32",
              "M32 26 L38 34",
              "M32 26 L40 32"
            ]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
        <motion.path
          d="M32 26 L24 32"
          className="stroke-current text-pink-500"
          strokeWidth="3"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M32 26 L24 32",
              "M32 26 L26 34",
              "M32 26 L24 32"
            ]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
        {/* Legs - Animated */}
        <motion.path
          d="M32 38 L28 50"
          className="stroke-current text-pink-500"
          strokeWidth="3"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M32 38 L28 50",
              "M32 38 L36 50",
              "M32 38 L28 50"
            ]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
        <motion.path
          d="M32 38 L36 50"
          className="stroke-current text-pink-500"
          strokeWidth="3"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M32 38 L36 50",
              "M32 38 L28 50",
              "M32 38 L36 50"
            ]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </motion.g>
      {/* Energy waves */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="32"
          cy="32"
          r="20"
          className="stroke-current text-pink-400"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={isActive ? {
            scale: [1, 1.8],
            opacity: [0.5, 0]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6
          }}
        />
      ))}
    </svg>
  );

  const SportsIcon = ({ isActive }) => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
      {/* Soccer ball */}
      <motion.g
        animate={isActive ? {
          rotate: 360
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="32"
          cy="32"
          r="18"
          className="fill-current text-blue-500"
        />
        {/* Pentagon pattern */}
        <motion.path
          d="M32 18 L38 22 L36 30 L28 30 L26 22 Z"
          className="fill-white"
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Hexagons around */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <motion.path
            key={angle}
            d={`M${32 + 12 * Math.cos((angle * Math.PI) / 180)} ${32 + 12 * Math.sin((angle * Math.PI) / 180)} 
                L${32 + 16 * Math.cos(((angle + 30) * Math.PI) / 180)} ${32 + 16 * Math.sin(((angle + 30) * Math.PI) / 180)}
                L${32 + 16 * Math.cos(((angle - 30) * Math.PI) / 180)} ${32 + 16 * Math.sin(((angle - 30) * Math.PI) / 180)} Z`}
            className="fill-white"
            initial={{ opacity: 0.7 }}
            animate={isActive ? {
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.g>
      {/* Motion lines */}
      {isActive && [0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${52 + i * 4} 32 Q${56 + i * 4} 28 ${60 + i * 4} 32`}
          className="stroke-current text-blue-400"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ x: 0, opacity: 0.8 }}
          animate={{
            x: -30,
            opacity: 0
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
    </svg>
  );

  const EducationalIcon = ({ isActive }) => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
      {/* Book */}
      <motion.g
        animate={isActive ? {
          rotateY: [0, 15, 0]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '32px 32px' }}
      >
        <rect
          x="22"
          y="20"
          width="20"
          height="24"
          rx="2"
          className="fill-current text-purple-500"
        />
        <rect
          x="32"
          y="20"
          width="10"
          height="24"
          className="fill-current text-indigo-500"
        />
        {/* Pages */}
        {[0, 1, 2].map((i) => (
          <motion.rect
            key={i}
            x="24"
            y={24 + i * 5}
            width="14"
            height="2"
            rx="1"
            className="fill-white opacity-60"
            animate={isActive ? {
              x: [24, 22, 24],
              opacity: [0.6, 1, 0.6]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.g>
      
      {/* Graduation cap */}
      <motion.g
        animate={isActive ? {
          y: [-2, 2, -2],
          rotate: [-3, 3, -3]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path
          d="M32 12 L44 16 L32 20 L20 16 Z"
          className="fill-current text-purple-600"
        />
        <rect
          x="30"
          y="20"
          width="4"
          height="8"
          className="fill-current text-purple-600"
        />
        <circle
          cx="32"
          cy="28"
          r="2"
          className="fill-current text-yellow-400"
        />
      </motion.g>

      {/* Sparkles */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={isActive ? {
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: [0, (i - 1) * 8],
            y: [0, -8]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5
          }}
        >
          <path
            d={`M${48 + i * 6} ${18 + i * 3} l1 3 l3 1 l-3 1 l-1 3 l-1-3 l-3-1 l3-1 Z`}
            className="fill-current text-yellow-400"
          />
        </motion.g>
      ))}
    </svg>
  );

  const iconComponents = {
    activity: ActivityIcon,
    sports: SportsIcon,
    educational: EducationalIcon
  };

  return (
    <div className="flex justify-center gap-6 px-4 py-4">
      {categories.map((category, index) => {
        const IconComponent = iconComponents[category.id];
        const isActive = activeCategory === category.id;

        return (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 relative group"
          >
            {/* Animated Icon Container */}
            <motion.div
              className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${category.bgGradient} flex items-center justify-center overflow-hidden shadow-xl`}
              animate={{
                boxShadow: isActive 
                  ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
                  : '0 10px 20px -5px rgba(0, 0, 0, 0.15)'
              }}
              whileHover={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
              }}
            >
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              {/* Floating particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${30 + i * 20}%`
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    x: [-5, 5, -5],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3
                  }}
                />
              ))}
              
              {/* Icon */}
              <div className="relative z-10">
                <IconComponent isActive={isActive} />
              </div>
            </motion.div>

            {/* Category Label */}
            <motion.span 
              className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors"
              animate={{ 
                scale: isActive ? 1.05 : 1,
                color: isActive ? '#1f2937' : '#374151'
              }}
            >
              {category.name}
            </motion.span>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${category.gradient}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default CreativeCategories;
