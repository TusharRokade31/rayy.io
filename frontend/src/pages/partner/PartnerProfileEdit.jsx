import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Save, User, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PartnerProfileEdit = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    description: '',
    email: '',
    phone: '',
    partner_photo: ''
  });

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPartnerData(response.data);
      setFormData({
        brand_name: response.data.brand_name || '',
        description: response.data.description || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        partner_photo: response.data.partner_photo || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.put(`${API}/partners/${partnerData.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile updated successfully! ✅');
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your personal information</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Brand Name */}
            <div>
              <Label htmlFor="brand_name" className="text-base font-semibold">
                Studio/Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="e.g., ABC Dance Academy"
                className="mt-2"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-base font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="partner@example.com"
                className="mt-2"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-base font-semibold">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                About Your Studio
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your studio, teaching philosophy, and what makes you special..."
                rows={5}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Profile Photo URL */}
            <div>
              <Label htmlFor="partner_photo" className="text-base font-semibold">
                Profile Photo URL
              </Label>
              <Input
                id="partner_photo"
                type="url"
                value={formData.partner_photo}
                onChange={(e) => setFormData({ ...formData, partner_photo: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct URL to your profile photo
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfileEdit;
