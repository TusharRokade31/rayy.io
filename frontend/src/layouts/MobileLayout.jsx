import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Heart, Calendar, User, Trophy } from 'lucide-react';
import { AuthContext } from '../App';

const MobileLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const navItems = [
    { icon: Home, label: 'Home', path: '/mobile' },
    // { icon: Heart, label: 'Wishlist', path: '/mobile/wishlist' },
    { icon: Calendar, label: 'Bookings', path: '/mobile/bookings' },
    // { icon: User, label: 'Profile', path: '/mobile/profile' },
    // { icon: Trophy, label: 'Leaderboard', path: '/mobile/leaderboard' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-1 relative"
                whileTap={{ scale: 0.9 }}
              >
                {/* Icon */}
                <Icon 
                  className={`w-6 h-6 transition-all duration-200 ${
                    active 
                      ? 'text-purple-600 scale-110' 
                      : 'text-gray-400'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                
                {/* Label */}
                <span 
                  className={`text-xs mt-1 font-medium transition-all duration-200 ${
                    active 
                      ? 'text-purple-600' 
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
};

export default MobileLayout;
