import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { FileText, Download, Eye, Calendar, DollarSign, CreditCard, Filter } from 'lucide-react';
import { toast } from 'sonner';

const MyInvoices = () => {
  const { token } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/invoices/my`, {
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

  const downloadInvoicePDF = async (invoice) => {
    try {
      // Generate PDF content
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(generateInvoiceHTML(invoice));
      pdfWindow.document.close();
      pdfWindow.print();
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #06b6d4; padding-bottom: 20px; }
          .company-name { font-size: 32px; font-weight: bold; color: #06b6d4; }
          .invoice-title { font-size: 24px; color: #1e293b; }
          .invoice-number { font-size: 16px; color: #64748b; margin-top: 5px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .section { background: #f8fafc; padding: 20px; border-radius: 8px; }
          .section-title { font-weight: bold; color: #1e293b; margin-bottom: 10px; font-size: 14px; }
          .section-content { color: #64748b; font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #06b6d4; color: white; padding: 12px; text-align: left; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: flex-end; gap: 100px; margin: 8px 0; font-size: 14px; }
          .total-row.grand { font-size: 18px; font-weight: bold; color: #06b6d4; border-top: 2px solid #06b6d4; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
          .status.paid { background: #d1fae5; color: #065f46; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">rayy</div>
            <div style="color: #64748b; font-size: 14px; margin-top: 5px;">Cool Classes. Happy Kids. ✨</div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="status ${invoice.status}">${invoice.status.toUpperCase()}</div>
          </div>
        </div>

        <div class="details">
          <div class="section">
            <div class="section-title">BILLED TO</div>
            <div class="section-content">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">${invoice.customer_name}</div>
              <div>${invoice.customer_email}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">INVOICE DETAILS</div>
            <div class="section-content">
              <div><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</div>
              ${invoice.paid_date ? `<div><strong>Paid Date:</strong> ${new Date(invoice.paid_date).toLocaleDateString()}</div>` : ''}
              <div><strong>Payment Method:</strong> ${invoice.payment_method === 'credit_wallet' ? 'Credits' : invoice.payment_method === 'razorpay_card' ? 'Card' : invoice.payment_method}</div>
              ${invoice.session_date ? `<div><strong>Session Date:</strong> ${new Date(invoice.session_date).toLocaleDateString()}</div>` : ''}
              ${invoice.session_duration ? `<div><strong>Duration:</strong> ${invoice.session_duration} minutes</div>` : ''}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>
                  <div style="font-weight: 600; color: #1e293b;">${item.description}</div>
                  <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">By ${invoice.partner_name}</div>
                </td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          ${invoice.gst_amount > 0 ? `
            <div class="total-row">
              <span>GST (18%):</span>
              <span>₹${invoice.gst_amount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${invoice.discount > 0 ? `
            <div class="total-row" style="color: #10b981;">
              <span>Discount:</span>
              <span>- ₹${invoice.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${invoice.credits_used > 0 ? `
            <div class="total-row" style="color: #f59e0b;">
              <span>Credits Used:</span>
              <span>- ${invoice.credits_used} credits (₹${invoice.credits_value.toFixed(2)})</span>
            </div>
          ` : ''}
          <div class="total-row grand">
            <span>Amount Paid:</span>
            <span>₹${invoice.total_inr.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing rayy!</p>
          <p>For any queries, please contact us at support@rrray.com</p>
        </div>
      </body>
      </html>
    `;
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            My Invoices
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            View and download your booking invoices
          </p>
        </div>

        {/* Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {['all', 'paid', 'sent', 'draft'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: filterStatus === status ? '#06b6d4' : 'white',
                color: filterStatus === status ? 'white' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                textTransform: 'capitalize',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {status === 'all' ? 'All Invoices' : status}
            </button>
          ))}
        </div>

        {/* Invoice List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#06b6d4',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b' }}>Loading invoices...</p>
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
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              No invoices found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Your invoices will appear here after you make bookings
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredInvoices.map(invoice => (
              <div
                key={invoice.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.75rem'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {invoice.invoice_number}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: invoice.status === 'paid' ? '#d1fae5' : '#fef3c7',
                        color: invoice.status === 'paid' ? '#065f46' : '#92400e'
                      }}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: '0.5rem'
                    }}>
                      {invoice.listing_title}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      By {invoice.partner_name}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      marginTop: '1rem',
                      fontSize: '13px',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={14} />
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <CreditCard size={14} />
                        {invoice.payment_method === 'credit_wallet' ? 'Credits' : 
                         invoice.payment_method === 'razorpay_card' ? 'Card' : 
                         invoice.payment_method}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#06b6d4',
                      marginBottom: '0.25rem'
                    }}>
                      ₹{invoice.total_inr.toFixed(2)}
                    </div>
                    {invoice.gst_amount > 0 && (
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>
                        (inc. GST ₹{invoice.gst_amount.toFixed(2)})
                      </div>
                    )}
                    {invoice.credits_used > 0 && (
                      <div style={{
                        fontSize: '12px',
                        color: '#f59e0b',
                        fontWeight: '600',
                        marginBottom: '1rem'
                      }}>
                        {invoice.credits_used} credits used
                      </div>
                    )}
                    
                    <button
                      onClick={() => downloadInvoicePDF(invoice)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#06b6d4',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

export default MyInvoices;
