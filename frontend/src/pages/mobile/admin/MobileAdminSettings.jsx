import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../App';
import MobileAdminLayout from '../../../layouts/MobileAdminLayout';
import MagicHeader from '../../../components/mobile/MagicHeader';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  User, Mail, Shield, Settings, Bell, Database,
  FileText, HelpCircle, LogOut, ChevronRight, Crown
} from 'lucide-react';
import { toast } from 'sonner';

const MobileAdminSettings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/mobile');
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Settings', action: () => navigate('/admin/profile'), color: 'text-blue-600' },
        { icon: Bell, label: 'Notifications', action: () => toast.info('Coming soon'), color: 'text-purple-600' },
        { icon: Shield, label: 'Security', action: () => toast.info('Coming soon'), color: 'text-red-600' }
      ]
    },
    {
      title: 'Platform Management',
      items: [
        { icon: Settings, label: 'System Settings', action: () => navigate('/admin/config'), color: 'text-gray-600' },
        { icon: Database, label: 'Database', action: () => toast.info('Coming soon'), color: 'text-green-600' },
        { icon: FileText, label: 'Logs', action: () => toast.info('Coming soon'), color: 'text-orange-600' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', action: () => navigate('/mobile/help'), color: 'text-indigo-600' },
        { icon: FileText, label: 'Documentation', action: () => toast.info('Coming soon'), color: 'text-cyan-600' }
      ]
    }
  ];

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="Settings"
          subtitle="Manage admin account"
          gradient="from-blue-500 via-cyan-500 to-teal-500"
        />

        <div className="px-4 pb-24 mt-10">
          {/* Profile Card */}
          <GlassCard delay={0.1}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                    {user?.name || 'Admin'}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-900">System Administrator</span>
              </div>
            </div>
          </GlassCard>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="mt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-2">
                {section.title}
              </h3>
              <GlassCard delay={0.1 * (sectionIndex + 2)}>
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.label}
                        onClick={item.action}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center ${item.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-left font-medium text-gray-900">
                          {item.label}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </motion.button>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          ))}

          {/* Logout Button */}
          <div className="mt-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </motion.button>
          </div>

          {/* Version Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Version 1.0.0</p>
            <p className="text-xs mt-1">© 2025 rayy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </MobileAdminLayout>
  );
};

export default MobileAdminSettings;