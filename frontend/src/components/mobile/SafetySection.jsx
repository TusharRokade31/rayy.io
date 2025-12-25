import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Heart, Users, Camera, Award } from 'lucide-react';

const SafetySection = () => {
  const safetyFeatures = [
    {
      icon: Shield,
      title: 'Verified Partners',
      description: 'All instructors undergo rigorous background checks',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'Hygiene First',
      description: 'Regular sanitization and cleanliness protocols',
      color: 'from-pink-400 to-rose-500'
    },
    {
      icon: Users,
      title: 'Safe Ratios',
      description: 'Optimal teacher-to-student ratios maintained',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Camera,
      title: 'Monitored Classes',
      description: 'Parent observation and regular updates',
      color: 'from-purple-400 to-indigo-500'
    },
    {
      icon: CheckCircle,
      title: 'Quality Assured',
      description: 'Regular audits and quality checks',
      color: 'from-orange-400 to-amber-500'
    },
    {
      icon: Award,
      title: 'Certified Staff',
      description: 'Qualified and trained professionals only',
      color: 'from-teal-400 to-cyan-500'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 mb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Child&apos;s Safety is Our Priority
        </h2>
        <p className="text-gray-600 text-sm">
          We ensure the highest standards of safety and care
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4">
        {safetyFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 leading-snug">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Badge */}
      <div className="mt-6 bg-white rounded-2xl p-4 border-2 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">100% Safety Guaranteed</p>
            <p className="text-xs text-gray-600">All activities are monitored and insured</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetySection;
