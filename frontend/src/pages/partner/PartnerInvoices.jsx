import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { FileText, Download, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const PartnerInvoices = () => {
  const { token } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    totalInvoices: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/partner/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoiceList = response.data.invoices || [];
      setInvoices(invoiceList);
      
      // Calculate stats
      const totalEarnings = invoiceList
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total_inr, 0);
      
      const thisMonth = invoiceList
        .filter(inv => {
          const invDate = new Date(inv.invoice_date);
          const now = new Date();
          return inv.status === 'paid' && 
                 invDate.getMonth() === now.getMonth() && 
                 invDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.total_inr, 0);
      
      setStats({
        totalEarnings,
        thisMonth,
        totalInvoices: invoiceList.length,
        pendingPayouts: invoiceList.filter(inv => inv.status !== 'paid').length
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoicePDF = (invoice) => {
    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write(generatePartnerInvoiceHTML(invoice));
    pdfWindow.document.close();
    pdfWindow.print();
  };

  const generatePartnerInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #06b6d4; padding-bottom: 20px; }
          .company-name { font-size: 32px; font-weight: bold; color: #06b6d4; }
          h2 { color: #1e293b; margin: 0 0 10px 0; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #06b6d4; color: white; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .total { text-align: right; font-size: 24px; font-weight: bold; color: #06b6d4; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">rayy</div>
            <div style="color: #64748b; margin-top: 5px;">Partner Invoice</div>
          </div>
          <div style="text-align: right;">
            <h2>INVOICE</h2>
            <div>${invoice.invoice_number}</div>
          </div>
        </div>

        <div class="details">
          <div>
            <strong>From:</strong><br/>
            ${invoice.partner_name}<br/>
            Partner ID: ${invoice.partner_id}
          </div>
          <div>
            <strong>Customer:</strong><br/>
            ${invoice.customer_name}<br/>
            ${invoice.customer_email}
          </div>
        </div>

        <table>
          <tr>
            <th>Class/Service</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
          <tr>
            <td>${invoice.listing_title}</td>
            <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
            <td>₹${invoice.total_inr.toFixed(2)}</td>
          </tr>
        </table>

        <div class="total">
          Total Earnings: ₹${invoice.total_inr.toFixed(2)}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>Thank you for partnering with rayy!</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Invoice Number', 'Date', 'Customer', 'Class', 'Amount', 'Status'],
      ...invoices.map(inv => [
        inv.invoice_number,
        new Date(inv.invoice_date).toLocaleDateString(),
        inv.customer_name,
        inv.listing_title,
        inv.total_inr.toFixed(2),
        inv.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
            Invoices & Earnings
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Track your earnings and download invoices
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                  ₹{stats.totalEarnings.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Total Earnings</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={24} color="#06b6d4" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                  ₹{stats.thisMonth.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>This Month</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                  {stats.totalInvoices}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Total Invoices</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={exportToCSV}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={18} />
            Export to CSV
          </button>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ color: '#64748b' }}>Loading...</div>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
              No invoices yet
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Invoices will appear here when customers book your classes
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Invoice</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Class</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {invoice.invoice_number}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
                      {invoice.customer_name}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
                      {invoice.listing_title}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                      ₹{invoice.total_inr.toFixed(2)}
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
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => downloadInvoicePDF(invoice)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#f1f5f9',
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerInvoices;
