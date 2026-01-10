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
  const { login, user } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user && user.role === 'partner_owner') {
      navigate('/mobile/partner/dashboard');
    }
  }, [user, navigate]);

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
    if (user && user.role === 'customer') {
        setShowAuthModal(true);
    } else {
        setShowAuthModal(true);
    }
    document.body.style.overflow = 'hidden';
  };

  const handleAuthSuccess = (token, userData, isNewUser) => {
    login(token, userData, isNewUser, false);
    setShowAuthModal(false);
    document.body.style.overflow = 'unset';
    
    if (userData.onboarding_complete === true) {
      navigate('/mobile/partner/dashboard');
    }
  };

  const handleModalClose = () => {
    setShowAuthModal(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
        
        {/* Mobile Header */}
        <div className="lg:hidden">
            <MagicHeader
            title="Become a Partner"
            subtitle="Join 500+ trusted partners"
            gradient="from-orange-500 via-red-500 to-pink-500"
            />
        </div>

        {/* Desktop Hero Section */}
        <div className="hidden lg:block bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-16">
           <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
              <div>
                 <h1 className="text-4xl font-bold mb-4">Become a Partner</h1>
                 <p className="text-xl opacity-90">Join 500+ trusted partners and grow your business today.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="px-8 py-3 bg-white text-pink-600 font-bold rounded-full shadow-lg flex items-center gap-2"
              >
                 <UserPlus className="w-5 h-5" />
                 Get Started
              </motion.button>
           </div>
        </div>

        {/* Content Container */}
        <div className="pb-24 mt-2 lg:mt-12 max-w-7xl mx-auto lg:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column */}
            <div>
                 {/* Mobile CTA (Hidden on Desktop) */}
                 <div className="px-4 mb-8 lg:hidden">
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
                    <p className="text-xs text-gray-500 text-center mt-4">Sign up with OTP - Quick and secure</p>
                </div>

                {/* Stats */}
                <div className="px-4 lg:px-0 grid grid-cols-3 gap-3 mb-8">
                    <GlassCard delay={0.1} className="h-full flex flex-col justify-center">
                    <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">500+</div>
                        <div className="text-xs lg:text-sm text-gray-600">Partners</div>
                    </div>
                    </GlassCard>
                    <GlassCard delay={0.2} className="h-full flex flex-col justify-center">
                    <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-600 mb-1">50K+</div>
                        <div className="text-xs lg:text-sm text-gray-600">Bookings</div>
                    </div>
                    </GlassCard>
                    <GlassCard delay={0.3} className="h-full flex flex-col justify-center">
                    <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-1">4.8</div>
                        <div className="text-xs lg:text-sm text-gray-600">Rating</div>
                    </div>
                    </GlassCard>
                </div>

                {/* Benefits */}
                <div className="px-4 lg:px-0 mb-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Why Partner with rayy?</h2>
                    <div className="space-y-3 lg:space-y-4">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="bg-white lg:bg-gray-50 rounded-2xl p-4 lg:p-6 flex items-start gap-4 shadow-sm lg:shadow-none lg:border border-gray-100"
                        >
                            <div className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 lg:text-lg">{benefit.title}</h3>
                            <p className="text-sm lg:text-base text-gray-600">{benefit.description}</p>
                            </div>
                        </motion.div>
                        );
                    })}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div>
                 {/* How it Works */}
                 <div className="px-4 lg:px-0 mb-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">How It Works</h2>
                    <div className="space-y-4 lg:space-y-8 bg-white lg:p-8 lg:rounded-3xl lg:shadow-xl">
                    {steps.map((step, index) => (
                        <motion.div
                        key={step.number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-4 relative"
                        >
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg lg:text-xl flex-shrink-0 z-10 shadow-lg">
                            {step.number}
                        </div>
                        {index < steps.length - 1 && (
                             <div className="absolute left-6 top-12 bottom-[-32px] w-0.5 bg-gray-200 lg:hidden" />
                        )}
                         {index < steps.length - 1 && (
                             <div className="absolute left-8 top-16 bottom-[-32px] w-0.5 bg-gray-200 hidden lg:block" />
                        )}
                        
                        <div className="flex-1 py-2">
                            <h3 className="font-bold text-gray-900 lg:text-lg">{step.title}</h3>
                            <p className="text-sm lg:text-base text-gray-600">{step.description}</p>
                        </div>
                        <div className="hidden lg:block">
                           <ArrowRight className="w-6 h-6 text-gray-300" />
                        </div>
                        </motion.div>
                    ))}
                    </div>
                </div>

                {/* Trust Badge */}
                <div className="px-4 lg:px-0 mt-8">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 lg:p-6 border-2 border-green-200">
                    <div className="flex items-center gap-3 lg:gap-5">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <Award className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                        </div>
                        <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm lg:text-lg flex items-center gap-2">
                            Trusted by 10,000+ Parents
                            <Star className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500 fill-yellow-500" />
                        </p>
                        <p className="text-xs lg:text-base text-gray-600">Join India's #1 kids activity platform</p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <ModernAuthModalV2
        isOpen={showAuthModal}
        onClose={handleModalClose}
        onSuccess={handleAuthSuccess}
        mode="partner"
      />

      <style jsx>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </MobileLayout>
  );
};

export default MobileBecomePartner;