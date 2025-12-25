import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Check, Award, Star, Flame, X, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

const BadgeManager = () => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'partners'
  const [listings, setListings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingBadge, setUpdatingBadge] = useState(null);

  const badgeTypes = {
    verified: {
      name: 'Verified by rayy',
      icon: Check,
      color: '#10b981',
      description: 'Verified for quality, safety, and credentials',
      assignment: 'manual'
    },
    top_rated: {
      name: 'Top Rated',
      icon: Star,
      color: '#f59e0b',
      description: '4.5+ rating with 10+ reviews',
      assignment: 'automatic'
    },
    founding_partner: {
      name: 'Founding Partner',
      icon: Award,
      color: '#8b5cf6',
      description: 'One of our founding partners',
      assignment: 'manual'
    },
    popular: {
      name: 'Popular Choice',
      icon: Flame,
      color: '#ef4444',
      description: '50+ bookings in last 90 days',
      assignment: 'automatic'
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const response = await axios.get(`${API}/search`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(response.data.listings || []);
      } else {
        const response = await axios.get(`${API}/admin/users?role=partner_owner`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPartners(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const assignBadge = async (targetType, targetId, badgeType) => {
    setUpdatingBadge(`${targetId}-${badgeType}`);
    try {
      const endpoint = targetType === 'listing' 
        ? `/admin/badges/listing/${targetId}/assign`
        : `/admin/badges/partner/${targetId}/assign`;

      await axios.post(
        `${API}${endpoint}`,
        { badge_type: badgeType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${badgeTypes[badgeType].name} badge assigned!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign badge');
    } finally {
      setUpdatingBadge(null);
    }
  };

  const removeBadge = async (targetType, targetId, badgeType) => {
    setUpdatingBadge(`${targetId}-${badgeType}`);
    try {
      const endpoint = targetType === 'listing'
        ? `/admin/badges/listing/${targetId}/remove`
        : `/admin/badges/partner/${targetId}/remove`;

      await axios.delete(
        `${API}${endpoint}?badge_type=${badgeType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${badgeTypes[badgeType].name} badge removed!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove badge');
    } finally {
      setUpdatingBadge(null);
    }
  };

  const updateAutomaticBadges = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/admin/badges/update-automatic`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Automatic badges updated based on criteria!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update automatic badges');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    const data = activeTab === 'listings' ? listings : partners;
    if (!searchQuery) return data;
    
    return data.filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const BadgeButton = ({ item, badgeKey, targetType }) => {
    const badge = badgeTypes[badgeKey];
    const hasBadge = item.badges?.includes(badgeKey);
    const isUpdating = updatingBadge === `${item.id}-${badgeKey}`;
    const IconComponent = badge.icon;

    return (
      <button
        onClick={() => hasBadge 
          ? removeBadge(targetType, item.id, badgeKey)
          : assignBadge(targetType, item.id, badgeKey)
        }
        disabled={isUpdating || badge.assignment === 'automatic'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: hasBadge ? `2px solid ${badge.color}` : '2px solid #e2e8f0',
          background: hasBadge ? `${badge.color}15` : 'white',
          color: hasBadge ? badge.color : '#64748b',
          fontSize: '13px',
          fontWeight: '600',
          cursor: badge.assignment === 'automatic' ? 'not-allowed' : 'pointer',
          opacity: badge.assignment === 'automatic' || isUpdating ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
        title={badge.assignment === 'automatic' ? 'Auto-assigned based on criteria' : badge.description}
      >
        {isUpdating ? (
          <RefreshCw size={14} className="spin" />
        ) : (
          <IconComponent size={14} strokeWidth={2.5} />
        )}
        {badge.name}
        {hasBadge && <Check size={14} />}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Badge Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Assign trust badges to listings and partners • Manual badges require admin approval
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('listings')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'listings' ? '#06b6d4' : 'white',
                color: activeTab === 'listings' ? 'white' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              📚 Listings
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'partners' ? '#06b6d4' : 'white',
                color: activeTab === 'partners' ? 'white' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              🏢 Partners
            </button>
          </div>

          <button
            onClick={updateAutomaticBadges}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Update Auto Badges
          </button>
        </div>

        {/* Search Bar */}
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
              placeholder={`Search ${activeTab}...`}
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

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <RefreshCw size={40} color="#06b6d4" className="spin" />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading...</p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            {filteredData().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                No {activeTab} found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredData().map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.5rem',
                      border: '2px solid #f1f5f9',
                      borderRadius: '12px',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {item.title || item.name}
                        </h3>
                        {item.subtitle && (
                          <p style={{ fontSize: '14px', color: '#64748b' }}>
                            {item.subtitle}
                          </p>
                        )}
                        {item.email && (
                          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                            {item.email}
                          </p>
                        )}
                      </div>
                      {item.rating_avg > 0 && (
                        <div style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          ⭐ {item.rating_avg} ({item.rating_count} reviews)
                        </div>
                      )}
                    </div>

                    {/* Badge Assignment Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      {Object.keys(badgeTypes).map(badgeKey => (
                        <BadgeButton
                          key={badgeKey}
                          item={item}
                          badgeKey={badgeKey}
                          targetType={activeTab === 'listings' ? 'listing' : 'partner'}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Badge Legend */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Badge Types & Criteria
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {Object.entries(badgeTypes).map(([key, badge]) => {
              const IconComponent = badge.icon;
              return (
                <div key={key} style={{
                  padding: '1rem',
                  border: `2px solid ${badge.color}20`,
                  borderRadius: '8px',
                  background: `${badge.color}05`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <IconComponent size={18} color={badge.color} strokeWidth={2.5} />
                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {badge.name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '6px',
                      background: badge.assignment === 'manual' ? '#dbeafe' : '#fef3c7',
                      color: badge.assignment === 'manual' ? '#1e40af' : '#92400e'
                    }}>
                      {badge.assignment}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
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

export default BadgeManager;
