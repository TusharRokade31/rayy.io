import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import '../../styles/admin-responsive.css';
import { Building2, Search, Download, CheckCircle, X, Clock, Eye, Ban, Award, TrendingUp, FileText, AlertCircle, User, MapPin, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

const AdminPartners = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal States
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const partnersRes = await axios.get(`${API}/admin/partners?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Partners response:', partnersRes.data);  

      setPartners(partnersRes.data.partners || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load partners');
      setLoading(false);
    }
  };

  // Initialize edit form when entering edit mode
  const handleStartEdit = () => {
    setEditFormData({
      brand_name: selectedPartner.brand_name || selectedPartner.business_name,
      legal_name: selectedPartner.legal_name,
      description: selectedPartner.description,
      address: selectedPartner.address,
      city: selectedPartner.city,
      pan_number: selectedPartner.pan_number || selectedPartner.pan,
      aadhaar_number: selectedPartner.aadhaar_number,
      gst_number: selectedPartner.gst_number || selectedPartner.gstin,
      bank_name: selectedPartner.bank_name,
      bank_account_holder_name: selectedPartner.bank_account_holder_name,
      bank_account_number: selectedPartner.bank_account_number,
      bank_ifsc: selectedPartner.bank_ifsc,
      bank_account_type: selectedPartner.bank_account_type
    });
    setIsEditing(true);
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePartner = async () => {
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('yuno_token');
      // Assuming endpoint PUT /admin/partners/:id exists for updating details
      await axios.put(`${API}/admin/partners/${selectedPartner.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Partner details updated successfully');
      
      // Update local state to reflect changes immediately
      const updatedPartner = { ...selectedPartner, ...editFormData };
      setSelectedPartner(updatedPartner);
      
      // Update the main list
      setPartners(prev => prev.map(p => p.id === updatedPartner.id ? updatedPartner : p));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update partner details');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApproveKYC = async (partnerId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/partners/${partnerId}/approve-kyc`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('KYC approved successfully');
      fetchPartners();
      setShowKYCModal(false);
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleRejectKYC = async (partnerId, reason) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/partners/${partnerId}/reject-kyc`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('KYC rejected');
      fetchPartners();
      setShowKYCModal(false);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'approved') matchesFilter = partner.kyc_status === 'approved';
    else if (filterStatus === 'pending') matchesFilter = partner.kyc_status === 'pending';
    else if (filterStatus === 'rejected') matchesFilter = partner.kyc_status === 'rejected';
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: partners.length,
    approved: partners.filter(p => p.kyc_status === 'approved').length,
    pending: partners.filter(p => p.kyc_status === 'pending').length,
    rejected: partners.filter(p => p.kyc_status === 'rejected').length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#1e293b',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Partner Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>
              {filteredPartners.length} partners
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* ... existing stats cards code ... */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Building2 size={28} color="#3B82F6" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Total Partners</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              {stats.total}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <CheckCircle size={28} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Approved</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
              {stats.approved}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Clock size={28} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Pending KYC</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
              {stats.pending}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <AlertCircle size={28} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>Rejected</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444', fontFamily: 'Outfit, sans-serif' }}>
              {stats.rejected}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
{/* Search and Filters Section */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap' // Ensures it wraps nicely on mobile
        }}>
          
          {/* Search Input Container - Now using Flexbox for perfect alignment */}
          <div style={{ 
            flex: 1, // Takes up remaining space
            minWidth: '300px', // Prevents it from getting too small
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc', // Light grey background
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0 1rem', // Padding for the container, not the input
            transition: 'border-color 0.2s',
          }}
          // Add simple hover effect via onFocus/onBlur if needed, or leave as is
          >
            <Search size={20} color="#64748b" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by business name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 0 0.875rem 0.75rem', // Padding only on left to separate from icon
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                color: '#1e293b',
                outline: 'none' // Removes the default blue browser border
              }}
            />
          </div>
          
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.875rem 2rem 0.875rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              minWidth: '180px',
              background: '#f8fafc', // Matches search bar
              color: '#1e293b',
              outline: 'none',
              appearance: 'none', // Removes default browser arrow
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3e%3c/path%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '16px'
            }}
          >
            <option value="all">All Partners</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending KYC</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Partners Table */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>PARTNER</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CONTACT</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>KYC STATUS</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>JOINED</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '700'
                        }}>
                          {partner.business_name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                            {partner.business_name || 'Partner'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            ID: {partner.id?.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '14px', color: '#1e293b' }}>
                        {partner?.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {partner.phone || 'No phone'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.375rem 0.875rem',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: partner.kyc_status === 'approved' ? '#10b98115' : 
                                   partner.kyc_status === 'pending' ? '#f59e0b15' : '#ef444415',
                        color: partner.kyc_status === 'approved' ? '#10b981' : 
                               partner.kyc_status === 'pending' ? '#f59e0b' : '#ef4444'
                      }}>
                        {partner.kyc_status || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                      {new Date(partner.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setIsEditing(false); // Reset edit mode
                              setShowKYCModal(true);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: partner.kyc_status === 'pending' ? '#f59e0b' : '#3B82F6',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                          >
                            <FileText size={14} />
                            {partner.kyc_status === 'pending' ? 'Review KYC' : 'View Details'}
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* KYC Review / Edit Modal */}
      {showKYCModal && selectedPartner && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            width: '100%',
            padding: '1rem'
          }}
          onClick={() => {
            if (!isEditing) setShowKYCModal(false);
          }}
        >
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '1.5rem 2rem', 
              background: 'white',
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  {isEditing ? 'Edit Partner Details' : 'KYC Verification'}
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  {isEditing ? 'Update information for ' : 'Review submitted details for '}
                  <span style={{fontWeight: '600', color: '#3B82F6'}}>
                    {selectedPartner.brand_name || selectedPartner.business_name}
                  </span>
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    style={{
                      background: '#eff6ff', 
                      border: '1px solid #bfdbfe', 
                      borderRadius: '8px',
                      padding: '0.5rem 1rem', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer', 
                      color: '#2563eb',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                )}
                
                <button
                  onClick={() => setShowKYCModal(false)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#64748b'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div style={{ padding: '2rem', overflowY: 'auto' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* Section 1: Business & Contact */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} /> Business Details
                  </h3>
                  
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <EditInput label="Brand Name" value={editFormData.brand_name} onChange={(v) => handleEditChange('brand_name', v)} />
                      <EditInput label="Legal Name" value={editFormData.legal_name} onChange={(v) => handleEditChange('legal_name', v)} />
                      <EditTextArea label="Description" value={editFormData.description} onChange={(v) => handleEditChange('description', v)} />
                      <EditInput label="Address" value={editFormData.address} onChange={(v) => handleEditChange('address', v)} />
                      <EditInput label="City" value={editFormData.city} onChange={(v) => handleEditChange('city', v)} />
                    </div>
                  ) : (
                    <>
                      <DetailRow icon={Building2} label="Brand Name" value={selectedPartner.brand_name || selectedPartner.business_name} />
                      <DetailRow icon={User} label="Legal Name" value={selectedPartner.legal_name} />
                      <DetailRow icon={FileText} label="Description" value={selectedPartner.description} />
                      <DetailRow icon={MapPin} label="Address" value={selectedPartner.address} />
                      <DetailRow icon={MapPin} label="City" value={selectedPartner.city} />
                    </>
                  )}
                </div>

                {/* Section 2: Identity & Tax */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} /> Identity Proofs
                  </h3>
                  
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <EditInput label="PAN Number" value={editFormData.pan_number} onChange={(v) => handleEditChange('pan_number', v)} />
                      <EditInput label="Aadhaar Number" value={editFormData.aadhaar_number} onChange={(v) => handleEditChange('aadhaar_number', v)} />
                      <EditInput label="GST Number" value={editFormData.gst_number} onChange={(v) => handleEditChange('gst_number', v)} />
                    </div>
                  ) : (
                    <>
                      <DetailRow icon={FileText} label="PAN Number" value={selectedPartner.pan_number || selectedPartner.pan} />
                      <DetailRow icon={FileText} label="Aadhaar Number" value={selectedPartner.aadhaar_number} />
                      <DetailRow icon={FileText} label="GST Number" value={selectedPartner.gst_number || selectedPartner.gstin} />
                      
                      {/* Document Links - Always View Only */}
                      <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <DocumentCard title="PAN Card" url={selectedPartner.pan_document} />
                        <DocumentCard title="Aadhaar" url={selectedPartner.aadhaar_document} />
                        <DocumentCard title="GST Cert" url={selectedPartner.gst_document} />
                      </div>
                    </>
                  )}
                </div>

                {/* Section 3: Banking Details */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} /> Bank Account Details
                  </h3>
                  
                  {isEditing ? (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <EditInput label="Bank Name" value={editFormData.bank_name} onChange={(v) => handleEditChange('bank_name', v)} />
                      <EditInput label="Account Holder" value={editFormData.bank_account_holder_name} onChange={(v) => handleEditChange('bank_account_holder_name', v)} />
                      <EditInput label="Account Number" value={editFormData.bank_account_number} onChange={(v) => handleEditChange('bank_account_number', v)} />
                      <EditInput label="IFSC Code" value={editFormData.bank_ifsc} onChange={(v) => handleEditChange('bank_ifsc', v)} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Account Type</label>
                        <select 
                          value={editFormData.bank_account_type}
                          onChange={(e) => handleEditChange('bank_account_type', e.target.value)}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#1e293b',
                            outline: 'none'
                          }}
                        >
                           <option value="savings">Savings</option>
                           <option value="current">Current</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <DetailRow icon={Building2} label="Bank Name" value={selectedPartner.bank_name} />
                        <DetailRow icon={User} label="Account Holder" value={selectedPartner.bank_account_holder_name} />
                        <DetailRow icon={FileText} label="Account Number" value={selectedPartner.bank_account_number} />
                        <DetailRow icon={FileText} label="IFSC Code" value={selectedPartner.bank_ifsc} />
                        <DetailRow icon={FileText} label="Account Type" value={selectedPartner.bank_account_type} />
                      </div>

                      <div style={{ marginTop: '1.5rem' }}>
                         <DocumentCard title="Cancelled Cheque" url={selectedPartner.cancelled_cheque_document} />
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div style={{ 
              padding: '1.5rem 2rem', 
              background: 'white', 
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '1rem'
            }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#64748b',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePartner}
                    disabled={saveLoading}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#3B82F6',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: saveLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    {saveLoading ? 'Saving...' : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleApproveKYC(selectedPartner.id)}
                    disabled={selectedPartner.kyc_status === 'approved'}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif',
                      cursor: selectedPartner.kyc_status === 'approved' ? 'not-allowed' : 'pointer',
                      opacity: selectedPartner.kyc_status === 'approved' ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={18} />
                    {selectedPartner.kyc_status === 'approved' ? 'KYC Approved' : 'Approve Application'}
                  </button>

                  <button
                    onClick={() => {
                       const reason = prompt("Enter rejection reason:");
                       if(reason) handleRejectKYC(selectedPartner.id, reason);
                    }}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    <X size={18} />
                    Reject Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for inputs in edit mode
const EditInput = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>{label}</label>
    <input 
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '0.5rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        transition: 'border-color 0.2s',
        width: '100%',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
    />
  </div>
);

const EditTextArea = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>{label}</label>
    <textarea 
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      style={{
        padding: '0.5rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        fontFamily: 'inherit'
      }}
      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
    />
  </div>
);

// Helper to render a data row nicely
const DetailRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ 
      background: '#f1f5f9', 
      padding: '0.5rem', 
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={16} color="#64748b" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '0.1rem' }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '14px', 
        color: value ? '#1e293b' : '#94a3b8', 
        fontWeight: '600',
        fontFamily: 'Outfit, sans-serif',
        wordBreak: 'break-word'
      }}>
        {value || 'Not provided'}
      </div>
    </div>
  </div>
);

// Helper to render a document preview button
const DocumentCard = ({ title, url }) => {
  if (!url) return null;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
    >
      <FileText size={20} color="#3B82F6" />
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>Click to view</div>
      </div>
    </a>
  );
};

export default AdminPartners;