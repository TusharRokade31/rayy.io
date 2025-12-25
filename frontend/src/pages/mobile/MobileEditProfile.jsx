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
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Please log in to edit your profile</p>
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

        {/* Form */}
        <div className="p-4 pb-24 -mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <GlassCard delay={0.1}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                placeholder="Enter your full name"
                required
              />
            </GlassCard>

            {/* Email Field (Read-only) */}
            <GlassCard delay={0.2}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
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
              <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
            </GlassCard>

            {/* Phone Field */}
            <GlassCard delay={0.3}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                placeholder="Enter your phone number"
              />
            </GlassCard>

            {/* City Field */}
            <GlassCard delay={0.4}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                placeholder="Enter your city"
              />
            </GlassCard>

            {/* Interests Field */}
            <GlassCard delay={0.5}>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                Interests
              </label>
              <textarea
                value={formData.interests}
                onChange={(e) => handleChange('interests', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 resize-none"
                placeholder="Dance, Art, Music, Coding (comma-separated)"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">Separate multiple interests with commas</p>
            </GlassCard>

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileEditProfile;
