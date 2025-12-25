import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import toast from 'react-hot-toast';
import { ExternalLink, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Arts & Crafts', 'Dance', 'Music', 'Sports', 'Coding', 'Robotics',
  'Language', 'Math', 'Science', 'Drama', 'Chess', 'Photography'
];

const AGE_BRACKETS = [
  '3-5 years', '6-8 years', '9-12 years', '13-15 years', '16-18 years'
];

const PartnerOnboardingEnhanced = ({ user, onComplete }) => {
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
    categories: [],
    ageBrackets: [],
    monthlyCapacity: '',
    specializations: [],
    certifications: '',
    experience: '',
    profileImage: '',
    organizationLogo: '',
    tncAccepted: false,
    tncVersion: '1.0'
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
        categories: user.categories || [],
        ageBrackets: user.ageBrackets || [],
        monthlyCapacity: user.monthlyCapacity || '',
        specializations: user.specializations || [],
        certifications: user.certifications || '',
        experience: user.experience || '',
        profileImage: user.profileImage || '',
        organizationLogo: user.organizationLogo || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const handleNext = () => {
    if (step === 1) {
      if (!formData.organizationName || !formData.organizationType) {
        toast.error('Please fill in required fields');
        return;
      }
      if (formData.categories.length === 0) {
        toast.error('Please select at least one category');
        return;
      }
      if (formData.ageBrackets.length === 0) {
        toast.error('Please select at least one age bracket');
        return;
      }
    }
    if (step === 5) {
      if (!formData.tncAccepted) {
        toast.error('Please accept Terms & Conditions to continue');
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tncAccepted) {
      toast.error('Please accept Terms & Conditions');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('yuno_token');
      
      // Get client IP (approximation)
      const tncAcceptanceData = {
        timestamp: new Date().toISOString(),
        version: formData.tncVersion,
        userAgent: navigator.userAgent
      };

      const response = await fetch(`${API}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tncAcceptance: tncAcceptanceData,
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
        onboardingCompleted: true,
        tncAcceptance: tncAcceptanceData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile completed successfully! Your account is pending admin approval.');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Partner Profile - Step {step} of 5</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information + Categories */}
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
              
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">Categories * (Select all that apply)</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(category => (
                    <label key={category} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
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
                <label className="block text-sm font-medium mb-2">Age Brackets Supported * (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_BRACKETS.map(bracket => (
                    <label key={bracket} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
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

              {/* Monthly Capacity */}
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Capacity (approx. students/month)</label>
                <Input
                  name="monthlyCapacity"
                  value={formData.monthlyCapacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Approximate number of students you can handle per month</p>
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
              <h4 className="font-medium mt-4">Bank Details (for payouts)</h4>
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

          {/* Step 5: Terms & Conditions */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Terms & Conditions</h3>
              
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-blue-600 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Please Review Our Partner Agreement</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Before joining rayy as a partner, please carefully review our Vendor Terms & Conditions.
                      This includes important information about:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Commission structure (0% for first 30 days, then 10%)</li>
                      <li>Payout cycles and processes</li>
                      <li>Cancellation and refund policies</li>
                      <li>Quality standards and expectations</li>
                      <li>Liability and legal terms</li>
                    </ul>
                  </div>
                </div>
              </div>

              <a 
                href="/vendor-terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border-2 border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors"
              >
                <ExternalLink size={20} className="text-cyan-600" />
                <span className="font-medium text-cyan-700">Read Full Vendor Terms & Conditions</span>
              </a>

              <div className="border-t border-b py-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tncAccepted"
                    checked={formData.tncAccepted}
                    onChange={handleInputChange}
                    className="mt-1 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the <a href="/vendor-terms" target="_blank" className="text-cyan-600 underline">Vendor Terms & Conditions</a>. 
                    I understand the commission structure, payout terms, quality standards, and all other policies outlined in the agreement.
                  </span>
                </label>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
                <p className="font-medium mb-1">Legal Notice:</p>
                <p>
                  By checking the box above and submitting this form, you are providing your digital signature and consent to be bound by these terms. 
                  Your acceptance will be recorded with a timestamp for legal compliance (Version {formData.tncVersion}).
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
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
              {step < 5 ? (
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
                  disabled={loading || !formData.tncAccepted}
                >
                  {loading ? 'Submitting...' : 'Complete Onboarding'}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerOnboardingEnhanced;