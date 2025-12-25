import React from 'react';

const LoadingFallback = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)'
    }}>
      <div style={{
        textAlign: 'center',
        animation: 'fadeIn 0.3s ease-in'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{
          color: '#64748B',
          fontSize: '16px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          Loading...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingFallback;
