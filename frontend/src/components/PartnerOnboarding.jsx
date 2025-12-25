import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import toast from 'react-hot-toast';

const PartnerOnboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactNumber: '',
    alternateNumber: '',
    establishedYear: '',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    specializations: [],
    certifications: '',
    experience: '',
    profileImage: '',
    organizationLogo: ''
  });
  const [loading, setLoading] = useState(false);

  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        organizationName: user.organizationName || '',
        organizationType: user.organizationType || '',
        description: user.description || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        contactNumber: user.contactNumber || user.phone || '',
        alternateNumber: user.alternateNumber || '',
        establishedYear: user.establishedYear || '',
        registrationNumber: user.registrationNumber || '',
        gstNumber: user.gstNumber || '',
        panNumber: user.panNumber || '',
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        ifscCode: user.ifscCode || '',
        accountHolderName: user.accountHolderName || '',
        specializations: user.specializations || [],
        certifications: user.certifications || '',
        experience: user.experience || '',
        profileImage: user.profileImage || '',
        organizationLogo: user.organizationLogo || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.organizationName || !formData.organizationType) {
        toast.error('Please fill in required fields');
        return;
      }
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API}/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          onboardingCompleted: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update user in localStorage
      const updatedUser = {
        ...user,
        ...formData,
        onboardingCompleted: true
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile completed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast('You can complete your profile from partner dashboard');
    onComplete();
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Partner Profile - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name *</label>
                <Input
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organization Type *</label>
                <select
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select type</option>
                  <option value="individual">Individual Instructor</option>
                  <option value="academy">Academy/Institute</option>
                  <option value="school">School</option>
                  <option value="organization">Organization</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description about your organization"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <Input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Primary contact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alternate Number</label>
                  <Input
                    name="alternateNumber"
                    value={formData.alternateNumber}
                    onChange={handleInputChange}
                    placeholder="Secondary contact"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <Input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Legal & Financial */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Legal & Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Established Year</label>
                  <Input
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    placeholder="Year"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Registration Number</label>
                  <Input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="Reg. number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <Input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="GST number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PAN Number</label>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="PAN number"
                  />
                </div>
              </div>
              <h4 className="font-medium mt-4">Bank Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <Input
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Account number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <Input
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="IFSC code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                  <Input
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Account holder"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Professional Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Professional Details</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Certifications</label>
                <Textarea
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="List your certifications"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience (years)</label>
                <Input
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Years of experience"
                  type="number"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              variant="outline"
              onClick={handleSkip}
            >
              Skip for now
            </button>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerOnboarding;