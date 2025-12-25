import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Save, Building2, MapPin, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PartnerBusinessDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [formData, setFormData] = useState({
    legal_name: '',
    address: '',
    city: '',
    pan_number: '',
    gstin: ''
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
        legal_name: response.data.legal_name || '',
        address: response.data.address || '',
        city: response.data.city || '',
        pan_number: response.data.pan_number || '',
        gstin: response.data.gstin || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
      toast.error('Failed to load business details');
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
      
      toast.success('Business details updated successfully! ✅');
      navigate(-1);
    } catch (error) {
      console.error('Error updating business details:', error);
      toast.error('Failed to update business details');
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
            <h1 className="text-3xl font-bold text-gray-900">Business Details</h1>
            <p className="text-gray-600 mt-1">Manage your business information and documents</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Legal Name */}
            <div>
              <Label htmlFor="legal_name" className="text-base font-semibold">
                Legal Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="As per registration documents"
                className="mt-2"
                required
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-base font-semibold">
                Business Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full business address"
                rows={3}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city" className="text-base font-semibold">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Mumbai"
                className="mt-2"
                required
              />
            </div>

            {/* PAN Number */}
            <div>
              <Label htmlFor="pan_number" className="text-base font-semibold">
                PAN Number
              </Label>
              <Input
                id="pan_number"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                10-character alphanumeric code
              </p>
            </div>

            {/* GSTIN */}
            <div>
              <Label htmlFor="gstin" className="text-base font-semibold">
                GSTIN
              </Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="22ABCDE1234F1Z5"
                maxLength={15}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                15-character GST identification number (if registered)
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

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Why do we need this?
          </h3>
          <p className="text-sm text-blue-800">
            Your business details help us process payments correctly and ensure compliance with tax regulations. 
            All information is securely stored and used only for platform operations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerBusinessDetails;
