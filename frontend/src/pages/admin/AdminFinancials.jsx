import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import '../../styles/admin-responsive.css';
import { IndianRupee, DollarSign, TrendingUp, Clock, Check, X, Download, Filter, Search, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminFinancials = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, payouts, transactions, commission
  const [payouts, setPayouts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    pendingPayouts: 0,
    processedPayouts: 0,
    unpaidCommission: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const [bookingsRes, payoutsRes] = await Promise.all([
        axios.get(`${API}/admin/bookings?limit=10000`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/payouts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const bookings = bookingsRes.data.bookings || [];
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_inr || 0), 0);
      const platformCommission = totalRevenue * 0.1;
      
      setTransactions(bookings.slice(0, 100));
      setPayouts(payoutsRes.data.payouts || []);
      
      const pendingPayouts = payoutsRes.data.payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
      const processedPayouts = payoutsRes.data.payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0;

      setFinancialSummary({
        totalRevenue,
        platformCommission,
        pendingPayouts,
        processedPayouts,
        unpaidCommission: platformCommission * 0.3
      });

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load financial data');
      setLoading(false);
    }
  };

  const handleApprovePayout = async (payoutId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/payouts/${payoutId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payout approved successfully');
      fetchFinancialData();
    } catch (error) {
      toast.error('Failed to approve payout');
    }
  };

  const handleRejectPayout = async (payoutId) => {
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/payouts/${payoutId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payout rejected');
      fetchFinancialData();
    } catch (error) {
      toast.error('Failed to reject payout');
    }
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
        <h1 style={{
          fontSize: '36px',
          fontWeight: '900',
          color: '#1e293b',
          marginBottom: '2rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          Financial Command Center
        </h1>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '2rem',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            <IndianRupee size={32} style={{ marginBottom: '1rem', opacity: 0.9 }} />
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>Total Revenue</div>
            <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Math.round(financialSummary.totalRevenue).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <DollarSign size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>Platform Commission</div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Math.round(financialSummary.platformCommission).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Clock size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>Pending Payouts</div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Math.round(financialSummary.pendingPayouts).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Check size={32} color="#3B82F6" style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>Processed Payouts</div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Math.round(financialSummary.processedPayouts).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '1rem'
        }}>
          {['overview', 'payouts', 'transactions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.875rem 1.75rem',
                background: activeTab === tab ? 'linear-gradient(135deg, #3B82F6 0%, #06b6d4 100%)' : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: activeTab === tab ? 'white' : '#64748b',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Payouts Section */}
        {activeTab === 'payouts' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Payout Requests
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>PARTNER</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>AMOUNT</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.slice(0, 10).map((payout, index) => (
                    <tr key={index} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {payout.partner_name || 'Partner'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        ₹{payout.amount?.toFixed(0)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: payout.status === 'pending' ? '#f59e0b15' : '#10b98115',
                          color: payout.status === 'pending' ? '#f59e0b' : '#10b981'
                        }}>
                          {payout.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px', color: '#64748b' }}>
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {payout.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprovePayout(payout.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayout(payout.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {activeTab === 'transactions' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                All Transactions
              </h3>
              <button
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CUSTOMER</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CLASS</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>AMOUNT</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((txn, index) => (
                    <tr key={index} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                        {txn.id?.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {txn.customer_name || 'Customer'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px', color: '#64748b' }}>
                        {txn.listing_title || 'Class'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                        ₹{txn.total_inr?.toFixed(0)}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px', color: '#64748b' }}>
                        {new Date(txn.booked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default AdminFinancials;