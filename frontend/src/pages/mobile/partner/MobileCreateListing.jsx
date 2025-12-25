import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../../App';
import MobilePartnerLayout from '../../../layouts/MobilePartnerLayout';
import GlassCard from '../../../components/mobile/GlassCard';
import { 
  ArrowRight, ArrowLeft, Check, Upload, Video, 
  Clock, Users, DollarSign, MapPin, Globe, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const MobileCreateListing = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category_id: '',
    description: '',
    age_min: 5,
    age_max: 12,
    duration_minutes: 60,
    base_price_inr: 500,
    is_online: false,
    venue_id: null,
    trial_available: false,
    trial_price_inr: null,
    media: [],
    video_url: '',
    safety_notes: '',
    equipment_needed: '',
    parent_presence_required: false
  });

  useEffect(() => {
    fetchCategories();
    fetchVenues();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchVenues = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/venues/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVenues(response.data.venues || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      // Don't show error toast - venues might not be set up yet
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 3) {
          toast.error('Please enter a title (min 3 characters)');
          return false;
        }
        if (!formData.category_id) {
          toast.error('Please select a category');
          return false;
        }
        // Check venue requirement for offline listings
        if (!formData.is_online && !formData.venue_id) {
          if (venues.length === 0) {
            toast.error('Please create a venue first before creating an offline listing');
            return false;
          }
          toast.error('Please select a venue for offline listing');
          return false;
        }
        return true;
      case 2:
        if (!formData.description || formData.description.length < 20) {
          toast.error('Please enter a description (min 20 characters)');
          return false;
        }
        return true;
      case 3:
        if (formData.age_min < 1 || formData.age_max > 18 || formData.age_min > formData.age_max) {
          toast.error('Please enter valid age range (1-18)');
          return false;
        }
        if (formData.duration_minutes < 15) {
          toast.error('Duration must be at least 15 minutes');
          return false;
        }
        return true;
      case 4:
        if (formData.base_price_inr < 1) {
          toast.error('Please enter a valid price');
          return false;
        }
        if (formData.trial_available && (!formData.trial_price_inr || formData.trial_price_inr < 0)) {
          toast.error('Please enter trial price');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      
      const response = await axios.post(`${API}/listings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Listing created successfully!');
      navigate('/mobile/partner/listings');
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error(error.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: CheckCircle },
    { number: 2, title: 'Description', icon: CheckCircle },
    { number: 3, title: 'Details', icon: CheckCircle },
    { number: 4, title: 'Pricing', icon: CheckCircle },
    { number: 5, title: 'Review', icon: CheckCircle }
  ];

  return (
    <MobilePartnerLayout hideNav={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-4 py-6 pt-safe">
          <h1 className="text-2xl font-bold text-white mb-2">Create New Listing</h1>
          <p className="text-white/80 text-sm">Step {currentStep} of 5</p>
          
          {/* Progress Bar */}
          <div className="flex gap-2 mt-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step.number <= currentStep
                    ? 'bg-white'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-6 pb-24">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <GlassCard>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
                    
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Listing Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Kids Dance Workshop"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        />
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Subtitle (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) => handleInputChange('subtitle', e.target.value)}
                          placeholder="e.g., Learn Bollywood Dance Basics"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => handleInputChange('category_id', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        >
                          <option value="">Select a category</option>
                          {/* {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))} */}

                           <option  value={"coding"}>
                        coding
                      </option>
                       <option  value={"art-craft"}>
                        Art & Craft
                      </option>
                      <option  value={"music"}>
                        Music
                      </option>
                      <option  value={"dance"}>
                        Dance
                      </option>
                      <option  value={"sports"}>
                        Sports
                      </option>
                        </select>
                      </div>

                      {/* Online/Offline */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Session Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              handleInputChange('is_online', false);
                              // Reset venue_id when switching to offline if no venues
                              if (venues.length === 0) {
                                handleInputChange('venue_id', null);
                              }
                            }}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              !formData.is_online
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 border-2 border-gray-200'
                            }`}
                          >
                            <MapPin className="w-5 h-5 mx-auto mb-1" />
                            In-Person
                          </button>
                          <button
                            onClick={() => {
                              handleInputChange('is_online', true);
                              handleInputChange('venue_id', null); // Clear venue for online
                            }}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              formData.is_online
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 border-2 border-gray-200'
                            }`}
                          >
                            <Globe className="w-5 h-5 mx-auto mb-1" />
                            Online
                          </button>
                        </div>
                      </div>

                      {/* Venue Selection - Only show for offline listings */}
                      {!formData.is_online && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Venue * {venues.length === 0 && <span className="text-red-500 text-xs">(No venues available - create one first)</span>}
                          </label>
                          {venues.length > 0 ? (
                            <select
                              value={formData.venue_id || ''}
                              onChange={(e) => handleInputChange('venue_id', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            >
                              <option value="">Select a venue</option>
                              {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                  {venue.name} - {venue.city}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                              <p className="text-sm text-gray-700">
                                You need to create a venue before creating an offline listing.
                              </p>
                              <button
                                onClick={() => navigate('/partner/venues')}
                                className="mt-2 text-sm text-purple-600 font-semibold underline"
                              >
                                Go to Venue Manager
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <GlassCard>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Description & Details</h2>
                    
                    <div className="space-y-4">
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Describe your activity in detail..."
                          rows={6}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.description.length} characters (min 20)
                        </p>
                      </div>

                      {/* Equipment Needed */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Equipment Needed (Optional)
                        </label>
                        <textarea
                          value={formData.equipment_needed}
                          onChange={(e) => handleInputChange('equipment_needed', e.target.value)}
                          placeholder="e.g., Comfortable clothes, water bottle..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Safety Notes */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Safety Notes (Optional)
                        </label>
                        <textarea
                          value={formData.safety_notes}
                          onChange={(e) => handleInputChange('safety_notes', e.target.value)}
                          placeholder="Any safety precautions or guidelines..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Video URL */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Video URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.video_url}
                          onChange={(e) => handleInputChange('video_url', e.target.value)}
                          placeholder="https://youtube.com/..."
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 3: Age & Duration */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <GlassCard>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Age Range & Duration</h2>
                    
                    <div className="space-y-4">
                      {/* Age Range */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Age Range *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Min Age</label>
                            <input
                              type="number"
                              value={formData.age_min}
                              onChange={(e) => handleInputChange('age_min', parseInt(e.target.value))}
                              min="1"
                              max="18"
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Max Age</label>
                            <input
                              type="number"
                              value={formData.age_max}
                              onChange={(e) => handleInputChange('age_max', parseInt(e.target.value))}
                              min="1"
                              max="18"
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Session Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          value={formData.duration_minutes}
                          onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                          min="15"
                          step="15"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Common durations: 30, 45, 60, 90 minutes</p>
                      </div>

                      {/* Parent Presence */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-50 rounded-xl">
                          <input
                            type="checkbox"
                            checked={formData.parent_presence_required}
                            onChange={(e) => handleInputChange('parent_presence_required', e.target.checked)}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            Parent presence required
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <GlassCard>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing</h2>
                    
                    <div className="space-y-4">
                      {/* Base Price */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Base Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={formData.base_price_inr}
                          onChange={(e) => handleInputChange('base_price_inr', parseFloat(e.target.value))}
                          min="1"
                          step="50"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                        />
                      </div>

                      {/* Trial Available */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-green-50 rounded-xl">
                          <input
                            type="checkbox"
                            checked={formData.trial_available}
                            onChange={(e) => handleInputChange('trial_available', e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            Offer trial class
                          </span>
                        </label>
                      </div>

                      {/* Trial Price */}
                      {formData.trial_available && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Trial Price (₹) *
                          </label>
                          <input
                            type="number"
                            value={formData.trial_price_inr || ''}
                            onChange={(e) => handleInputChange('trial_price_inr', parseFloat(e.target.value))}
                            min="0"
                            step="50"
                            placeholder="0 for free trial"
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <GlassCard>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Listing</h2>
                    
                    <div className="space-y-4">
                      <div className="bg-purple-50 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2">{formData.title}</h3>
                        {formData.subtitle && (
                          <p className="text-sm text-gray-600 mb-2">{formData.subtitle}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-purple-600">
                            {formData.is_online ? 'Online' : 'In-Person'}
                          </span>
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700">
                            Ages {formData.age_min}-{formData.age_max}
                          </span>
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700">
                            {formData.duration_minutes} min
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{formData.description}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                          <div className="text-2xl font-bold text-purple-600">
                            ₹{formData.base_price_inr}
                          </div>
                          {formData.trial_available && (
                            <div className="text-sm">
                              <span className="text-green-600 font-semibold">Trial: </span>
                              <span className="text-gray-900">₹{formData.trial_price_inr || 0}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          <strong>Note:</strong> Your listing will be submitted for review. You'll be notified once it's approved.
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex-1 py-4 bg-white text-gray-700 font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 border-2 border-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </motion.button>
            )}
            
            {currentStep < 5 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Listing
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </MobilePartnerLayout>
  );
};

export default MobileCreateListing;
