import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';
import { User, UserPlus, Edit2, Trash2, X, Save, Heart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const MobileChildProfiles = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [editingChild, setEditingChild] = useState(null);
  const [editChildData, setEditChildData] = useState({ name: '', age: '', interests: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', age: '', interests: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAddChild = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      await axios.post(
        `${API}/auth/add-child`,
        {
          name: newChild.name,
          age: parseInt(newChild.age),
          interests: newChild.interests.split(',').map(i => i.trim()).filter(Boolean)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Child added successfully!');
      setNewChild({ name: '', age: '', interests: '' });
      setShowAddModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding child:', error);
      toast.error('Failed to add child');
    }
    setAdding(false);
  };

  const handleEditChild = async (index) => {
    try {
      await axios.put(
        `${API}/auth/edit-child/${index}`,
        {
          name: editChildData.name,
          age: parseInt(editChildData.age),
          interests: editChildData.interests.split(',').map(i => i.trim()).filter(Boolean)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Child profile updated!');
      setEditingChild(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating child:', error);
      toast.error('Failed to update child');
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
      console.error('Error deleting child:', error);
      toast.error('Failed to delete child');
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

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Please log in to manage child profiles</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <MagicHeader
          title="Child Profiles"
          subtitle={`${user.child_profiles?.length || 0} children`}
          gradient="from-purple-500 via-pink-500 to-rose-500"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <UserPlus className="w-6 h-6 text-purple-600" />
          </motion.button>
        </MagicHeader>

        {/* Children List */}
        <div className="p-4 pb-24 space-y-4 -mt-4">
          {!user.child_profiles || user.child_profiles.length === 0 ? (
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No children yet</h3>
                <p className="text-sm text-gray-600 text-center mb-6">Add your first child profile to start booking activities</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full font-semibold shadow-lg flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Child
                </motion.button>
              </div>
            </GlassCard>
          ) : (
            user.child_profiles.map((child, idx) => (
              <GlassCard
                key={idx}
                delay={idx * 0.05}
                hover={false}
                className={editingChild === idx ? 'ring-2 ring-purple-500' : ''}
              >
                {editingChild === idx ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Name</label>
                      <input
                        type="text"
                        value={editChildData.name}
                        onChange={(e) => setEditChildData({ ...editChildData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Age</label>
                      <input
                        type="number"
                        value={editChildData.age}
                        onChange={(e) => setEditChildData({ ...editChildData, age: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Interests</label>
                      <textarea
                        value={editChildData.interests}
                        onChange={(e) => setEditChildData({ ...editChildData, interests: e.target.value })}
                        placeholder="Dance, Art, Coding"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditChild(idx)}
                        className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingChild(null)}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{child.age} years old</p>
                      {child.interests && child.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {child.interests.map((interest, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startEditingChild(child, idx)}
                        className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteChild(idx)}
                        disabled={deleting === idx}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      </div>

      {/* Add Child Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="sticky top-0 bg-white pt-6 px-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Child</h2>
                    <p className="text-sm text-gray-600">Create a new child profile</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddChild} className="p-6 pb-8 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Child&apos;s Name</label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
                    placeholder="Enter child's name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newChild.age}
                    onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
                    placeholder="Enter age"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Interests (optional)</label>
                  <textarea
                    value={newChild.interests}
                    onChange={(e) => setNewChild({ ...newChild, interests: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 resize-none"
                    placeholder="Dance, Art, Coding (comma-separated)"
                    rows={3}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={adding}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {adding ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Add Child
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </MobileLayout>
  );
};

export default MobileChildProfiles;
