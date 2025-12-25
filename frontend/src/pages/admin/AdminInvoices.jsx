import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { FileText, Download, RefreshCw, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminInvoices = () => {
  const { token } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await axios.get(`${API}/admin/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const bulkGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${API}/admin/invoices/bulk-generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Generated ${response.data.count} invoices!`);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.partner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
            Invoice Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Manage all invoices across the platform
          </p>
        </div>

        {/* Filters & Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['', 'paid', 'sent', 'draft'].map(status => (
              <button
                key={status || 'all'}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: filterStatus === status ? '#06b6d4' : 'white',
                  color: filterStatus === status ? 'white' : '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {status || 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={bulkGenerateInvoices}
            disabled={generating}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontWeight: '600',
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: generating ? 0.6 : 1
            }}
          >
            {generating ? <RefreshCw size={18} className="spin" /> : <Plus size={18} />}
            Generate Missing Invoices
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'white',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            maxWidth: '500px'
          }}>
            <Search size={20} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number, customer, or partner..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#1e293b'
              }}
            />
          </div>
        </div>

        {/* Invoice Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <RefreshCw size={40} color="#06b6d4" className="spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
              No invoices found
            </h3>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Invoice #</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Partner</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Class</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#06b6d4', fontSize: '14px' }}>
                      {invoice.invoice_number}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{invoice.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{invoice.customer_email}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
                      {invoice.partner_name}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px', maxWidth: '200px' }}>
                      {invoice.listing_title}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      ₹{invoice.total_inr.toFixed(2)}
                      {invoice.credits_used > 0 && (
                        <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                          +{invoice.credits_used} credits
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: invoice.status === 'paid' ? '#d1fae5' : '#fef3c7',
                        color: invoice.status === 'paid' ? '#065f46' : '#92400e'
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                      {invoice.payment_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminInvoices;
