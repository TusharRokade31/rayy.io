import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import ModernAuthModalV2 from '../../components/mobile/ModernAuthModalV2';
import { 
  Users, TrendingUp, Calendar, Shield, Award, ArrowRight, Star, UserPlus
} from 'lucide-react';

const MobileBecomePartner = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext); // Access user from context
  const [showAuthModal, setShowAuthModal] = useState(false);

  // REDIRECT LOGIC: Check if user is already a partner
  useEffect(() => {
    if (user && user.role === 'partner_owner') {
      navigate('/mobile/partner/dashboard');
    }
  }, [user, navigate]);

  // Cleanup: Restore body scroll on component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const benefits = [
    {
      icon: Users,
      title: 'Reach Thousands',
      description: 'Connect with parents actively looking for activities',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Fill empty slots and maximize your revenue',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Calendar,
      title: 'Easy Management',
      description: 'Manage bookings, schedules, and payments in one place',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Trusted Platform',
      description: 'Join India\'s most trusted kids activity marketplace',
      color: 'from-orange-400 to-amber-500'
    }
  ];

  const steps = [
    { number: '1', title: 'Sign Up', description: 'Create your partner account' },
    { number: '2', title: 'List Activities', description: 'Add your classes and workshops' },
    { number: '3', title: 'Start Earning', description: 'Receive bookings and grow' }
  ];

  const handleGetStarted = () => {
    // If user is a customer, they might want to become a partner
    // If user is not logged in, show auth modal
    if (user && user.role === 'customer') {
        // Optional: You could logout the customer first or handle role switching
        // For now, let's just show the modal which handles partner login/signup
        setShowAuthModal(true);
    } else {
        setShowAuthModal(true);
    }
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleAuthSuccess = (token, userData, isNewUser) => {
    // For mobile partner signup, we WANT onboarding for new partners.
    // So do NOT skip onboarding here.
    login(token, userData, isNewUser, false);
    setShowAuthModal(false);
    
    // Restore body scroll
    document.body.style.overflow = 'unset';
    
    // CRITICAL: Only redirect to dashboard if onboarding is already complete
    // For new partners, let the onboarding wizard render first (triggered by App.js)
    if (userData.onboarding_complete === true) {
      navigate('/mobile/partner/dashboard');
    }
    // If onboarding is NOT complete, App.js will show the onboarding wizard
  };

  const handleModalClose = () => {
    setShowAuthModal(false);
    // Restore body scroll when modal closes
    document.body.style.overflow = 'unset';
  };

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
        <MagicHeader
          title="Become a Partner"
          subtitle="Join 500+ trusted partners"
          gradient="from-orange-500 via-red-500 to-pink-500"
        />

        {/* Content */}
        <div className="pb-24 mt-2">
          {/* CTA Button at Top - To fix scroll issue */}
          <div className="px-4 mb-8">
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </motion.button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Sign up with OTP - Quick and secure
            </p>
          </div>

          {/* Stats */}
          <div className="px-4 grid grid-cols-3 gap-3 mb-8">
            <GlassCard delay={0.1}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">500+</div>
                <div className="text-xs text-gray-600">Partners</div>
              </div>
            </GlassCard>
            <GlassCard delay={0.2}>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">50K+</div>
                <div className="text-xs text-gray-600">Bookings</div>
              </div>
            </GlassCard>
            <GlassCard delay={0.3}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">4.8</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </GlassCard>
          </div>

          {/* Benefits */}
          <div className="px-4 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Why Partner with rayy?</h2>
            <div className="space-y-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* How it Works */}
          <div className="px-4 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="px-4 mt-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    Trusted by 10,000+ Parents
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </p>
                  <p className="text-xs text-gray-600">Join India's #1 kids activity platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal for Partner Login/Signup */}
      <ModernAuthModalV2
        isOpen={showAuthModal}
        onClose={handleModalClose}
        onSuccess={handleAuthSuccess}
        mode="partner"
        // No strict allowModeToggle needed here as we force partner mode
      />

      <style>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </MobileLayout>
  );
};

export default MobileBecomePartner;