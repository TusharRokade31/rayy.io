import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import { 
  Bell, Shield, Globe, Moon, Smartphone, HelpCircle, 
  ChevronRight, MessageSquare, Star, ExternalLink, LogOut
} from 'lucide-react';
import { toast } from 'sonner';

const MobileSettingsV2 = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/mobile');
  };

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage push notifications',
          type: 'toggle',
          value: notifications,
          onChange: () => {
            setNotifications(!notifications);
            toast.success(`Notifications ${!notifications ? 'enabled' : 'disabled'}`);
          },
          gradient: 'from-blue-400 to-cyan-500'
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          type: 'toggle',
          value: darkMode,
          onChange: () => {
            setDarkMode(!darkMode);
            toast.info('Dark mode coming soon!');
          },
          gradient: 'from-purple-400 to-indigo-500'
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'English',
          type: 'navigate',
          onClick: () => toast.info('Language settings coming soon!'),
          gradient: 'from-green-400 to-emerald-500'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          icon: Shield,
          label: 'Privacy & Security',
          description: 'Manage your data and privacy',
          type: 'navigate',
          onClick: () => toast.info('Privacy settings coming soon!'),
          gradient: 'from-indigo-400 to-purple-500'
        },
        {
          icon: Smartphone,
          label: 'App Version',
          description: 'v1.0.0',
          type: 'info',
          gradient: 'from-gray-400 to-slate-500'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          description: 'Get help and FAQs',
          type: 'navigate',
          onClick: () => navigate('/help-center'),
          gradient: 'from-cyan-400 to-blue-500'
        },
        {
          icon: MessageSquare,
          label: 'Contact Support',
          description: 'Chat with our team',
          type: 'navigate',
          onClick: () => toast.info('Support chat coming soon!'),
          gradient: 'from-pink-400 to-rose-500'
        },
        {
          icon: Star,
          label: 'Rate Us',
          description: 'Share your feedback',
          type: 'navigate',
          onClick: () => toast.success('Thank you for your support!'),
          gradient: 'from-yellow-400 to-amber-500'
        }
      ]
    },
    {
      title: 'Legal',
      items: [
        {
          icon: ExternalLink,
          label: 'Terms of Service',
          type: 'navigate',
          onClick: () => navigate('/terms'),
          gradient: 'from-gray-400 to-slate-500'
        },
        {
          icon: ExternalLink,
          label: 'Privacy Policy',
          type: 'navigate',
          onClick: () => navigate('/privacy'),
          gradient: 'from-gray-400 to-slate-500'
        }
      ]
    }
  ];

  if (!user) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-500 via-slate-500 to-zinc-500 flex items-center justify-center p-4">
          <GlassCard>
            <p className="text-gray-600 text-center mb-4">Please log in to access settings</p>
            <button
              onClick={() => navigate('/mobile')}
              className="w-full py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white font-bold rounded-xl"
            >
              Go to Home
            </button>
          </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        <MagicHeader
          title="Settings"
          subtitle="Manage your preferences"
          gradient="from-gray-700 via-slate-600 to-zinc-600"
        />

        <div className="p-4 pb-24 -mt-4">
          {settingsSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                {section.title}
              </h2>
              <GlassCard delay={sectionIndex * 0.1}>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={item.type === 'navigate' ? item.onClick : undefined}
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.label}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>
                        {item.type === 'toggle' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item.onChange();
                            }}
                            className={`relative w-12 h-7 rounded-full transition-colors ${
                              item.value ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                item.value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        ) : item.type === 'navigate' ? (
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        ) : null}
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          ))}

          {/* Logout Button */}
          <GlassCard delay={0.5} onClick={handleLogout}>
            <div className="flex items-center justify-center gap-3 p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-red-600">Logout</span>
            </div>
          </GlassCard>

          {/* App Info */}
          <div className="text-center text-sm text-gray-500 pt-6">
            <p>Made with ❤️</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileSettingsV2;
