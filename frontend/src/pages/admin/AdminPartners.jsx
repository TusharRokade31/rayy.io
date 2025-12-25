import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import '../../styles/admin-responsive.css';
import { Building2, Search, Download, CheckCircle, X, Clock, Eye, Ban, Award, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminPartners = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycDocuments, setKycDocuments] = useState([]);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const partnersRes = await axios.get(`${API}/admin/partners?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPartners(partnersRes.data.partners || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load partners');
      setLoading(false);
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

  const handleSuspendPartner = async (partnerId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/partners/${partnerId}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Partner suspended');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to suspend partner');
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by business name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 3rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif'
              }}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.875rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              minWidth: '150px'
            }}
          >
            <option value="all">All Partners</option>
            <option value="approved">Approved</option>
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
                        {partner.email}
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
                        {partner.kyc_status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowKYCModal(true);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f59e0b',
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
                            Review KYC
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setShowPartnerModal(true);
                          }}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: '2px solid #3B82F6',
                            borderRadius: '8px',
                            color: '#3B82F6',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KYC Review Modal */}
        {showKYCModal && selectedPartner && (
          <div
            style={{
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
            }}
            onClick={() => setShowKYCModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  KYC Document Review
                </h2>
                <button
                  onClick={() => setShowKYCModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                    {selectedPartner.business_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {selectedPartner.email}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '1rem' }}>Documents</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>PAN Card</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPartner.pan_number || 'Not provided'}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>GST Number</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPartner.gst_number || 'Not provided'}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>Bank Account</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPartner.bank_account_number || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleApproveKYC(selectedPartner.id)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={18} />
                    Approve KYC
                  </button>
                  <button
                    onClick={() => handleRejectKYC(selectedPartner.id, 'Documents incomplete')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminPartners;