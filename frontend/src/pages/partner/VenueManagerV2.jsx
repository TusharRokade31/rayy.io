import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  MapPin, Plus, Edit2, Trash2, Building2, Map, ExternalLink, 
  CheckCircle, ArrowLeft, Save, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const VenueManagerV2 = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    google_maps_link: '',
    landmarks: ''
  });

  const returningFromListingCreation = sessionStorage.getItem('return_to_listing_creation') === 'true';

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      if (!token) {
        toast.error('Please login to continue');
        navigate('/');
        return;
      }
      
      const response = await axios.get(`${API}/venues/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVenues(response.data.venues || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to load venues');
      setLoading(false);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('yuno_token');
      
      if (!token) {
        toast.error('Authentication required. Please login.');
        navigate('/');
        return;
      }
      
      if (editingVenue) {
        await axios.put(`${API}/venues/${editingVenue.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Venue updated successfully! ✅');
      } else {
        await axios.post(`${API}/venues`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Venue created successfully! 🎉');
      }
      
      setShowAddModal(false);
      setEditingVenue(null);
      resetForm();
      fetchVenues();
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error(error.response?.data?.detail || 'Error saving venue');
    } finally {
      setSaving(false);
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
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('yuno_token');
      await axios.delete(`${API}/venues/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Venue deleted successfully');
      fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete venue');
    }
  };

  const openAddModal = () => {
    console.log('Opening add venue modal...');
    setEditingVenue(null);
    resetForm();
    setShowAddModal(true);
    console.log('showAddModal set to:', true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      pincode: '',
      google_maps_link: '',
      landmarks: ''
    });
  };

  const handleBackToListing = () => {
    // Check if returning from listing creation
    if (returningFromListingCreation) {
      // Flags are already set in sessionStorage from ListingCreationWizard
      // Just navigate back - the wizard will restore the draft
      navigate('/partner/listings/new');
    } else {
      // Normal navigation - go to listings manager (all listings list)
      navigate('/partner/listings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading venues...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back to Listing Creation Banner - Always show for easy navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${returningFromListingCreation ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'} rounded-2xl p-6 mb-6 flex items-center justify-between`}
        >
          <div>
            <p className={`font-bold mb-1 flex items-center gap-2 ${returningFromListingCreation ? 'text-amber-900' : 'text-blue-900'}`}>
              <Building2 className="w-5 h-5" />
              {returningFromListingCreation ? 'Creating a Listing' : 'Manage Venues'}
            </p>
            <p className={`text-sm ${returningFromListingCreation ? 'text-amber-800' : 'text-blue-800'}`}>
              {returningFromListingCreation 
                ? 'Add your venue here, then return to complete your listing'
                : 'Add venues for your listings or return to create/edit listings'}
            </p>
          </div>
          <Button
            onClick={handleBackToListing}
            className={`${returningFromListingCreation ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center gap-2`}
          >
            <ArrowLeft className="w-4 h-4" />
            {returningFromListingCreation ? 'Back to Listing' : 'Go to Listings'}
          </Button>
        </motion.div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              Venue Management
            </h1>
            <p className="text-gray-600">Manage your studio locations and branches</p>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Venue
          </Button>
        </div>

        {/* Venues Grid */}
        {venues.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Venues Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first venue to start listing activities and accepting bookings
            </p>
            <Button
              onClick={openAddModal}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Venue
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{venue.name}</h3>
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{venue.address}, {venue.city}</span>
                      </p>
                      {venue.pincode && (
                        <p className="text-sm text-gray-500 mt-1">PIN: {venue.pincode}</p>
                      )}
                      {venue.landmarks && (
                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                          <Map className="w-3 h-3 mt-0.5" />
                          {venue.landmarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(venue)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit venue"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(venue.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete venue"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {venue.google_maps_link && (
                  <a
                    href={venue.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                )}

                {venue.is_active ? (
                  <div className="flex items-center gap-2 mt-4 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
                    Inactive
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => !saving && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-3xl">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingVenue ? 'Edit Venue' : 'Add New Venue'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {editingVenue ? 'Update venue information' : 'Add a new location for your activities'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !saving && setShowAddModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-8 py-6 space-y-6">
                  {/* Venue Name */}
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold">
                      Venue Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., ABC Dance Studio"
                      className="mt-2"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="text-base font-semibold">
                      Full Address <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Building name, street, locality"
                      rows={3}
                      className="mt-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <Label htmlFor="city" className="text-base font-semibold">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., Mumbai"
                        className="mt-2"
                        required
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <Label htmlFor="pincode" className="text-base font-semibold">
                        Pincode
                      </Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="e.g., 400001"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Landmarks */}
                  <div>
                    <Label htmlFor="landmarks" className="text-base font-semibold">
                      Nearby Landmarks
                    </Label>
                    <Input
                      id="landmarks"
                      value={formData.landmarks}
                      onChange={(e) => setFormData({ ...formData, landmarks: e.target.value })}
                      placeholder="e.g., Near City Mall, Behind XYZ School"
                      className="mt-2"
                    />
                  </div>

                  {/* Google Maps Link */}
                  <div>
                    <Label htmlFor="google_maps_link" className="text-base font-semibold">
                      Google Maps Link
                    </Label>
                    <Input
                      id="google_maps_link"
                      type="url"
                      value={formData.google_maps_link}
                      onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                      placeholder="https://maps.google.com/..."
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Share your Google Maps location link for easy navigation
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-6 flex gap-4 rounded-b-3xl">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => !saving && setShowAddModal(false)}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingVenue ? 'Update Venue' : 'Add Venue'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VenueManagerV2;
