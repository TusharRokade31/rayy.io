import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnimatedCategories = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'activity',
      name: 'Activity',
      icon: Activity,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      query: 'fitness'
    },
    {
      id: 'sports',
      name: 'Sports',
      icon: Trophy,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      query: 'sports'
    },
    {
      id: 'educational',
      name: 'Educational',
      icon: GraduationCap,
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      query: 'coding'
    }
  ];

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id);
    navigate(`/search?category=${category.query}`);
  };

  return (
    <div className="flex justify-center gap-4 px-4 py-3">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 relative"
          >
            {/* Animated Icon Container */}
            <motion.div
              className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${category.bgGradient} flex items-center justify-center overflow-hidden shadow-lg`}
              animate={{
                boxShadow: isActive 
                  ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Floating particles animation */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              
              {/* Icon with pulse animation */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.2
                }}
                className="relative z-10"
              >
                <Icon 
                  className={`w-10 h-10 bg-gradient-to-br ${category.gradient} bg-clip-text text-transparent`}
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </motion.div>
            </motion.div>

            {/* Category Label */}
            <motion.span 
              className="text-xs font-semibold text-gray-700"
              animate={{ opacity: isActive ? 1 : 0.7 }}
            >
              {category.name}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default AnimatedCategories;
