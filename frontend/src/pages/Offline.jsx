import React from 'react';
import { WifiOff } from 'lucide-react';

const Offline = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'white'
        }}>
          <WifiOff size={40} />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '0.5rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          You're Offline
        </h1>

        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
          fontFamily: 'Outfit, sans-serif'
        }}>
          It looks like you've lost your internet connection. Some features may not be available.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          Try Again
        </button>

        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8',
          marginTop: '1.5rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          Don't worry, your data is safe. We'll sync everything once you're back online.
        </p>
      </div>
    </div>
  );
};

export default Offline;
