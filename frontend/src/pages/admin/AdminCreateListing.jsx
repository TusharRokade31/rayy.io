import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../../App';
import { toast } from 'sonner';
import Navbar from '../../components/Navbar';
import { Plus, Building2, MapPin, IndianRupee, Clock } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorHandler';

const AdminCreateListing = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'sports',
    age_min: 5,
    age_max: 15,
    description: '',
    address: '',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '',
    latitude: '',
    longitude: '',
    price_inr: '',
    duration_minutes: 60,
    max_capacity: 10
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/admin/partners?status=active&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartners(response.data.partners || []);
    } catch (error) {
      toast.error('Failed to load partners');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPartner) {
      toast.error('Please select a partner');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/admin/listings/create`, {
        partner_id: selectedPartner,
        ...formData,
        price_inr: parseFloat(formData.price_inr),
        age_min: parseInt(formData.age_min),
        age_max: parseInt(formData.age_max),
        duration_minutes: parseInt(formData.duration_minutes),
        max_capacity: parseInt(formData.max_capacity),
        latitude: formData.latitude ? parseFloat(formData.latitude) : 28.4595,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 77.0266
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Listing created successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(getErrorMessage(error) || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Listing (Admin)</h1>
          <p className="text-gray-600">Create a new listing on behalf of a partner</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Partner Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Select Partner *
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a partner...</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.brand_name} - {p.city}
                </option>
              ))}
            </select>
          </div>

          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Kids Cricket Academy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sports">Sports</option>
                  <option value="dance">Dance</option>
                  <option value="music">Music</option>
                  <option value="art">Art & Craft</option>
                  <option value="coding">Coding</option>
                  <option value="academics">Academics</option>
                  <option value="swimming">Swimming</option>
                  <option value="martial_arts">Martial Arts</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="age_min"
                    value={formData.age_min}
                    onChange={handleChange}
                    min="1"
                    max="24"
                    placeholder="Min"
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    name="age_max"
                    value={formData.age_max}
                    onChange={handleChange}
                    min="1"
                    max="24"
                    placeholder="Max"
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <IndianRupee className="inline w-4 h-4" />
                  Price per Session *
                </label>
                <input
                  type="number"
                  name="price_inr"
                  value={formData.price_inr}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4" />
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  required
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Capacity *
                </label>
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe the class, what kids will learn, instructor qualifications..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Street address, building name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{6}"
                  placeholder="110001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinates (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="any"
                    placeholder="Lat"
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    step="any"
                    placeholder="Lng"
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateListing;
