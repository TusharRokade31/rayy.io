import React, { useState, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, UserPlus, Edit2, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [newChild, setNewChild] = useState({ name: '', age: '', interests: '' });
  const [editingChild, setEditingChild] = useState(null);
  const [editChildData, setEditChildData] = useState({ name: '', age: '', interests: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAddChild = async (e) => {
    e.preventDefault();
    setAdding(true);
    
    try {
      await axios.post(`${API}/auth/add-child`, {
        name: newChild.name,
        age: parseInt(newChild.age),
        interests: newChild.interests.split(',').map(i => i.trim()).filter(Boolean)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Child added successfully!');
      setNewChild({ name: '', age: '', interests: '' });
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add child'));
    }
    setAdding(false);
  };

  const handleEditChild = async (index) => {
    try {
      await axios.put(`${API}/auth/edit-child/${index}`, {
        name: editChildData.name,
        age: parseInt(editChildData.age),
        interests: editChildData.interests.split(',').map(i => i.trim()).filter(Boolean)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Child profile updated!');
      setEditingChild(null);
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update child'));
    }
  };

  const handleDeleteChild = async (index) => {
    if (!window.confirm('Are you sure you want to delete this child profile?')) {
      return;
    }

    setDeleting(index);
    try {
      await axios.delete(`${API}/auth/delete-child/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Child profile deleted!');
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete child'));
    }
    setDeleting(null);
  };

  const startEditingChild = (child, index) => {
    setEditingChild(index);
    setEditChildData({
      name: child.name,
      age: child.age.toString(),
      interests: child.interests ? child.interests.join(', ') : ''
    });
  };

  return (
    <div data-testid="profile-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>My Profile</h1>

        {/* User Info */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                {user.name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>{user.email}</p>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>Account Type</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', textTransform: 'capitalize' }}>
              {user.role}
            </p>
          </div>
        </div>

        {/* Children Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <User size={24} style={{ color: '#06b6d4' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Children
            </h2>
          </div>

          {user.child_profiles && user.child_profiles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {user.child_profiles.map((child, idx) => (
                <div
                  key={idx}
                  data-testid={'child-'+idx}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    background: editingChild === idx ? '#f0f9ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  {editingChild === idx ? (
                    <div>
                      <div style={{ marginBottom: '1rem' }}>
                        <Label style={{ fontSize: '13px', marginBottom: '0.5rem', display: 'block' }}>Name</Label>
                        <Input
                          value={editChildData.name}
                          onChange={(e) => setEditChildData({ ...editChildData, name: e.target.value })}
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <Label style={{ fontSize: '13px', marginBottom: '0.5rem', display: 'block' }}>Age</Label>
                        <Input
                          type="number"
                          value={editChildData.age}
                          onChange={(e) => setEditChildData({ ...editChildData, age: e.target.value })}
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <Label style={{ fontSize: '13px', marginBottom: '0.5rem', display: 'block' }}>
                          Interests (comma-separated)
                        </Label>
                        <Input
                          value={editChildData.interests}
                          onChange={(e) => setEditChildData({ ...editChildData, interests: e.target.value })}
                          placeholder="Dance, Art, Coding"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditChild(idx)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingChild(null)}
                          style={{
                            background: '#e2e8f0',
                            color: '#64748b',
                            padding: '0.5rem 1rem',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                          {child.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                          Age: {child.age}
                        </div>
                        {child.interests && child.interests.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {child.interests.map((interest, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#e0f2fe',
                                  color: '#0891b2',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEditingChild(child, idx)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#f0f9ff',
                            color: '#06b6d4',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteChild(idx)}
                          disabled={deleting === idx}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#fef2f2',
                            color: '#ef4444',
                            cursor: deleting === idx ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: deleting === idx ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>No children added yet</p>
          )}

          <div style={{
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <UserPlus size={20} style={{ color: '#06b6d4' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Add Child
              </h3>
            </div>

            <form data-testid="add-child-form" onSubmit={handleAddChild}>
              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="child-name">Name</Label>
                <Input
                  id="child-name"
                  data-testid="child-name-input"
                  type="text"
                  placeholder="Child's name"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  required
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="child-age">Age</Label>
                <Input
                  id="child-age"
                  data-testid="child-age-input"
                  type="number"
                  placeholder="Age"
                  min="1"
                  max="24"
                  value={newChild.age}
                  onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                  required
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <Label htmlFor="child-interests">Interests (comma-separated)</Label>
                <Input
                  id="child-interests"
                  data-testid="child-interests-input"
                  type="text"
                  placeholder="e.g., Dance, Art, Coding"
                  value={newChild.interests}
                  onChange={(e) => setNewChild({ ...newChild, interests: e.target.value })}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                data-testid="add-child-submit"
                type="submit"
                disabled={adding}
                style={{
                  width: '100%',
                  background: '#06b6d4',
                  color: 'white',
                  padding: '0.75rem',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: adding ? 'not-allowed' : 'pointer',
                  opacity: adding ? 0.6 : 1
                }}
              >
                {adding ? 'Adding...' : (
                  <>
                    <UserPlus size={18} />
                    Add Child
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
