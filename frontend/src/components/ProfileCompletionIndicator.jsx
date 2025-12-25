import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfileCompletionIndicator = ({ variant = 'card', onNavigateToProfile }) => {
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchCompletion();
  }, []);

  const fetchCompletion = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/partners/my/completion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if response is valid data and not an error object
      if (response.data && typeof response.data === 'object' && !response.data.detail) {
        setCompletion(response.data);
      } else {
        console.error('Invalid completion data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching profile completion:', error);
      // Don't show component if there's an error
      setCompletion(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completion) {
    return null;
  }

  const { total_percentage, sections, missing_fields, meets_minimum, minimum_required } = completion;
  
  // Safeguards: ensure data types are correct
  const safeMissingFields = Array.isArray(missing_fields) ? missing_fields : [];
  const safeSections = sections && typeof sections === 'object' ? sections : {};
  const safePercentage = typeof total_percentage === 'number' ? total_percentage : 0;
  const safeMeetsMinimum = Boolean(meets_minimum);
  const safeMinRequired = typeof minimum_required === 'number' ? minimum_required : 70;
  
  // Circular progress indicator
  const CircularProgress = ({ percentage }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const safePerc = typeof percentage === 'number' ? percentage : 0;
    const strokeDashoffset = circumference - (safePerc / 100) * circumference;
    
    const getColor = (pct) => {
      if (pct >= 90) return '#10b981'; // Green
      if (pct >= 70) return '#3b82f6'; // Blue
      if (pct >= 50) return '#f59e0b'; // Amber
      return '#ef4444'; // Red
    };

    return (
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={getColor(safePerc)}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease'
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '800',
            color: getColor(safePerc)
          }}>
            {Math.round(safePerc)}%
          </div>
        </div>
      </div>
    );
  };

  // Section card component
  const SectionCard = ({ name, data }) => {
    const sectionNames = {
      basic_info: 'Basic Information',
      address: 'Address Details',
      kyc_documents: 'KYC Documents',
      bank_details: 'Bank Details'
    };

    const sectionIcons = {
      basic_info: '👤',
      address: '📍',
      kyc_documents: '📄',
      bank_details: '🏦'
    };

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '24px' }}>{sectionIcons[name]}</span>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
              {sectionNames[name]}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {data.completed} of {data.total} completed
            </div>
          </div>
        </div>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: data.percentage >= 70 ? '#10b981' : '#f59e0b'
        }}>
          {Math.round(data.percentage)}%
        </div>
      </div>
    );
  };

  // Card variant for dashboard
  if (variant === 'card') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: safeMeetsMinimum ? '2px solid #10b981' : '2px solid #f59e0b'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              Profile Completion
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {safeMeetsMinimum ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={16} /> Meets minimum requirement ({safeMinRequired}%)
                </span>
              ) : (
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={16} /> Minimum {safeMinRequired}% required
                </span>
              )}
            </p>
          </div>
          <CircularProgress percentage={safePercentage} />
        </div>

        {!safeMeetsMinimum && safeMissingFields.length > 0 && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#92400e'
            }}>
              <Info size={18} />
              Complete these fields to reach {safeMinRequired}%
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {safeMissingFields.slice(0, 5).map((field, idx) => {
                // Safeguard: ensure field has a label property
                const label = typeof field === 'object' && field.label ? field.label : String(field);
                return (
                  <span
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #fbbf24',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#78350f'
                    }}
                  >
                    {label}
                  </span>
                );
              })}
              {safeMissingFields.length > 5 && (
                <span style={{ fontSize: '0.875rem', color: '#78350f' }}>
                  +{safeMissingFields.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem',
            background: '#f8fafc',
            borderRadius: '8px',
            marginBottom: expanded ? '1rem' : '0'
          }}
        >
          <span style={{ fontWeight: '600', color: '#475569' }}>View Details</span>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {Object.entries(safeSections).map(([name, data]) => (
              <SectionCard key={name} name={name} data={data} />
            ))}
          </div>
        )}

        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Update Profile
          </button>
        )}
      </div>
    );
  }

  // Banner variant for profile page
  if (variant === 'banner') {
    return (
      <div style={{
        background: safeMeetsMinimum 
          ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
          : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: safeMeetsMinimum ? '2px solid #10b981' : '2px solid #f59e0b'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              {safeMeetsMinimum ? (
                <CheckCircle size={28} style={{ color: '#059669' }} />
              ) : (
                <AlertCircle size={28} style={{ color: '#d97706' }} />
              )}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: safeMeetsMinimum ? '#064e3b' : '#78350f'
              }}>
                Profile {Math.round(safePercentage)}% Complete
              </h3>
            </div>
            <p style={{
              color: safeMeetsMinimum ? '#065f46' : '#92400e',
              fontSize: '0.938rem'
            }}>
              {safeMeetsMinimum
                ? 'Great job! Your profile meets the minimum requirement.'
                : `Complete at least ${safeMinRequired}% to unlock all features.`}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <CircularProgress percentage={safePercentage} />
            
            {!safeMeetsMinimum && (
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#78350f',
                  marginBottom: '0.5rem'
                }}>
                  Missing Fields: {safeMissingFields.length}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#92400e',
                  maxWidth: '200px'
                }}>
                  Complete these sections to improve your profile
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProfileCompletionIndicator;
