import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

const ConfigEditor = () => {
  const { token } = useContext(AuthContext);
  const [cancellationPolicy, setCancellationPolicy] = useState(null);
  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [policyRes, commissionRes] = await Promise.all([
        axios.get(`${API}/admin/configs/cancellation_policy`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/configs/commission`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setCancellationPolicy(policyRes.data.value);
      setCommission(commissionRes.data.value);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const savePolicy = async () => {
    try {
      await axios.post(
        `${API}/admin/configs/cancellation_policy`,
        { value: cancellationPolicy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cancellation policy updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const saveCommission = async () => {
    try {
      await axios.post(
        `${API}/admin/configs/commission`,
        { value: commission },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Commission rates updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="config-editor" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Configuration Editor</h1>

        {/* Cancellation Policy */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
            Cancellation Policy
          </h2>
          
          {cancellationPolicy && cancellationPolicy.windows && (
            <div style={{ marginBottom: '2rem' }}>
              {cancellationPolicy.windows.map((window, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Min Hours Before
                    </label>
                    <Input
                      type="number"
                      value={window.min_hours}
                      onChange={(e) => {
                        const newPolicy = { ...cancellationPolicy };
                        newPolicy.windows[idx].min_hours = parseInt(e.target.value);
                        setCancellationPolicy(newPolicy);
                      }}
                      style={{ padding: '0.5rem' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Max Hours Before
                    </label>
                    <Input
                      type="number"
                      value={window.max_hours}
                      onChange={(e) => {
                        const newPolicy = { ...cancellationPolicy };
                        newPolicy.windows[idx].max_hours = parseInt(e.target.value);
                        setCancellationPolicy(newPolicy);
                      }}
                      style={{ padding: '0.5rem' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Refund %
                    </label>
                    <Input
                      type="number"
                      value={window.refund_pct}
                      onChange={(e) => {
                        const newPolicy = { ...cancellationPolicy };
                        newPolicy.windows[idx].refund_pct = parseInt(e.target.value);
                        setCancellationPolicy(newPolicy);
                      }}
                      style={{ padding: '0.5rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            padding: '1rem',
            background: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fbbf24',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
              Preview
            </div>
            <div style={{ fontSize: '14px', color: '#78350f' }}>
              Example: ₹500 class canceled 3 hours before = ₹{500 * 0.5} refund (50%)
            </div>
          </div>
          
          <button
            onClick={savePolicy}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Save Policy
          </button>
        </div>

        {/* Commission Rates */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
            Commission Rates
          </h2>
          
          {commission && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Standard Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={commission.standard_pct}
                  onChange={(e) => setCommission({ ...commission, standard_pct: parseFloat(e.target.value) })}
                  style={{ padding: '0.75rem' }}
                />
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '0.5rem' }}>
                  Current: {commission.standard_pct}%
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Subscriber Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={commission.subscriber_pct}
                  onChange={(e) => setCommission({ ...commission, subscriber_pct: parseFloat(e.target.value) })}
                  style={{ padding: '0.75rem' }}
                />
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '0.5rem' }}>
                  Current: {commission.subscriber_pct}%
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={saveCommission}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Save Commission Rates
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigEditor;
