import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, API } from '../App';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import {
  Building2, MapPin, FileText, CreditCard, Camera, CheckCircle2, 
  ArrowRight, ArrowLeft, Upload, AlertCircle, X, Eye
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

const PartnerOnboardingWizard = ({ onComplete, onClose }) => {
  const { user, token, setUser } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const totalSteps = 6; // Added Terms & Conditions step
  
  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    brand_name: '',
    legal_name: '',
    description: '',
    address: '',
    city: '',
    // KYC Documents
    pan_number: '',
    pan_document: null,
    pan_document_preview: null,
    aadhaar_number: '',
    aadhaar_document: null,
    aadhaar_document_preview: null,
    gst_number: '',
    gst_document: null,
    gst_document_preview: null,
    // Bank Details
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_holder_name: '',
    bank_name: '',
    bank_account_type: 'savings',
    cancelled_cheque_document: null,
    cancelled_cheque_preview: null,
    // Partner Photo
    partner_photo: null,
    partner_photo_preview: null,
    // Terms & Conditions
    tncAccepted: false,
    tncVersion: '1.0'
  });

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, or PDF files are allowed');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({
        ...prev,
        [fieldName]: base64String,
        [`${fieldName}_preview`]: file.type.startsWith('image/') ? base64String : null
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.brand_name || !formData.legal_name || !formData.address || !formData.city) {
          toast.error('Please fill all required fields');
          return false;
        }
        return true;
      
      case 2:
        // PAN validation
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!formData.pan_number || !panPattern.test(formData.pan_number)) {
          toast.error('Invalid PAN format. Format: ABCDE1234F');
          return false;
        }
        // PAN document is now optional
        
        // Aadhaar validation
        if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12 || !/^\d+$/.test(formData.aadhaar_number)) {
          toast.error('Invalid Aadhaar number. Must be 12 digits');
          return false;
        }
        // Aadhaar document is now optional
        
        // GST validation (optional)
        if (formData.gst_number) {
          const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
          if (!gstPattern.test(formData.gst_number)) {
            toast.error('Invalid GST format');
            return false;
          }
        }
        
        return true;
      
      case 3:
        // Bank details validation
        if (!formData.bank_account_number || !formData.bank_ifsc || !formData.bank_account_holder_name || !formData.bank_name) {
          toast.error('Please fill all required bank details');
          return false;
        }
        
        // IFSC validation
        const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscPattern.test(formData.bank_ifsc)) {
          toast.error('Invalid IFSC code format');
          return false;
        }
        
        return true;
      
      case 4:
        // Partner photo is now optional
        return true;
      
      case 5:
        // Terms & Conditions validation
        if (!formData.tncAccepted) {
          toast.error('Please accept the Terms & Conditions to continue');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      const payload = {
        brand_name: formData.brand_name,
        legal_name: formData.legal_name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        pan_number: formData.pan_number,
        pan_document: formData.pan_document,
        aadhaar_number: formData.aadhaar_number,
        aadhaar_document: formData.aadhaar_document,
        gst_number: formData.gst_number || null,
        gst_document: formData.gst_document || null,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
        bank_account_holder_name: formData.bank_account_holder_name,
        bank_name: formData.bank_name,
        bank_account_type: formData.bank_account_type,
        cancelled_cheque_document: formData.cancelled_cheque_document || null,
        partner_photo: formData.partner_photo,
        tnc_acceptance: {
          accepted: formData.tncAccepted,
          version: formData.tncVersion,
          timestamp: new Date().toISOString()
        }
      };

      const response = await axios.post(`${API}/partners`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If new token is provided, update it
      if (response.data.new_token) {
        localStorage.setItem('yuno_token', response.data.new_token);
        // Update user context with new role
        const updatedUser = { ...user, role: 'partner_owner' };
        setUser(updatedUser);
      }

      toast.success('Partner profile created successfully! Redirecting to dashboard...');
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onComplete) onComplete();
      
      // Force navigation to partner dashboard
      // window.location.href = '/partner/dashboard';
    } catch (error) {
      console.error('Partner creation error:', error);
      toast.error(getErrorMessage(error, 'Failed to create partner profile'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderKYCDocuments();
      case 3:
        return renderBankDetails();
      case 4:
        return renderPartnerPhoto();
      case 5:
        return renderTermsAndConditions();
      case 6:
        return renderReview();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <div className='bg-white' style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <Building2 size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Basic Information
        </h2>
        <p style={{ color: '#64748B' }}>Tell us about your studio or academy</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Brand Name *
          </label>
          <input
            type="text"
            required
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            placeholder="e.g., Little Stars Dance Academy"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              background: 'white',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Legal Name *
          </label>
          <input
            type="text"
            required
            value={formData.legal_name}
            onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
            placeholder="As per registration documents"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of your studio..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Address *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Complete address"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            City *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g., Bangalore"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>
    </div>
  );

  const FileUploadField = ({ label, fieldName, accept, required, hint, currentFile }) => (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
        {label} {required && '*'}
      </label>
      {hint && (
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem' }}>{hint}</p>
      )}
      <div style={{
        border: '2px dashed #CBD5E1',
        borderRadius: '8px',
        padding: '1.5rem',
        textAlign: 'center',
        background: currentFile ? '#F0FDF4' : '#F8FAFC',
        borderColor: currentFile ? '#86EFAC' : '#CBD5E1',
        position: 'relative'
      }}>
        {formData[`${fieldName}_preview`] ? (
          <div>
            <img
              src={formData[`${fieldName}_preview`]}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '150px',
                margin: '0 auto 0.75rem',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={() => setPreviewImage(formData[`${fieldName}_preview`])}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#06B6D4',
                  border: '1px solid #06B6D4',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <Eye size={16} style={{ marginRight: '0.375rem' }} />
                Preview
              </button>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  [fieldName]: null,
                  [`${fieldName}_preview`]: null
                }))}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#EF4444',
                  border: '1px solid #EF4444',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : currentFile ? (
          <div>
            <CheckCircle2 size={32} color="#22C55E" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: '#059669', fontWeight: '600', fontSize: '0.875rem' }}>Document uploaded</p>
          </div>
        ) : (
          <div>
            <Upload size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Click to upload or drag and drop
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              JPG, PNG, WEBP or PDF (max 5MB)
            </p>
          </div>
        )}
        <input
          type="file"
          accept={accept || "image/*,.pdf"}
          onChange={(e) => handleFileChange(e, fieldName)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  );

  const renderKYCDocuments = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <FileText size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          KYC Documents
        </h2>
        <p style={{ color: '#64748B' }}>Upload your identity and business documents</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* PAN */}
        <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
              PAN Number *
            </label>
            <input
              type="text"
              required
              value={formData.pan_number}
              onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Format: 5 letters + 4 digits + 1 letter
            </p>
          </div>
          <FileUploadField
            label="PAN Card (Optional)"
            fieldName="pan_document"
            currentFile={formData.pan_document}
            hint="You can upload this later if needed"
          />
        </div>

        {/* Aadhaar */}
        <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
              Aadhaar Number *
            </label>
            <input
              type="text"
              required
              value={formData.aadhaar_number}
              onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '') })}
              placeholder="123456789012"
              maxLength={12}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              12 digit number
            </p>
          </div>
          <FileUploadField
            label="Aadhaar Card (Optional)"
            fieldName="aadhaar_document"
            currentFile={formData.aadhaar_document}
            hint="You can upload this later if needed"
          />
        </div>

        {/* GST (Optional) */}
        <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
              GST Number (Optional)
            </label>
            <input
              type="text"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              15 characters - only if you have GST registration
            </p>
          </div>
          {formData.gst_number && (
            <FileUploadField
              label="GST Certificate"
              fieldName="gst_document"
              currentFile={formData.gst_document}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <CreditCard size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Bank Details
        </h2>
        <p style={{ color: '#64748B' }}>For receiving payouts</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Account Holder Name *
          </label>
          <input
            type="text"
            required
            value={formData.bank_account_holder_name}
            onChange={(e) => setFormData({ ...formData, bank_account_holder_name: e.target.value })}
            placeholder="As per bank records"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Account Number *
          </label>
          <input
            type="text"
            required
            value={formData.bank_account_number}
            onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
            placeholder="Enter account number"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            IFSC Code *
          </label>
          <input
            type="text"
            required
            value={formData.bank_ifsc}
            onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
            placeholder="SBIN0001234"
            maxLength={11}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem',
              textTransform: 'uppercase'
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
            11 characters (4 letters + 0 + 6 alphanumeric)
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Bank Name *
          </label>
          <input
            type="text"
            required
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            placeholder="e.g., State Bank of India"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
            Account Type *
          </label>
          <select
            value={formData.bank_account_type}
            onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </select>
        </div>

        <FileUploadField
          label="Cancelled Cheque (Optional)"
          fieldName="cancelled_cheque_document"
          hint="Helps in faster verification"
          currentFile={formData.cancelled_cheque_document}
        />
      </div>
    </div>
  );

  const renderPartnerPhoto = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <Camera size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Partner Photo (Optional)
        </h2>
        <p style={{ color: '#64748B' }}>Upload a professional photo (you can do this later)</p>
      </div>

      <FileUploadField
        label="Your Photo (Optional)"
        fieldName="partner_photo"
        accept="image/*"
        hint="You can upload this later. This helps customers recognize you during classes"
        currentFile={formData.partner_photo}
      />
    </div>
  );

  const renderTermsAndConditions = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <FileText size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Terms & Conditions
        </h2>
        <p style={{ color: '#64748B' }}>Please review and accept our partner agreement</p>
      </div>

      <div style={{ 
        background: '#EFF6FF', 
        border: '2px solid #3B82F6', 
        borderRadius: '12px', 
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
          <CheckCircle2 size={24} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: '600', color: '#1E40AF', marginBottom: '0.75rem' }}>
              Please Review Our Partner Agreement
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#1E40AF', marginBottom: '0.75rem' }}>
              Before joining rayy as a partner, please carefully review our Vendor Terms & Conditions.
              This includes important information about:
            </p>
            <ul style={{ 
              fontSize: '0.9rem', 
              color: '#1E40AF', 
              marginLeft: '1.25rem',
              listStyle: 'disc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          border: '2px solid #06B6D4',
          borderRadius: '12px',
          textDecoration: 'none',
          transition: 'all 0.3s',
          marginBottom: '1.5rem',
          background: 'white'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#F0F9FF'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      >
        <Eye size={20} style={{ color: '#06B6D4' }} />
        <span style={{ fontWeight: '600', color: '#0891B2' }}>
          Read Full Vendor Terms & Conditions
        </span>
      </a>

      <div style={{
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        padding: '1.5rem 0',
        marginBottom: '1.5rem'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'start',
          gap: '0.75rem',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={formData.tncAccepted}
            onChange={(e) => setFormData({ ...formData, tncAccepted: e.target.checked })}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
            I have read and agree to the{' '}
            <a 
              href="/vendor-terms" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#06B6D4', textDecoration: 'underline' }}
            >
              Vendor Terms & Conditions
            </a>
            . I understand the commission structure, payout terms, quality standards, and all other policies outlined in the agreement.
          </span>
        </label>
      </div>

      <div style={{
        background: '#F8FAFC',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#64748B'
      }}>
        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Legal Notice:</p>
        <p>
          By checking the box above and proceeding, you are providing your digital signature and consent to be bound by these terms. 
          Your acceptance will be recorded with a timestamp for legal compliance (Version {formData.tncVersion}).
        </p>
      </div>
    </div>
  );

  const renderReview = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div 
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <CheckCircle2 size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Review & Submit
        </h2>
        <p style={{ color: '#64748B' }}>Please review your information before submitting</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Basic Info */}
        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748B', marginBottom: '0.75rem' }}>
            BASIC INFORMATION
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748B' }}>Brand Name:</span>
            <span style={{ fontWeight: '600' }}>{formData.brand_name}</span>
            <span style={{ color: '#64748B' }}>Legal Name:</span>
            <span style={{ fontWeight: '600' }}>{formData.legal_name}</span>
            <span style={{ color: '#64748B' }}>City:</span>
            <span style={{ fontWeight: '600' }}>{formData.city}</span>
          </div>
        </div>

        {/* KYC Documents */}
        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748B', marginBottom: '0.75rem' }}>
            KYC DOCUMENTS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>PAN: {formData.pan_number}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Aadhaar: {formData.aadhaar_number.replace(/(\d{4})(\d{4})(\d{4})/, '****-****-$3')}</span>
            </div>
            {formData.gst_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#10B981" />
                <span>GST: {formData.gst_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748B', marginBottom: '0.75rem' }}>
            BANK DETAILS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748B' }}>Bank Name:</span>
            <span style={{ fontWeight: '600' }}>{formData.bank_name}</span>
            <span style={{ color: '#64748B' }}>Account Type:</span>
            <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{formData.bank_account_type}</span>
            <span style={{ color: '#64748B' }}>IFSC Code:</span>
            <span style={{ fontWeight: '600' }}>{formData.bank_ifsc}</span>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#92400E', lineHeight: '1.5' }}>
            Please ensure all information is correct. Your application will be reviewed by our team within 24-48 hours.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent style={{
          maxWidth: '600px',
          background: 'white',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: '16px',
          padding: 0
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '1rem',
              zIndex: 50,
              background: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
          >
            <X size={20} color="#64748B" />
          </button>
          {/* Progress Bar */}
          <div style={{
            position: 'sticky',
            top: 0,
            background: 'white',
            borderBottom: '1px solid #E2E8F0',
            padding: '1rem',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748B' }}>
                Step {step} of {totalSteps}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#06B6D4' }}>
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#E2E8F0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <motion.div
                className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  borderRadius: '999px'
                }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              className='bg-white'
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            background: 'white',
            borderTop: '1px solid #E2E8F0',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'space-between'
          }}>
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'white',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : <div style={{ flex: 1 }} />}

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={!loading ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" : ""}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: loading ? '#94A3B8' : undefined,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent style={{
            maxWidth: '800px',
            padding: '1rem'
          }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px'
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default PartnerOnboardingWizard;