import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import PartnerOnboardingWizard from '../../components/PartnerOnboardingWizard';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import ProfileCompletionIndicator from '../../components/ProfileCompletionIndicator';
import { Building2, FileText, CreditCard, Camera, Edit2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { getErrorMessage } from '../../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PartnerProfile = () => {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartner(response.data);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
      if (error.response?.status === 404) {
        // Partner profile doesn't exist, show option to create
        setPartner(null);
      } else {
        toast.error(getErrorMessage(error, 'Failed to load profile'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Reload profile data
    fetchPartnerProfile();
  };

  const handleEditMode = () => {
    setEditData({
      description: partner.description || '',
      partner_photo: partner.partner_photo || '',
      pan_number: partner.pan_number || '',
      aadhaar_number: partner.aadhaar_number || '',
      bank_account_number: partner.bank_account_number || '',
      bank_ifsc: partner.bank_ifsc || '',
      bank_account_holder_name: partner.bank_account_holder_name || '',
      bank_name: partner.bank_name || '',
      bank_account_type: partner.bank_account_type || 'savings',
      gst_number: partner.gst_number || ''
    });
    setEditMode(true);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.put(`${API}/partners/profile`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Profile updated successfully!');
      setEditMode(false);
      fetchPartnerProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({});
  };

  // Show wizard if requested
  if (showWizard) {
    return <PartnerOnboardingWizard onComplete={handleWizardComplete} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ fontSize: '1.2rem', color: '#64748B' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!partner || !partner.kyc_documents_submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '96px',
            height: '96px',
            background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3)'
          }}>
            <AlertCircle size={48} color="white" />
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
            Complete Your Partner Profile
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748B', marginBottom: '3rem', lineHeight: '1.6' }}>
            To start creating listings and accepting bookings, please complete your KYC documents and bank details.
          </p>

          <button
            onClick={handleCompleteProfile}
            style={{
              padding: '1rem 3rem',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer'
            }}
          >
            Complete Profile Now
          </button>

          {partner && (
            <div style={{
              marginTop: '3rem',
              padding: '2rem',
              background: 'white',
              borderRadius: '16px',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                Current Information
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Brand Name:</span>
                  <span style={{ fontWeight: '600' }}>{partner.brand_name || 'Not set'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Legal Name:</span>
                  <span style={{ fontWeight: '600' }}>{partner.legal_name || 'Not set'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>City:</span>
                  <span style={{ fontWeight: '600' }}>{partner.city || 'Not set'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>KYC Status:</span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Incomplete
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Profile complete - show details
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
            {editMode ? '✏️ Edit Profile' : 'Partner Profile'}
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {editMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={18} />
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditMode}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/partner/dashboard')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back to Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Completion Indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <ProfileCompletionIndicator variant="card" />
        </div>

        {/* Status Banner */}
        <div style={{
          background: partner.kyc_status === 'approved' 
            ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
            : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: `2px solid ${partner.kyc_status === 'approved' ? '#86EFAC' : '#FCD34D'}`,
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {partner.kyc_status === 'approved' ? (
            <CheckCircle size={24} color="#059669" />
          ) : (
            <AlertCircle size={24} color="#D97706" />
          )}
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: partner.kyc_status === 'approved' ? '#065F46' : '#92400E' }}>
              {partner.kyc_status === 'approved' ? 'Profile Verified' : 'Profile Under Review'}
            </div>
            <div style={{ fontSize: '0.875rem', color: partner.kyc_status === 'approved' ? '#047857' : '#78350F' }}>
              {partner.kyc_status === 'approved' 
                ? 'Your partner account is verified and active'
                : 'Our team is reviewing your documents. This usually takes 24-48 hours.'
              }
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Information */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Building2 size={24} color="#06B6D4" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Basic Information</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', fontSize: '0.9375rem', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Brand Name:</span>
              <span style={{ fontWeight: '600' }}>{partner.brand_name}</span>
              <span style={{ color: '#64748B' }}>Legal Name:</span>
              <span style={{ fontWeight: '600' }}>{partner.legal_name}</span>
              
              <span style={{ color: '#64748B' }}>Description:</span>
              {editMode ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Describe your organization..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB',
                    fontSize: '0.9375rem',
                    fontFamily: 'Outfit, sans-serif',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <span>{partner.description || <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>}</span>
              )}
              
              <span style={{ color: '#64748B' }}>Address:</span>
              <span>{partner.address}</span>
              <span style={{ color: '#64748B' }}>City:</span>
              <span>{partner.city}</span>
            </div>
          </div>

          {/* KYC Documents */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <FileText size={24} color="#FBBF24" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>KYC Documents</h2>
            </div>
            {editMode ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                    PAN Number {!partner.pan_number && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={editData.pan_number}
                    onChange={(e) => setEditData({ ...editData, pan_number: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '0.9375rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                    Aadhaar Number {!partner.aadhaar_number && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={editData.aadhaar_number}
                    onChange={(e) => setEditData({ ...editData, aadhaar_number: e.target.value.replace(/\D/g, '') })}
                    placeholder="123456789012"
                    maxLength={12}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '0.9375rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={editData.gst_number}
                    onChange={(e) => setEditData({ ...editData, gst_number: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '0.9375rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                </div>
                
                {/* Document Upload Note */}
                <div style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  border: '2px solid #3B82F6',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <FileText size={20} color="#3B82F6" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: '600', color: '#1E40AF', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
                        📤 Document Upload Required
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#1E40AF', lineHeight: '1.5' }}>
                        To complete KYC verification, please upload your documents through the onboarding wizard:
                      </p>
                      <button
                        onClick={() => {
                          setShowDocumentModal(true);
                        }}
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem 1rem',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Upload size={16} />
                        Upload Documents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {partner.pan_number ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', color: '#334155' }}>PAN: {partner.pan_number}</span>
                    <CheckCircle size={18} color="#10B981" />
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: '#FEF3C7', borderRadius: '8px', color: '#92400E', fontSize: '0.875rem' }}>
                    ⚠️ PAN Number not provided - Click Edit to add
                  </div>
                )}
                {partner.aadhaar_number ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', color: '#334155' }}>Aadhaar: ****-****-{partner.aadhaar_number.slice(-4)}</span>
                    <CheckCircle size={18} color="#10B981" />
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: '#FEF3C7', borderRadius: '8px', color: '#92400E', fontSize: '0.875rem' }}>
                    ⚠️ Aadhaar Number not provided - Click Edit to add
                  </div>
                )}
                {partner.gst_number && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', color: '#334155' }}>GST: {partner.gst_number}</span>
                    <CheckCircle size={18} color="#10B981" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Details */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <CreditCard size={24} color="#8B5CF6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Bank Details</h2>
            </div>
            {editMode ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                    Account Holder Name {!partner.bank_account_holder_name && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    value={editData.bank_account_holder_name}
                    onChange={(e) => setEditData({ ...editData, bank_account_holder_name: e.target.value })}
                    placeholder="As per bank account"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '0.9375rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                      Bank Name {!partner.bank_name && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      value={editData.bank_name}
                      onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })}
                      placeholder="HDFC Bank, ICICI Bank, etc."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.9375rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                      Account Type {!partner.bank_account_type && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <select
                      value={editData.bank_account_type}
                      onChange={(e) => setEditData({ ...editData, bank_account_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.9375rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                      IFSC Code {!partner.bank_ifsc && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      value={editData.bank_ifsc}
                      onChange={(e) => setEditData({ ...editData, bank_ifsc: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234"
                      maxLength={11}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.9375rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748B', fontSize: '0.875rem', fontWeight: '600' }}>
                      Account Number {!partner.bank_account_number && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      value={editData.bank_account_number}
                      onChange={(e) => setEditData({ ...editData, bank_account_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="Account number"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.9375rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', fontSize: '0.9375rem', alignItems: 'center' }}>
                <span style={{ color: '#64748B' }}>Account Holder:</span>
                {partner.bank_account_holder_name ? (
                  <span style={{ fontWeight: '600' }}>{partner.bank_account_holder_name}</span>
                ) : (
                  <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>
                )}
                <span style={{ color: '#64748B' }}>Bank Name:</span>
                {partner.bank_name ? (
                  <span>{partner.bank_name}</span>
                ) : (
                  <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>
                )}
                <span style={{ color: '#64748B' }}>Account Type:</span>
                {partner.bank_account_type ? (
                  <span style={{ textTransform: 'capitalize' }}>{partner.bank_account_type}</span>
                ) : (
                  <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>
                )}
                <span style={{ color: '#64748B' }}>IFSC Code:</span>
                {partner.bank_ifsc ? (
                  <span>{partner.bank_ifsc}</span>
                ) : (
                  <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>
                )}
                <span style={{ color: '#64748B' }}>Account Number:</span>
                {partner.bank_account_number ? (
                  <span>****{partner.bank_account_number?.slice(-4)}</span>
                ) : (
                  <em style={{ color: '#94A3B8' }}>Not provided - Click Edit to add</em>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onComplete={() => {
          toast.success('✅ Documents uploaded successfully!');
          fetchPartnerProfile();
          setShowDocumentModal(false);
        }}
      />
    </div>
  );
};

export default PartnerProfile;
