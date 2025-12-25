import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { format, parseISO } from 'date-fns';

const PartnerSessions = () => {
  const { token } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/sessions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.sessions.slice(0, 20));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div data-testid="partner-sessions" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>My Sessions</h1>

        {sessions.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '4rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ color: '#64748b' }}>No sessions scheduled</p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            {sessions.map((session) => (
              <div key={session.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1.25rem 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {format(parseISO(session.start_at), 'EEE, MMM dd, yyyy')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {format(parseISO(session.start_at), 'h:mm a')} - {format(parseISO(session.end_at), 'h:mm a')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {session.seats_reserved}/{session.seats_total} booked
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: session.status === 'scheduled' ? '#10b981' : '#64748b',
                    fontWeight: '600'
                  }}>
                    {session.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerSessions;
