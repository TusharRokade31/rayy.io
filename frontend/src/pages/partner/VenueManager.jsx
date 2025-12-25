import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { MapPin, Plus, Edit2, Trash2, Building2, Map, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

const API = process.env.REACT_APP_BACKEND_URL || '';

const VenueManager = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    google_maps_link: '',
    landmarks: ''
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please login to continue');
        navigate('/');
        return;
      }
      
      const response = await fetch(`${API}/api/venues/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data.venues || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch venues error:', response.status, errorData);
        toast.error(errorData.detail || 'Failed to fetch venues');
        
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Error loading venues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('yuno_token');
      
      if (!token) {
        toast.error('Authentication required. Please login.');
        navigate('/');
        return;
      }
      
      const url = editingVenue 
        ? `${API}/api/venues/${editingVenue.id}`
        : `${API}/api/venues`;
      
      const method = editingVenue ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingVenue ? 'Venue updated successfully' : 'Venue created successfully');
        setShowAddModal(false);
        setEditingVenue(null);
        setFormData({
          name: '',
          address: '',
          city: '',
          pincode: '',
          google_maps_link: '',
          landmarks: ''
        });
        fetchVenues();
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('Submit venue error:', response.status, error);
        toast.error(error.detail || 'Failed to save venue');
        
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error('Error saving venue');
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      pincode: venue.pincode || '',
      google_maps_link: venue.google_maps_link || '',
      landmarks: venue.landmarks || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('yuno_token');
      const response = await fetch(`${API}/api/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Venue deleted successfully');
        fetchVenues();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete venue');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Error deleting venue');
    }
  };

  const openAddModal = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      pincode: '',
      google_maps_link: '',
      landmarks: ''
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ fontSize: '1.2rem', color: '#64748B' }}>Loading venues...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Back to Listing Creation Banner */}
        {sessionStorage.getItem('return_to_listing_creation') === 'true' && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
                📝 Creating a Listing
              </p>
              <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
                Add your venue here, then click the button to return to listing creation
              </p>
            </div>
            <button
              onClick={() => navigate('/partner/listings/new')}
              style={{
                background: '#f59e0b',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ← Back to Listing
            </button>
          </div>
        )}
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Venue Management
            </h1>
            <p style={{ color: '#64748B' }}>
              Manage your studio locations and branches
            </p>
          </div>
          <button
            onClick={openAddModal}
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <Plus size={20} />
            Add Venue
          </button>
        </div>

        {/* Venues Grid */}
        {venues.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <Building2 size={64} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              No Venues Yet
            </h3>
            <p style={{ color: '#64748B', marginBottom: '2rem' }}>
              Add your first venue to start creating offline listings
            </p>
            <button
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Add Your First Venue
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {venues.map((venue) => (
              <div key={venue.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                        {venue.name}
                      </h3>
                      {venue.is_active && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: '#D1FAE5',
                          color: '#059669',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          <CheckCircle size={12} />
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MapPin size={18} color="#64748B" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ color: '#1E293B', fontWeight: '500' }}>{venue.address}</div>
                      <div style={{ color: '#64748B', fontSize: '0.875rem' }}>
                        {venue.city} {venue.pincode && `- ${venue.pincode}`}
                      </div>
                    </div>
                  </div>
                  
                  {venue.google_maps_link && (
                    <a
                      href={venue.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        color: '#3B82F6',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        marginTop: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      <Map size={14} />
                      View on Google Maps
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    onClick={() => handleEdit(venue)}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      background: '#F0F9FF',
                      color: '#0891B2',
                      border: '1px solid #BAE6FD',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '600'
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '600'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent style={{ maxWidth: '600px', borderRadius: '16px' }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>
              {editingVenue ? 'Edit Venue' : 'Add New Venue'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                Venue Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Studio, Downtown Branch"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                Street Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123, MG Road"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Bangalore"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  PIN Code
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="560001"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                Google Maps Link
              </label>
              <input
                type="url"
                value={formData.google_maps_link}
                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                placeholder="https://maps.google.com/..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>
                Optional: Makes it easier for customers to find your location
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                Landmarks / Special Instructions
              </label>
              <textarea
                value={formData.landmarks}
                onChange={(e) => setFormData({ ...formData, landmarks: e.target.value })}
                placeholder="e.g., Near XYZ Mall, blue building, Ring bell at gate 2"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>
                Optional: Help customers locate your venue easily
              </p>
            </div>

            <DialogFooter style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                {editingVenue ? 'Update Venue' : 'Create Venue'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueManager;
