import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, Calendar, BarChart3, DollarSign, User } from 'lucide-react';
import { AuthContext } from '../App';

const MobilePartnerLayout = ({ children, hideNav = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/partner/dashboard' },
    { icon: Package, label: 'Listings', path: '/partner/listings' },
    { icon: Calendar, label: 'Bookings', path: '/mobile/partner/bookings' },
    { icon: BarChart3, label: 'Analytics', path: '/mobile/partner/analytics' },
    { icon: User, label: 'Profile', path: '/mobile/partner/profile' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      {!hideNav && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
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
                  <Icon 
                    className={`w-6 h-6 transition-all duration-200 ${
                      active 
                        ? 'text-purple-600' 
                        : 'text-gray-400'
                    }`}
                  />
                  <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
                    active 
                      ? 'text-purple-600' 
                      : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="partnerActiveTab"
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </div>
  );
};

export default MobilePartnerLayout;