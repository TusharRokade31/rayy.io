import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AirbnbStyleCategories = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'activity',
      name: 'Activity',
      gradient: 'from-pink-500 to-rose-500',
      query: 'fitness'
    },
    {
      id: 'sports',
      name: 'Sports',
      gradient: 'from-blue-500 to-cyan-500',
      query: 'sports'
    },
    {
      id: 'educational',
      name: 'Educational',
      gradient: 'from-purple-500 to-indigo-500',
      query: 'coding'
    }
  ];

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id);
    navigate(`/search?category=${category.query}`);
  };

  // Airbnb-style Activity Icon (Running person simplified)
  const ActivityIcon = ({ isActive }) => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <motion.g
        animate={isActive ? {
          y: [0, -2, 0],
          rotate: [0, -2, 2, 0]
        } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Head */}
        <circle
          cx="24"
          cy="12"
          r="4"
          className="fill-current text-pink-600"
        />
        {/* Body */}
        <path
          d="M24 16 L24 28"
          className="stroke-current text-pink-600"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Arms */}
        <motion.path
          d="M24 20 L30 24"
          className="stroke-current text-pink-600"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M24 20 L30 24",
              "M24 20 L28 26",
              "M24 20 L30 24"
            ]
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.path
          d="M24 20 L18 24"
          className="stroke-current text-pink-600"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M24 20 L18 24",
              "M24 20 L20 26",
              "M24 20 L18 24"
            ]
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
        {/* Legs */}
        <motion.path
          d="M24 28 L20 38"
          className="stroke-current text-pink-600"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M24 28 L20 38",
              "M24 28 L28 38",
              "M24 28 L20 38"
            ]
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.path
          d="M24 28 L28 38"
          className="stroke-current text-pink-600"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={isActive ? {
            d: [
              "M24 28 L28 38",
              "M24 28 L20 38",
              "M24 28 L28 38"
            ]
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
      </motion.g>
    </svg>
  );

  // Airbnb-style Trophy Icon (Sports)
  const SportsIcon = ({ isActive }) => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <motion.g
        animate={isActive ? {
          y: [0, -3, 0],
          rotate: [0, 3, -3, 0]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Trophy Cup */}
        <path
          d="M14 10 L14 14 Q14 24 24 24 Q34 24 34 14 L34 10 Z"
          className="fill-current text-blue-500"
        />
        {/* Trophy Handles */}
        <path
          d="M14 12 L10 12 Q8 12 8 14 L8 16 Q8 18 10 18 L14 18"
          className="stroke-current text-blue-500"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M34 12 L38 12 Q40 12 40 14 L40 16 Q40 18 38 18 L34 18"
          className="stroke-current text-blue-500"
          strokeWidth="2"
          fill="none"
        />
        {/* Trophy Stem */}
        <rect
          x="22"
          y="24"
          width="4"
          height="8"
          className="fill-current text-blue-500"
        />
        {/* Trophy Base */}
        <rect
          x="18"
          y="32"
          width="12"
          height="4"
          rx="1"
          className="fill-current text-blue-500"
        />
        {/* Star on trophy */}
        <motion.path
          d="M24 14 L25 17 L28 17 L26 19 L27 22 L24 20 L21 22 L22 19 L20 17 L23 17 Z"
          className="fill-current text-yellow-400"
          animate={isActive ? {
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.g>
    </svg>
  );

  // Airbnb-style Book Icon (Educational)
  const EducationalIcon = ({ isActive }) => (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <motion.g
        animate={isActive ? {
          rotateY: [0, 10, 0]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '24px 24px' }}
      >
        {/* Book cover */}
        <rect
          x="14"
          y="12"
          width="20"
          height="24"
          rx="2"
          className="fill-current text-purple-500"
        />
        {/* Book spine */}
        <rect
          x="14"
          y="12"
          width="3"
          height="24"
          className="fill-current text-purple-700"
        />
        {/* Book pages */}
        <rect
          x="18"
          y="15"
          width="13"
          height="1"
          className="fill-white opacity-50"
        />
        <rect
          x="18"
          y="19"
          width="13"
          height="1"
          className="fill-white opacity-50"
        />
        <rect
          x="18"
          y="23"
          width="13"
          height="1"
          className="fill-white opacity-50"
        />
        <rect
          x="18"
          y="27"
          width="10"
          height="1"
          className="fill-white opacity-50"
        />
        {/* Bookmark */}
        <motion.path
          d="M28 12 L28 22 L26 20 L24 22 L24 12"
          className="fill-current text-yellow-400"
          animate={isActive ? {
            y: [0, 2, 0]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.g>
    </svg>
  );

  const iconComponents = {
    activity: ActivityIcon,
    sports: SportsIcon,
    educational: EducationalIcon
  };

  return (
    <div className="flex justify-center gap-4 px-4 py-3">
      {categories.map((category, index) => {
        const IconComponent = iconComponents[category.id];
        const isActive = activeCategory === category.id;

        return (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 group"
          >
            {/* Icon Container */}
            <motion.div
              className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all"
              animate={{
                borderColor: isActive ? '#9333ea' : '#e5e7eb'
              }}
            >
              <IconComponent isActive={isActive} />
            </motion.div>

            {/* Category Label */}
            <span 
              className={`text-xs font-semibold transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              {category.name}
            </span>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="w-1 h-1 rounded-full bg-gray-900"
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

export default AirbnbStyleCategories;
