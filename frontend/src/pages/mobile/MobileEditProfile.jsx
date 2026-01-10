import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import { User, Mail, Phone, MapPin, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const MobileEditProfile = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.preferences?.city || '',
    interests: user?.preferences?.interests?.join(', ') || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(
        `${API}/auth/profile`,
        {
          name: formData.name,
          phone: formData.phone,
          preferences: {
            city: formData.city,
            interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean)
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Profile updated successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
           <GlassCard className="max-w-sm mx-4">
             <div className="text-center p-4">
               <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
               <p className="text-gray-600 font-semibold">Please log in to edit your profile</p>
               <button 
                 onClick={() => navigate('/login')}
                 className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
               >
                 Go to Login
               </button>
             </div>
           </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <MagicHeader
          title="Edit Profile"
          subtitle="Update your information"
          gradient="from-blue-500 via-cyan-500 to-teal-500"
        />

        {/* Main Container */}
        <div className="p-4 pb-24 -mt-4 max-w-5xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Name Field */}
            <div className="md:col-span-1">
              <GlassCard delay={0.1} className="h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-gray-900 shadow-sm focus:shadow-md"
                  placeholder="Enter your full name"
                  required
                />
              </GlassCard>
            </div>

            {/* Email Field (Read-only) */}
            <div className="md:col-span-1">
              <GlassCard delay={0.2} className="h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                   <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"/>
                   Email cannot be changed
                </p>
              </GlassCard>
            </div>

            {/* Phone Field */}
            <div className="md:col-span-1">
              <GlassCard delay={0.3} className="h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-gray-900 shadow-sm focus:shadow-md"
                  placeholder="Enter your phone number"
                />
              </GlassCard>
            </div>

            {/* City Field */}
            <div className="md:col-span-1">
              <GlassCard delay={0.4} className="h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-gray-900 shadow-sm focus:shadow-md"
                  placeholder="Enter your city"
                />
              </GlassCard>
            </div>

            {/* Interests Field - Full Width */}
            <div className="md:col-span-2">
              <GlassCard delay={0.5} className="h-full">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Interests
                </label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => handleChange('interests', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-gray-900 resize-none shadow-sm focus:shadow-md"
                  placeholder="Dance, Art, Music, Coding (comma-separated)"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"/>
                  Separate multiple interests with commas
                </p>
              </GlassCard>
            </div>

            {/* Save Button - Full Width */}
            <div className="md:col-span-2 mt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileEditProfile;