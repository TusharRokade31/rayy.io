import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';

const DocumentUploadModal = ({ isOpen, onClose, onComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState({
    pan_document: null,
    aadhaar_document: null,
    gst_document: null,
    cancelled_cheque_document: null
  });
  const [documents, setDocuments] = useState({
    pan_document: null,
    pan_document_preview: null,
    aadhaar_document: null,
    aadhaar_document_preview: null,
    gst_document: null,
    gst_document_preview: null,
    cancelled_cheque_document: null,
    cancelled_cheque_document_preview: null
  });

  // Load existing documents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingDocuments();
    }
  }, [isOpen]);

  const loadExistingDocuments = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const partner = response.data;
      setExistingDocuments({
        pan_document: partner.pan_document || null,
        aadhaar_document: partner.aadhaar_document || null,
        gst_document: partner.gst_document || null,
        cancelled_cheque_document: partner.cancelled_cheque_document || null
      });
    } catch (error) {
      console.error('Error loading existing documents:', error);
    }
  };

  const handleFileChange = (field, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments({
        ...documents,
        [field]: file,
        [`${field}_preview`]: reader.result
      });
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      const token = localStorage.getItem('yuno_token');
      
      // Prepare form data
      const formData = new FormData();
      
      if (documents.pan_document) {
        formData.append('pan_document', documents.pan_document);
      }
      if (documents.aadhaar_document) {
        formData.append('aadhaar_document', documents.aadhaar_document);
      }
      if (documents.gst_document) {
        formData.append('gst_document', documents.gst_document);
      }
      if (documents.cancelled_cheque_document) {
        formData.append('cancelled_cheque_document', documents.cancelled_cheque_document);
      }

      // Upload documents
      await axios.post(`${API}/partners/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('✅ Documents uploaded successfully!');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
            📤 Upload Documents
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#F0F9FF',
          border: '2px solid #3B82F6',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#1E40AF', lineHeight: '1.5' }}>
            💡 Upload clear, legible copies of your documents. Accepted formats: JPG, PNG, PDF (max 5MB each).
            {(existingDocuments.pan_document || existingDocuments.aadhaar_document || existingDocuments.gst_document || existingDocuments.cancelled_cheque_document) && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: '600' }}>
                ✓ Some documents are already uploaded. You can replace them or upload missing ones.
              </span>
            )}
          </p>
        </div>

        {/* Document Upload Fields */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* PAN Document */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              📄 PAN Card Document
              {existingDocuments.pan_document && !documents.pan_document && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#10B981', fontWeight: '500' }}>
                  ✓ Already uploaded
                </span>
              )}
            </label>
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: documents.pan_document_preview ? '#F0FDF4' : (existingDocuments.pan_document && !documents.pan_document ? '#ECFDF5' : '#F9FAFB')
            }}>
              {documents.pan_document_preview ? (
                <div>
                  <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                    {documents.pan_document.name}
                  </p>
                  <button
                    onClick={() => handleFileChange('pan_document', null)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : existingDocuments.pan_document && !documents.pan_document ? (
                <div>
                  <Check size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Document already uploaded
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('pan_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="pan-upload"
                  />
                  <label
                    htmlFor="pan-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Replace Document
                  </label>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#9CA3AF" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    Click to upload or drag and drop
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('pan_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="pan-upload"
                  />
                  <label
                    htmlFor="pan-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Aadhaar Document */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              🆔 Aadhaar Card Document
              {existingDocuments.aadhaar_document && !documents.aadhaar_document && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#10B981', fontWeight: '500' }}>
                  ✓ Already uploaded
                </span>
              )}
            </label>
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: documents.aadhaar_document_preview ? '#F0FDF4' : (existingDocuments.aadhaar_document && !documents.aadhaar_document ? '#ECFDF5' : '#F9FAFB')
            }}>
              {documents.aadhaar_document_preview ? (
                <div>
                  <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                    {documents.aadhaar_document.name}
                  </p>
                  <button
                    onClick={() => handleFileChange('aadhaar_document', null)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : existingDocuments.aadhaar_document && !documents.aadhaar_document ? (
                <div>
                  <Check size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Document already uploaded
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('aadhaar_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="aadhaar-upload"
                  />
                  <label
                    htmlFor="aadhaar-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Replace Document
                  </label>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#9CA3AF" style={{ margin: '0 auto 0.5rem' }} />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('aadhaar_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="aadhaar-upload"
                  />
                  <label
                    htmlFor="aadhaar-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Cancelled Cheque */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              🏦 Cancelled Cheque or Bank Statement
              {existingDocuments.cancelled_cheque_document && !documents.cancelled_cheque_document && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#10B981', fontWeight: '500' }}>
                  ✓ Already uploaded
                </span>
              )}
            </label>
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: documents.cancelled_cheque_document_preview ? '#F0FDF4' : (existingDocuments.cancelled_cheque_document && !documents.cancelled_cheque_document ? '#ECFDF5' : '#F9FAFB')
            }}>
              {documents.cancelled_cheque_document_preview ? (
                <div>
                  <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                    {documents.cancelled_cheque_document.name}
                  </p>
                  <button
                    onClick={() => handleFileChange('cancelled_cheque_document', null)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : existingDocuments.cancelled_cheque_document && !documents.cancelled_cheque_document ? (
                <div>
                  <Check size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Document already uploaded
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('cancelled_cheque_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="cheque-upload"
                  />
                  <label
                    htmlFor="cheque-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Replace Document
                  </label>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#9CA3AF" style={{ margin: '0 auto 0.5rem' }} />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('cancelled_cheque_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="cheque-upload"
                  />
                  <label
                    htmlFor="cheque-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>

          {/* GST Document (Optional) */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              📑 GST Certificate (Optional)
              {existingDocuments.gst_document && !documents.gst_document && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#10B981', fontWeight: '500' }}>
                  ✓ Already uploaded
                </span>
              )}
            </label>
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: documents.gst_document_preview ? '#F0FDF4' : (existingDocuments.gst_document && !documents.gst_document ? '#ECFDF5' : '#F9FAFB')
            }}>
              {documents.gst_document_preview ? (
                <div>
                  <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                    {documents.gst_document.name}
                  </p>
                  <button
                    onClick={() => handleFileChange('gst_document', null)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : existingDocuments.gst_document && !documents.gst_document ? (
                <div>
                  <Check size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Document already uploaded
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('gst_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="gst-upload"
                  />
                  <label
                    htmlFor="gst-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Replace Document
                  </label>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#9CA3AF" style={{ margin: '0 auto 0.5rem' }} />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('gst_document', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="gst-upload"
                  />
                  <label
                    htmlFor="gst-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
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
            onClick={handleUpload}
            disabled={uploading || (!documents.pan_document && !documents.aadhaar_document && !documents.cancelled_cheque_document && !documents.gst_document)}
            style={{
              padding: '0.75rem 1.5rem',
              background: (uploading || (!documents.pan_document && !documents.aadhaar_document && !documents.cancelled_cheque_document && !documents.gst_document)) ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: (uploading || (!documents.pan_document && !documents.aadhaar_document && !documents.cancelled_cheque_document && !documents.gst_document)) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (uploading || (!documents.pan_document && !documents.aadhaar_document && !documents.cancelled_cheque_document && !documents.gst_document)) ? 0.5 : 1
            }}
          >
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
