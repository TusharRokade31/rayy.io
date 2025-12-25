import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { X, UserPlus, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../../App';

const CATEGORIES = [
  'Arts & Crafts', 'Dance', 'Music', 'Sports', 'Coding', 'Robotics',
  'Language', 'Math', 'Science', 'Drama', 'Chess', 'Photography'
];

const AGE_BRACKETS = [
  '3-5 years', '6-8 years', '9-12 years', '13-15 years', '16-18 years'
];

const CreatePartnerModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // User Info
    name: '',
    email: '',
    phone: '',
    password: '',
    
    // Organization Info
    organizationName: '',
    organizationType: 'academy',
    description: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Categories & Capacity
    categories: [],
    ageBrackets: [],
    monthlyCapacity: '',
    
    // Contact
    contactNumber: '',
    alternateNumber: '',
    
    // Additional
    sendEmail: true,
    autoApprove: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const current = prev[name] || [];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [name]: [...current, value] };
      }
    });
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast.success('Password generated');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (!formData.password) {
      toast.error('Please set a password or generate one');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.organizationName) {
      toast.error('Please enter organization name');
      return false;
    }
    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('yuno_token');
      
      const payload = {
        ...formData,
        role: 'partner_owner',
        status: formData.autoApprove ? 'active' : 'pending',
        onboardingCompleted: true,
        created_by: 'admin'
      };

      const response = await axios.post(`${API}/admin/partners/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(
        formData.sendEmail 
          ? 'Partner created! Invitation email sent.' 
          : 'Partner created successfully!'
      );
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error creating partner:', error);
      toast.error(error.response?.data?.detail || 'Failed to create partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              <div className="flex items-center gap-2">
                <UserPlus size={24} className="text-cyan-600" />
                Create New Partner - Step {step} of 2
              </div>
            </DialogTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: User Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Mail size={18} />
                  User Account Details
                </h3>
                <p className="text-sm text-blue-700">
                  This information will be used to create the partner's login account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person Name *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <div className="flex gap-2">
                    <Input
                      name="password"
                      type="text"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      required
                    />
                    <button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Partner will use this password to login. They can change it later.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Send invitation email to partner
                    </p>
                    <p className="text-xs text-yellow-700">
                      Partner will receive login credentials and welcome instructions via email
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Organization Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <Building2 size={18} />
                  Organization Information
                </h3>
                <p className="text-sm text-cyan-700">
                  Business details that will appear on the platform.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name *</label>
                  <Input
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="Academy/Institute name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="individual">Individual Instructor</option>
                    <option value="academy">Academy/Institute</option>
                    <option value="school">School</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description about the organization"
                  rows={3}
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">Categories * (Select all that apply)</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {CATEGORIES.map(category => (
                    <label key={category} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleMultiSelect('categories', category)}
                        className="rounded"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Brackets */}
              <div>
                <label className="block text-sm font-medium mb-2">Age Brackets Supported</label>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_BRACKETS.map(bracket => (
                    <label key={bracket} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer border">
                      <input
                        type="checkbox"
                        checked={formData.ageBrackets.includes(bracket)}
                        onChange={() => handleMultiSelect('ageBrackets', bracket)}
                        className="rounded"
                      />
                      <span className="text-sm">{bracket}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="block text-sm font-medium flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </label>
                <div>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                  <Input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                  />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Additional Settings</h4>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="autoApprove"
                    checked={formData.autoApprove}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Auto-approve partner</p>
                    <p className="text-xs text-gray-600">
                      Partner account will be immediately active. Uncheck to require manual approval.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Capacity (students)</label>
                  <Input
                    name="monthlyCapacity"
                    type="number"
                    value={formData.monthlyCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Partner'}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePartnerModal;
