import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import { 
  User, Calendar, Heart, Trophy, Wallet, Settings, Shield, 
  HelpCircle, ChevronRight, Edit2, Sparkles, Star, LogOut
} from 'lucide-react';

const MobileProfileV2 = () => {
  const { user, logout, showAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/mobile');
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
          <GlassCard>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-4">Please log in to view your profile</p>
              <button
                onClick={() => showAuthModal('customer')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg"
              >
                Login / Sign Up
              </button>
            </div>
          </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  const menuSections = [
    {
      title: 'My Activity',
      items: [
        { icon: Calendar, label: 'My Bookings', path: '/mobile/bookings', gradient: 'from-blue-400 to-cyan-500' },
        { icon: Trophy, label: 'Learning Journey', path: '/mobile/learning-journey', gradient: 'from-purple-400 to-pink-500', badge: 'New' },
        { icon: Heart, label: 'Wishlist', path: '/mobile/wishlist', gradient: 'from-red-400 to-rose-500' },
        { icon: Sparkles, label: 'Leaderboard', path: '/mobile/leaderboard', gradient: 'from-yellow-400 to-amber-500' },
        { icon: Wallet, label: 'Wallet', path: '/mobile/wallet', gradient: 'from-green-400 to-emerald-500' },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', path: '/mobile/edit-profile', gradient: 'from-blue-400 to-indigo-500' },
        { icon: Settings, label: 'Settings', path: '/mobile/settings', gradient: 'from-gray-400 to-slate-500' },
        { icon: Shield, label: 'Privacy & Security', path: '/mobile/settings', gradient: 'from-indigo-400 to-purple-500' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', path: '/help-center', gradient: 'from-cyan-400 to-blue-500' },
      ]
    }
  ];

  return (
    <MobileLayout>
      <div className="bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
        {/* Magic Header */}
        <MagicHeader
          title={user.name || 'My Profile'}
          subtitle={user.email}
          gradient="from-purple-500 via-pink-500 to-rose-500"
        >
          {/* Profile Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="flex justify-center mt-4"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-white to-purple-100 rounded-full flex items-center justify-center text-3xl font-bold text-purple-600 shadow-2xl">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={() => navigate('/mobile/edit-profile')}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Edit2 className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </motion.div>
        </MagicHeader>

        {/* Content */}
        <div className="p-4 pb-24 -mt-4">
          {/* Child Profiles */}
          {user.child_profiles && user.child_profiles.length > 0 && (
            <GlassCard className="mb-6" delay={0.1}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Child Profiles</h2>
                <button
                  onClick={() => navigate('/mobile/child-profiles')}
                  className="text-sm text-purple-600 font-semibold"
                >
                  Manage
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                {user.child_profiles.map((child, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto shadow-lg">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold text-gray-900 truncate">{child.name}</p>
                      <p className="text-xs text-gray-500">{child.age}y</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-2">
                {section.title}
              </h3>
              <GlassCard delay={0.2 + sectionIndex * 0.1}>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + itemIndex * 0.05 }}
                        onClick={() => navigate(item.path)}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-purple-50 transition-colors cursor-pointer group"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          ))}

          {/* Logout Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-6"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileProfileV2;
