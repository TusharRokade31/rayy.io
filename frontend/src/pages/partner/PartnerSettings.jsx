import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Bell, Lock, CreditCard, Globe, HelpCircle } from 'lucide-react';

const PartnerSettings = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email Notifications', description: 'Receive booking and payment alerts', toggle: true },
        { label: 'SMS Notifications', description: 'Get instant updates via SMS', toggle: true },
        { label: 'Push Notifications', description: 'Mobile app notifications', toggle: true }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Lock,
      items: [
        { label: 'Change Password', description: 'Update your account password', action: () => {} },
        { label: 'Two-Factor Authentication', description: 'Add extra security', toggle: false },
        { label: 'Privacy Settings', description: 'Control your data visibility', action: () => {} }
      ]
    },
    {
      title: 'Payment & Billing',
      icon: CreditCard,
      items: [
        { label: 'Bank Details', description: 'Manage payout accounts', action: () => {} },
        { label: 'Commission Rate', description: 'View your current rate', info: '15%' },
        { label: 'Payment History', description: 'View past transactions', action: () => {} }
      ]
    },
    {
      title: 'Preferences',
      icon: Globe,
      items: [
        { label: 'Language', description: 'Choose your preferred language', info: 'English' },
        { label: 'Time Zone', description: 'Set your local time zone', info: 'Asia/Kolkata' },
        { label: 'Currency', description: 'Display currency preference', info: 'INR (₹)' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      
                      <div className="ml-4">
                        {item.toggle !== undefined && (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={item.toggle} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        )}
                        
                        {item.info && (
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                            {item.info}
                          </span>
                        )}
                        
                        {item.action && (
                          <button
                            onClick={item.action}
                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                          >
                            Configure →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Our support team is here to help you with any questions about your account settings.
              </p>
              <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSettings;
