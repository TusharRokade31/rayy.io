import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../../App';
import Navbar from '../../../components/Navbar';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
  FileText, Image, IndianRupee, Users, Clock, 
  Calendar, CheckCircle2, ArrowRight, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../utils/errorHandler';
import PlanOptionsBuilder from '../../../components/PlanOptionsBuilder';
import BatchManager from '../../../components/BatchManager';
import SessionSlotGenerator from '../../../components/SessionSlotGenerator';

const MobileCreateListing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: listingId } = useParams(); // Get listing ID for edit mode
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCatIndex, setSelectedCatIndex] = useState("");
  const [venues, setVenues] = useState([]);

  const [sessionConfig, setSessionConfig] = useState(null);

  const activeSubcategories = categories[selectedCatIndex]?.subcategories || [];

  // Theme Constants
  const THEME_GRADIENT = 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
  const THEME_COLOR_PRIMARY = '#8B5CF6';
  const THEME_COLOR_SECONDARY = '#EC4899';
  
  // Listing data
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    category_id: '',
    age_min: '',
    age_max: '',
    duration_minutes: '',
    base_price_inr: '',
    trial_available: false,
    trial_price_inr: '',
    tax_percent: 18,
    is_online: false,
    venue_id: '',  // Required for offline listings
    media: [],
    // NEW: Additional Details
    amenities: [],  // Array of amenities
    pick_drop_available: false,
    pick_drop_details: '',
    parent_presence_required: 'optional',  // 'required', 'optional', 'not_allowed'
    equipment_needed: '',  // What equipment students should bring
    safety_notes: '',  // Safety information
    max_capacity: '',  // Maximum students per session
    pricing_plans: [
      { plan_type: 'trial', sessions_count: 1, price_inr: '', discount_percent: 0 },
      { plan_type: 'single', sessions_count: 1, price_inr: '', discount_percent: 0 },
      { plan_type: 'weekly_4', sessions_count: 4, price_inr: '', discount_percent: 10 },
      { plan_type: 'weekly_8', sessions_count: 8, price_inr: '', discount_percent: 15 },
      { plan_type: 'monthly_12', sessions_count: 12, price_inr: '', discount_percent: 20 },
      { plan_type: 'monthly_16', sessions_count: 16, price_inr: '', discount_percent: 25 }
    ],
    // Flexible Booking V2
    plan_options: [],
    batches: []
  });

  const hasFlexiblePlans = listingData.plan_options.some(p => p.timing_type === 'FLEXIBLE');
  const hasFixedPlans = listingData.plan_options.some(p => p.timing_type === 'FIXED');

  // Available amenities list
  const availableAmenities = [
    { value: 'AC', label: '❄️ Air Conditioning', icon: '❄️' },
    { value: 'WiFi', label: '📶 WiFi', icon: '📶' },
    { value: 'Parking', label: '🅿️ Parking', icon: '🅿️' },
    { value: 'Washroom', label: '🚻 Washroom', icon: '🚻' },
    { value: 'Water', label: '💧 Drinking Water', icon: '💧' },
    { value: 'Cafeteria', label: '🍽️ Cafeteria', icon: '🍽️' },
    { value: 'First Aid', label: '🏥 First Aid', icon: '🏥' },
    { value: 'CCTV', label: '📹 CCTV Security', icon: '📹' },
    { value: 'Lockers', label: '🔒 Lockers', icon: '🔒' },
    { value: 'Changing Room', label: '👕 Changing Room', icon: '👕' },
    { value: 'Equipment', label: '🎒 Equipment Provided', icon: '🎒' },
    { value: 'Waiting Area', label: '🪑 Parent Waiting Area', icon: '🪑' }
  ];

  // --- AUTO-SAVE & RESTORE LOGIC ---

  // 1. Auto-save listing data to sessionStorage whenever it changes
  useEffect(() => {
    // Don't save if we are in edit mode (we don't want to overwrite drafts with existing data unintentionally)
    // or if the data is empty/initial state
    if (!isEditMode && listingData.title !== '') {
      const dataToSave = {
        listingData,
        step,
        selectedCatIndex,
        sessionConfig
      };
      sessionStorage.setItem('draft_listing_data', JSON.stringify(dataToSave));
    }
  }, [listingData, step, selectedCatIndex, sessionConfig, isEditMode]);

  // 2. Restore data on mount
  useEffect(() => {
    fetchCategories();
    fetchVenues();
    
    // Check if we're in edit mode
    if (listingId) {
      setIsEditMode(true);
      fetchListingData(listingId);
    } else {
      // Check for saved draft
      const savedDraft = sessionStorage.getItem('draft_listing_data');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          
          // Restore the state
          if (parsed.listingData) setListingData(parsed.listingData);
          if (parsed.step) setStep(parsed.step);
          if (parsed.selectedCatIndex !== undefined) setSelectedCatIndex(parsed.selectedCatIndex);
          if (parsed.sessionConfig) setSessionConfig(parsed.sessionConfig);
          
          toast.success('📝 Restored your draft listing');
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      }
    }
  }, [listingId]);

  // --- END AUTO-SAVE LOGIC ---
  
  // Refetch venues when component becomes visible again (user returns from venue page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - refetch venues to get latest list
        fetchVenues();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      console.error('Error fetching venues:', error);
      setVenues([]);
    }
  };

  const fetchListingData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const listing = response.data;
      
      // Populate form with existing listing data
      setListingData({
        title: listing.title || '',
        description: listing.description || '',
        category_id: listing.category_id || '',
        age_min: listing.age_min || '',
        age_max: listing.age_max || '',
        duration_minutes: listing.duration_minutes || '',
        base_price_inr: listing.base_price_inr || '',
        trial_available: listing.trial_available || false,
        trial_price_inr: listing.trial_price_inr || '',
        tax_percent: listing.tax_percent || 18,
        is_online: listing.is_online || false,
        venue_id: listing.venue_id || '',
        // Normalize media format
        media: (listing.media || []).map(m => 
          typeof m === 'string' 
            ? { data: m, type: m.includes('video') ? 'video/mp4' : 'image/jpeg', name: 'existing' }
            : m
        ),
        amenities: listing.amenities || [],
        pick_drop_available: listing.pick_drop_available || false,
        pick_drop_details: listing.pick_drop_details || '',
        parent_presence_required: listing.parent_presence_required || 'optional',
        equipment_needed: listing.equipment_needed || '',
        safety_notes: listing.safety_notes || '',
        max_capacity: listing.max_capacity || '',
        pricing_plans: listing.pricing_plans || [],
        plan_options: listing.plan_options || [],
        batches: listing.batches || []
      });
      
      toast.success('📝 Listing loaded for editing');
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing data');
      navigate('/partner/listings');
    } finally {
      setLoading(false);
    }
  };

  // Handle amenity toggle
  const toggleAmenity = (amenity) => {
    setListingData(prev => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  // Handle multiple image/video uploads
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 files
    if (listingData.media.length + files.length > 5) {
      toast.error('Maximum 5 photos/videos allowed');
      return;
    }

    // Validate file size (max 10MB per file)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum 10MB per file.`);
        return;
      }
    }

    // Convert to base64
    const mediaPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            data: reader.result,
            type: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const mediaFiles = await Promise.all(mediaPromises);
    setListingData(prev => ({
      ...prev,
      media: [...prev.media, ...mediaFiles]
    }));
    
    toast.success(`${files.length} file(s) added`);
  };

  const removeMedia = (index) => {
    setListingData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!listingData.title || !listingData.description || !listingData.category_id) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (!listingData.is_online && !listingData.venue_id) {
        toast.error('⚠️ Please select a venue for offline/in-person classes');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!listingData.age_min || !listingData.age_max || !listingData.duration_minutes) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!listingData.base_price_inr) {
        toast.error('Please set a price');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (listingData.media.length === 0) {
        toast.error('⚠️ Please upload at least one photo or video');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (listingData.plan_options.length === 0) {
        toast.error('⚠️ Please create at least one pricing plan');
        return;
      }
      setStep(6);
    } else if (step === 6) {
      if (hasFixedPlans && listingData.batches.length === 0) {
        toast.error('⚠️ Please create at least one batch for your fixed plans');
        return;
      }
      if (hasFlexiblePlans && !sessionConfig) {
         toast.error('⚠️ Please generate availability slots for your flexible plans');
         return;
      }
      setStep(7);
    } else if (step === 7) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    
    if (!listingData.is_online && !listingData.venue_id) {
      toast.error('⚠️ Please select a venue for offline/in-person classes');
      return;
    }
    
    if (!listingData.title || !listingData.category_id || !listingData.base_price_inr) {
      toast.error('⚠️ Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('yuno_token');
      
      const partnerRes = await axios.get(`${API}/partners/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const basePrice = parseFloat(listingData.base_price_inr) || 0;
      
      const legacyPricingPlans = [
        {
          plan_type: 'trial',
          sessions_count: 1,
          price_inr: listingData.trial_available ? parseFloat(listingData.trial_price_inr) || 0 : 0,
          discount_percent: 0,
          active: listingData.trial_available
        },
        {
          plan_type: 'single',
          sessions_count: 1,
          price_inr: basePrice,
          discount_percent: 0,
          active: true
        }
      ];
      
      const payload = {
        ...listingData,
        partner_id: partnerRes.data.id,
        age_min: parseInt(listingData.age_min),
        age_max: parseInt(listingData.age_max),
        duration_minutes: parseInt(listingData.duration_minutes),
        base_price_inr: basePrice,
        trial_price_inr: listingData.trial_available ? parseFloat(listingData.trial_price_inr) : 0,
        pricing_plans: legacyPricingPlans,
        status: 'active',
        venue_id: listingData.is_online ? null : listingData.venue_id,
        media: listingData.media.map(m => typeof m === 'string' ? m : m.data),
        amenities: listingData.amenities,
        pick_drop_available: listingData.pick_drop_available,
        pick_drop_details: listingData.pick_drop_details,
        parent_presence_required: listingData.parent_presence_required === 'required',
        equipment_needed: listingData.equipment_needed,
        safety_notes: listingData.safety_notes,
        max_capacity: listingData.max_capacity ? parseInt(listingData.max_capacity) : null,
        plan_options: [],
        batches: []
      };

      let targetListingId = listingId;

      if (isEditMode) {
        await axios.post(`${API}/listings/${listingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const createResponse = await axios.post(`${API}/listings`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        targetListingId = createResponse.data.listing.id;

        if (sessionConfig && targetListingId) {
          try {
            const sessionPayload = {
              ...sessionConfig,
              listing_id: targetListingId
            };
            await axios.post(`${API}/sessions/bulk-create`, sessionPayload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            console.error("Failed to generate sessions", err);
          }
        }
        
        if (listingData.plan_options && listingData.plan_options.length > 0) {
          for (const plan of listingData.plan_options) {
            try {
              const planPayload = {
                plan_type: plan.plan_type,
                name: plan.name,
                description: plan.description,
                sessions_count: parseInt(plan.sessions_count),
                price_inr: parseFloat(plan.price_inr),
                discount_percent: parseFloat(plan.discount_percent || 0),
                validity_days: parseInt(plan.validity_days)
              };
              await axios.post(`${API}/listings/${targetListingId}/plan-options`, planPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (planError) {
              console.error('Failed to add plan:', planError);
            }
          }
        }

        if (listingData.batches && listingData.batches.length > 0) {
          for (const batch of listingData.batches) {
            try {
              const batchPayload = {
                name: batch.name,
                days_of_week: batch.days_of_week,
                time: batch.time,
                duration_minutes: parseInt(batch.duration_minutes),
                capacity: parseInt(batch.capacity),
                plan_types: batch.plan_types,
                start_date: batch.start_date,
                end_date: batch.end_date || null
              };
              await axios.post(`${API}/listings/${targetListingId}/batches`, batchPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (batchError) {
              console.error('Failed to add batch:', batchError);
            }
          }
        }
      }
      
      // Clear draft on success
      sessionStorage.removeItem('draft_listing_data');
      
      toast.success(isEditMode ? '🎉 Listing updated successfully!' : '🎉 Listing and plans created successfully!');
      navigate('/partner/listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(getErrorMessage(error, 'Failed to create listing'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.5rem' }}>
        
        <div style={{
            background: THEME_GRADIENT,
            padding: '2rem 1rem',
            color: 'white',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px'
          }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '800',
              marginBottom: '0.25rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              {isEditMode ? 'Edit Listing' : 'Create New Listing'}
            </h1>
            
            <p style={{
              fontSize: '0.95rem',
              opacity: 0.9,
              marginBottom: '1.5rem',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Step {step} of 7 • {['Basic', 'Details', 'Pricing', 'Media', 'Plans', 'Batches', 'Review'][step - 1]}
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div
                  key={s}
                  style={{
                    height: '5px',
                    flex: 1,
                    borderRadius: '10px',
                    background: s <= step ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

        <div style={{
          background: 'white',
          padding: '1rem',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <AnimatePresence mode="wait">
            {/* ... [STEPS 1-7 Content remains same as provided, logic handles the persistence] ... */}
            {/* For brevity, omitting the unchanged JSX rendering part, but it consumes the listingData state we are now persisting */}
             {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                    Class Title <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <Input
                    value={listingData.title}
                    onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                    placeholder="e.g., Hip-Hop Dance for Kids"
                    style={{
                      marginTop: '0.5rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px',
                      padding: '0.75rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                    Description <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <textarea
                    value={listingData.description}
                    onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                    placeholder="Describe what students will learn, what makes your class special..."
                    rows={5}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                    Category Type <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  
                  <select
                    value={selectedCatIndex}
                    onChange={(e) => {
                      const newIndex = e.target.value;
                      setSelectedCatIndex(newIndex);
                      setListingData({ ...listingData, category_id: "" }); 
                    }}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      marginBottom: '1rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0'
                    }}
                  >
                    <option value="">Select Category Type</option>
                    {categories.map((cat, index) => (
                      <option key={cat._id || cat.id} value={index}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>

                  {activeSubcategories.length > 0 && (
                    <>
                      <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                        Specific Activity <span style={{ color: '#EF4444' }}>*</span>
                      </Label>
                      
                      <select
                        value={listingData.category_id}
                        onChange={(e) => setListingData({ ...listingData, category_id: e.target.value })}
                        style={{
                          width: '100%',
                          marginTop: '0.5rem',
                          fontFamily: 'Outfit, sans-serif',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          border: '2px solid #e2e8f0'
                        }}
                      >
                        <option value="">Select Activity</option>
                        {activeSubcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.icon} {sub.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* Online/Offline Selection */}
               <div style={{
                  background: '#FEF3C7',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '2px solid #FBBF24',
                  marginBottom: '1.5rem'
                }}>
                  <Label style={{ 
                    fontFamily: 'Outfit, sans-serif', 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    display: 'block',
                    color: '#92400E'
                  }}>
                    Class Format <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <p style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '1rem' }}>
                    Select whether this is an online or in-person class
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: '12px',
                      border: `2px solid ${!listingData.is_online ? '#3B82F6' : '#E5E7EB'}`,
                      background: !listingData.is_online ? '#EFF6FF' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <input
                        type="radio"
                        name="class_format"
                        checked={!listingData.is_online}
                        onChange={() => setListingData({ ...listingData, is_online: false })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                          📍 In-Person (Offline)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                          Held at a physical location
                        </div>
                      </div>
                    </label>

                    <label style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: '12px',
                      border: `2px solid ${listingData.is_online ? '#3B82F6' : '#E5E7EB'}`,
                      background: listingData.is_online ? '#EFF6FF' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <input
                        type="radio"
                        name="class_format"
                        checked={listingData.is_online}
                        onChange={() => setListingData({ ...listingData, is_online: true, venue_id: '' })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                          💻 Online
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                          Conducted via video call
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {!listingData.is_online && (
                  <>
                    {venues.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            // We don't need manual save here anymore because of the auto-save useEffect
                            // But we keep navigation logic
                            navigate('/partner/venues');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '0.875rem 1.75rem',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            transition: 'transform 0.2s',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                        >
                          ➕ Add New Venue
                        </button>
                      </div>
                    )}
                    
                  <div style={{
                    background: '#DBEAFE',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '2px solid #3B82F6',
                    marginBottom: '1.5rem'
                  }}>
                    <Label style={{ 
                      fontFamily: 'Outfit, sans-serif', 
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      marginBottom: '0.5rem',
                      display: 'block',
                      color: '#1E40AF'
                    }}>
                      Select Venue <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    
                    {venues.length === 0 ? (
                      <div style={{
                        padding: '1.5rem',
                        background: '#FEE2E2',
                        borderRadius: '12px',
                        border: '2px solid #EF4444',
                        textAlign: 'center'
                      }}>
                        <p style={{ color: '#991B1B', fontWeight: '600', marginBottom: '0.5rem' }}>
                          ⚠️ No Venues Added
                        </p>
                        <button
                          onClick={() => navigate('/partner/venues')}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontWeight: '600'
                          }}
                        >
                          Add Your First Venue
                        </button>
                      </div>
                    ) : (
                        <select
                          value={listingData.venue_id}
                          onChange={(e) => setListingData({ ...listingData, venue_id: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: '2px solid #3B82F6',
                            fontSize: '1rem',
                            fontFamily: 'Outfit, sans-serif',
                            background: 'white'
                          }}
                          required={!listingData.is_online}
                        >
                          <option value="">-- Select a venue --</option>
                          {venues.map((venue) => (
                            <option key={venue.id} value={venue.id}>
                              📍 {venue.name} - {venue.address}
                            </option>
                          ))}
                        </select>
                    )}
                  </div>
                  </>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                  {/* ... Existing Step 2 Content ... */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                      Minimum Age <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    <Input
                      type="number"
                      value={listingData.age_min}
                      onChange={(e) => setListingData({ ...listingData, age_min: e.target.value })}
                      placeholder="e.g., 7"
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'Outfit, sans-serif',
                        borderRadius: '12px',
                        padding: '0.75rem'
                      }}
                    />
                  </div>
                  <div>
                    <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                      Maximum Age <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    <Input
                      type="number"
                      value={listingData.age_max}
                      onChange={(e) => setListingData({ ...listingData, age_max: e.target.value })}
                      placeholder="e.g., 14"
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'Outfit, sans-serif',
                        borderRadius: '12px',
                        padding: '0.75rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                    Duration (minutes) <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <Input
                    type="number"
                    value={listingData.duration_minutes}
                    onChange={(e) => setListingData({ ...listingData, duration_minutes: e.target.value })}
                    placeholder="e.g., 60"
                    style={{
                      marginTop: '0.5rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px',
                      padding: '0.75rem'
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Steps 3, 4, 5, 6, 7 would be similarly rendered here using listingData */}
            {step === 3 && (
                <motion.div
                                     key="step3"
                                     initial={{ opacity: 0, x: 20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     exit={{ opacity: 0, x: -20 }}
                                     transition={{ duration: 0.3 }}
                                   >
                                     <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                       <IndianRupee size={48} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
                                       <h2 style={{
                                         fontSize: '2rem',
                                         fontWeight: '700',
                                         color: '#1E293B',
                                         marginBottom: '0.5rem',
                                         fontFamily: 'Outfit, sans-serif'
                                       }}>Pricing Plans</h2>
                                       <p style={{
                                         fontSize: '1rem',
                                         color: '#64748B',
                                         fontFamily: 'Outfit, sans-serif'
                                       }}>Set pricing for different packages</p>
                                     </div>
                     
                                     {/* Base Price */}
                                     <div style={{ marginBottom: '1.5rem' }}>
                                       <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                                         Base Price Per Session (₹) <span style={{ color: '#EF4444' }}>*</span>
                                       </Label>
                                       <Input
                                         type="number"
                                         value={listingData.base_price_inr}
                                         onChange={(e) => {
                                           const basePrice = parseFloat(e.target.value) || 0;
                                           const updatedPlans = listingData.pricing_plans.map(plan => ({
                                             ...plan,
                                             price_inr: plan.plan_type === 'trial' ? plan.price_inr : 
                                                         (basePrice * plan.sessions_count * (1 - plan.discount_percent / 100)).toFixed(2)
                                           }));
                                           setListingData({ 
                                             ...listingData, 
                                             base_price_inr: e.target.value,
                                             pricing_plans: updatedPlans
                                           });
                                         }}
                                         placeholder="e.g., 800"
                                         style={{
                                           marginTop: '0.5rem',
                                           fontFamily: 'Outfit, sans-serif',
                                           borderRadius: '12px',
                                           padding: '0.75rem'
                                         }}
                                       />
                                       <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.5rem' }}>
                                         This is your standard per-session price
                                       </p>
                                     </div>
                     
                                     {/* Pricing Plans Grid */}
                                     <div style={{ 
                                       display: 'grid', 
                                       gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                       gap: '1rem',
                                       marginBottom: '1.5rem'
                                     }}>
                                       {/* Trial Plan */}
                                       <div style={{
                                         background: '#FEF3C7',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #FBBF24'
                                       }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                           <input
                                             type="checkbox"
                                             checked={listingData.trial_available}
                                             onChange={(e) => setListingData({ ...listingData, trial_available: e.target.checked })}
                                             style={{ width: '18px', height: '18px' }}
                                           />
                                           <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem' }}>
                                             Trial Session
                                           </h3>
                                         </div>
                                         {listingData.trial_available && (
                                           <div>
                                             <Label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.875rem' }}>
                                               Trial Price (₹)
                                             </Label>
                                             <Input
                                               type="number"
                                               value={listingData.trial_price_inr}
                                               onChange={(e) => setListingData({ ...listingData, trial_price_inr: e.target.value })}
                                               placeholder="e.g., 199"
                                               style={{ marginTop: '0.5rem', borderRadius: '8px' }}
                                             />
                                             <p style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.5rem' }}>
                                               Introductory offer for new students
                                             </p>
                                           </div>
                                         )}
                                       </div>
                     
                                       {/* Single Session */}
                                       <div style={{
                                         background: '#DBEAFE',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #3B82F6'
                                       }}>
                                         <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                           Single Session
                                         </h3>
                                         <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1E40AF', marginBottom: '0.5rem' }}>
                                           ₹{listingData.base_price_inr || '0'}
                                         </div>
                                         <p style={{ fontSize: '0.75rem', color: '#1E40AF' }}>
                                           1 session • Pay as you go
                                         </p>
                                       </div>
                     
                                       {/* Weekly 4 Sessions */}
                                       <div style={{
                                         background: '#D1FAE5',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #10B981'
                                       }}>
                                         <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                           Weekly (4 Sessions)
                                         </h3>
                                         <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#065F46', marginBottom: '0.5rem' }}>
                                           ₹{listingData.base_price_inr ? (listingData.base_price_inr * 4 * 0.9).toFixed(0) : '0'}
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <Label style={{ fontSize: '0.875rem' }}>Discount %</Label>
                                           <Input
                                             type="number"
                                             value="10"
                                             onChange={(e) => {
                                               const plans = [...listingData.pricing_plans];
                                               plans[2].discount_percent = parseFloat(e.target.value) || 0;
                                               setListingData({ ...listingData, pricing_plans: plans });
                                             }}
                                             style={{ width: '60px', height: '30px', padding: '0.25rem' }}
                                           />
                                         </div>
                                         <p style={{ fontSize: '0.75rem', color: '#065F46' }}>
                                           Save ₹{listingData.base_price_inr ? (listingData.base_price_inr * 4 * 0.1).toFixed(0) : '0'} • ₹{listingData.base_price_inr ? (listingData.base_price_inr * 0.9).toFixed(0) : '0'}/session
                                         </p>
                                       </div>
                     
                                       {/* Weekly 8 Sessions */}
                                       <div style={{
                                         background: '#E0E7FF',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #6366F1'
                                       }}>
                                         <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                           Weekly (8 Sessions)
                                         </h3>
                                         <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#312E81', marginBottom: '0.5rem' }}>
                                           ₹{listingData.base_price_inr ? (listingData.base_price_inr * 8 * 0.85).toFixed(0) : '0'}
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <Label style={{ fontSize: '0.875rem' }}>Discount %</Label>
                                           <Input
                                             type="number"
                                             value="15"
                                             onChange={(e) => {
                                               const plans = [...listingData.pricing_plans];
                                               plans[3].discount_percent = parseFloat(e.target.value) || 0;
                                               setListingData({ ...listingData, pricing_plans: plans });
                                             }}
                                             style={{ width: '60px', height: '30px', padding: '0.25rem' }}
                                           />
                                         </div>
                                         <p style={{ fontSize: '0.75rem', color: '#312E81' }}>
                                           Save ₹{listingData.base_price_inr ? (listingData.base_price_inr * 8 * 0.15).toFixed(0) : '0'} • ₹{listingData.base_price_inr ? (listingData.base_price_inr * 0.85).toFixed(0) : '0'}/session
                                         </p>
                                       </div>
                     
                                       {/* Monthly 12 Sessions */}
                                       <div style={{
                                         background: '#FCE7F3',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #EC4899'
                                       }}>
                                         <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                           Monthly (12 Sessions)
                                         </h3>
                                         <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#831843', marginBottom: '0.5rem' }}>
                                           ₹{listingData.base_price_inr ? (listingData.base_price_inr * 12 * 0.8).toFixed(0) : '0'}
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <Label style={{ fontSize: '0.875rem' }}>Discount %</Label>
                                           <Input
                                             type="number"
                                             value="20"
                                             onChange={(e) => {
                                               const plans = [...listingData.pricing_plans];
                                               plans[4].discount_percent = parseFloat(e.target.value) || 0;
                                               setListingData({ ...listingData, pricing_plans: plans });
                                             }}
                                             style={{ width: '60px', height: '30px', padding: '0.25rem' }}
                                           />
                                         </div>
                                         <p style={{ fontSize: '0.75rem', color: '#831843' }}>
                                           Save ₹{listingData.base_price_inr ? (listingData.base_price_inr * 12 * 0.2).toFixed(0) : '0'} • ₹{listingData.base_price_inr ? (listingData.base_price_inr * 0.8).toFixed(0) : '0'}/session
                                         </p>
                                       </div>
                     
                                       {/* Monthly 16 Sessions */}
                                       <div style={{
                                         background: '#FEE2E2',
                                         padding: '1.5rem',
                                         borderRadius: '16px',
                                         border: '2px solid #EF4444'
                                       }}>
                                         <div style={{ 
                                           background: '#DC2626', 
                                           color: 'white', 
                                           padding: '0.25rem 0.75rem', 
                                           borderRadius: '999px', 
                                           fontSize: '0.75rem',
                                           fontWeight: '700',
                                           display: 'inline-block',
                                           marginBottom: '0.5rem'
                                         }}>
                                           BEST VALUE
                                         </div>
                                         <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                           Monthly (16 Sessions)
                                         </h3>
                                         <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7F1D1D', marginBottom: '0.5rem' }}>
                                           ₹{listingData.base_price_inr ? (listingData.base_price_inr * 16 * 0.75).toFixed(0) : '0'}
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <Label style={{ fontSize: '0.875rem' }}>Discount %</Label>
                                           <Input
                                             type="number"
                                             value="25"
                                             onChange={(e) => {
                                               const plans = [...listingData.pricing_plans];
                                               plans[5].discount_percent = parseFloat(e.target.value) || 0;
                                               setListingData({ ...listingData, pricing_plans: plans });
                                             }}
                                             style={{ width: '60px', height: '30px', padding: '0.25rem' }}
                                           />
                                         </div>
                                         <p style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>
                                           Save ₹{listingData.base_price_inr ? (listingData.base_price_inr * 16 * 0.25).toFixed(0) : '0'} • ₹{listingData.base_price_inr ? (listingData.base_price_inr * 0.75).toFixed(0) : '0'}/session
                                         </p>
                                       </div>
                                     </div>
                                   </motion.div>
            )}
            
              {step === 4 && (
                          <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* Photos/Videos Upload */}
                            <div style={{
                              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                              padding: '1.5rem',
                              borderRadius: '16px',
                              border: '2px solid #8B5CF6',
                              marginBottom: '1.5rem'
                            }}>
                              <Label style={{ 
                                fontFamily: 'Outfit, sans-serif', 
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.5rem',
                                display: 'block',
                                color: '#6B21A8'
                              }}>
                                📸 Photos & Videos <span style={{ color: '#EF4444' }}>*</span>
                              </Label>
                              <p style={{ fontSize: '0.875rem', color: '#6B21A8', marginBottom: '1rem' }}>
                                Upload up to 5 images or videos showcasing your class (Max 10MB each)
                              </p>
                              
                              {/* Upload Button */}
                              <label style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: '#8B5CF6',
                                color: 'white',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                marginBottom: '1rem'
                              }}>
                                <Upload size={20} />
                                Choose Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,video/*"
                                  onChange={handleMediaUpload}
                                  style={{ display: 'none' }}
                                />
                              </label>
            
                              {/* Media Preview */}
                              {listingData.media.length > 0 && (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                  gap: '1rem',
                                  marginTop: '1rem'
                                }}>
                                  {listingData.media.map((media, index) => {
                                    // Safeguard: Check if media has type property
                                    const isImage = media.type ? media.type.startsWith('image/') : typeof media === 'string' && (media.includes('.jpg') || media.includes('.jpeg') || media.includes('.png') || media.includes('.webp'));
                                    
                                    return (
                                    <div key={index} style={{
                                      position: 'relative',
                                      paddingTop: '100%',
                                      background: '#F3F4F6',
                                      borderRadius: '12px',
                                      overflow: 'hidden'
                                    }}>
                                      {isImage ? (
                                        <img
                                          src={media.data || media}
                                          alt={`Upload ${index + 1}`}
                                          style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      ) : (
                                        <div style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: '#1F2937',
                                          color: 'white',
                                          fontSize: '2rem'
                                        }}>
                                          🎥
                                        </div>
                                      )}
                                      <button
                                        onClick={() => removeMedia(index)}
                                        style={{
                                          position: 'absolute',
                                          top: '0.25rem',
                                          right: '0.25rem',
                                          background: '#EF4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '24px',
                                          height: '24px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          fontSize: '14px'
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                  })}
                                </div>
                              )}
                              
                              {listingData.media.length === 0 && (
                                <p style={{ fontSize: '0.75rem', color: '#991B1B', marginTop: '0.5rem' }}>
                                  ⚠️ At least one photo is required
                                </p>
                              )}
                            </div>
            
                            {/* Amenities Selection */}
                            <div style={{
                              background: '#F0FDFA',
                              padding: '1.5rem',
                              borderRadius: '16px',
                              border: '2px solid #14B8A6',
                              marginBottom: '1.5rem'
                            }}>
                              <Label style={{ 
                                fontFamily: 'Outfit, sans-serif', 
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.5rem',
                                display: 'block',
                                color: '#115E59'
                              }}>
                                🏢 Amenities Available
                              </Label>
                              <p style={{ fontSize: '0.875rem', color: '#115E59', marginBottom: '1rem' }}>
                                Select all amenities available at your venue
                              </p>
                              
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '0.75rem'
                              }}>
                                {availableAmenities.map((amenity) => (
                                  <label key={amenity.value} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: `2px solid ${listingData.amenities.includes(amenity.value) ? '#14B8A6' : '#E5E7EB'}`,
                                    background: listingData.amenities.includes(amenity.value) ? '#CCFBF1' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={listingData.amenities.includes(amenity.value)}
                                      onChange={() => toggleAmenity(amenity.value)}
                                      style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                      {amenity.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
            
                            {/* Parent Presence Requirement */}
                            <div style={{
                              background: '#FFF7ED',
                              padding: '1.5rem',
                              borderRadius: '16px',
                              border: '2px solid #F97316',
                              marginBottom: '1.5rem'
                            }}>
                              <Label style={{ 
                                fontFamily: 'Outfit, sans-serif', 
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.5rem',
                                display: 'block',
                                color: '#9A3412'
                              }}>
                                👨‍👩‍👧 Parent/Guardian Presence <span style={{ color: '#EF4444' }}>*</span>
                              </Label>
                              <p style={{ fontSize: '0.875rem', color: '#9A3412', marginBottom: '1rem' }}>
                                Is parent/guardian presence required during the class?
                              </p>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: `2px solid ${listingData.parent_presence_required === 'required' ? '#F97316' : '#E5E7EB'}`,
                                  background: listingData.parent_presence_required === 'required' ? '#FFEDD5' : 'white',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type="radio"
                                    name="parent_presence"
                                    checked={listingData.parent_presence_required === 'required'}
                                    onChange={() => setListingData({ ...listingData, parent_presence_required: 'required' })}
                                    style={{ width: '20px', height: '20px' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>✅ Required</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                      Parent/guardian must stay throughout the session
                                    </div>
                                  </div>
                                </label>
            
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: `2px solid ${listingData.parent_presence_required === 'optional' ? '#F97316' : '#E5E7EB'}`,
                                  background: listingData.parent_presence_required === 'optional' ? '#FFEDD5' : 'white',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type="radio"
                                    name="parent_presence"
                                    checked={listingData.parent_presence_required === 'optional'}
                                    onChange={() => setListingData({ ...listingData, parent_presence_required: 'optional' })}
                                    style={{ width: '20px', height: '20px' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>⚡ Optional</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                      Parents can stay or leave as they prefer
                                    </div>
                                  </div>
                                </label>
            
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: `2px solid ${listingData.parent_presence_required === 'not_allowed' ? '#F97316' : '#E5E7EB'}`,
                                  background: listingData.parent_presence_required === 'not_allowed' ? '#FFEDD5' : 'white',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type="radio"
                                    name="parent_presence"
                                    checked={listingData.parent_presence_required === 'not_allowed'}
                                    onChange={() => setListingData({ ...listingData, parent_presence_required: 'not_allowed' })}
                                    style={{ width: '20px', height: '20px' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>🚫 Not Allowed</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                      Parents must drop off and pick up only
                                    </div>
                                  </div>
                                </label>
                              </div>
                            </div>
            
                            {/* Pick/Drop Service */}
                            <div style={{
                              background: '#EFF6FF',
                              padding: '1.5rem',
                              borderRadius: '16px',
                              border: '2px solid #3B82F6',
                              marginBottom: '1.5rem'
                            }}>
                              <Label style={{ 
                                fontFamily: 'Outfit, sans-serif', 
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.5rem',
                                display: 'block',
                                color: '#1E40AF'
                              }}>
                                🚗 Pick & Drop Service
                              </Label>
                              
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '1rem',
                                cursor: 'pointer'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={listingData.pick_drop_available}
                                  onChange={(e) => setListingData({ ...listingData, pick_drop_available: e.target.checked })}
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                                  We provide pick & drop service
                                </span>
                              </label>
            
                              {listingData.pick_drop_available && (
                                <div>
                                  <Label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                                    Service Details (Optional)
                                  </Label>
                                  <Input
                                    value={listingData.pick_drop_details}
                                    onChange={(e) => setListingData({ ...listingData, pick_drop_details: e.target.value })}
                                    placeholder="e.g., Available within 5km radius, Extra charges may apply"
                                    style={{ borderRadius: '8px' }}
                                  />
                                </div>
                              )}
                            </div>
            
                            {/* Additional Fields */}
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                              <div>
                                <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                  Maximum Class Capacity
                                </Label>
                                <Input
                                  type="number"
                                  value={listingData.max_capacity}
                                  onChange={(e) => setListingData({ ...listingData, max_capacity: e.target.value })}
                                  placeholder="e.g., 15"
                                  style={{ borderRadius: '12px', padding: '0.75rem' }}
                                />
                              </div>
            
                              <div>
                                <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                  Equipment Needed (Optional)
                                </Label>
                                <Input
                                  value={listingData.equipment_needed}
                                  onChange={(e) => setListingData({ ...listingData, equipment_needed: e.target.value })}
                                  placeholder="e.g., Comfortable clothes, water bottle"
                                  style={{ borderRadius: '12px', padding: '0.75rem' }}
                                />
                              </div>
            
                              <div>
                                <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                  Safety Notes (Optional)
                                </Label>
                                <textarea
                                  value={listingData.safety_notes}
                                  onChange={(e) => setListingData({ ...listingData, safety_notes: e.target.value })}
                                  placeholder="e.g., All equipment sanitized, CCTV monitored, trained safety personnel"
                                  rows={3}
                                  style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    padding: '0.75rem',
                                    border: '1px solid #E5E7EB',
                                    fontFamily: 'Outfit, sans-serif',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

            {step === 5 && (
                 <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <PlanOptionsBuilder plans={listingData.plan_options} onChange={(plans) => setListingData({ ...listingData, plan_options: plans })} />
                 </motion.div>
            )}

            {step === 6 && (
                 <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {hasFixedPlans && (
                        <BatchManager batches={listingData.batches} plans={listingData.plan_options.filter(p => p.timing_type === 'FIXED')} onChange={(batches) => setListingData({ ...listingData, batches: batches })} />
                    )}
                    {hasFlexiblePlans && (
                        <SessionSlotGenerator onChange={(config) => setSessionConfig(config)} />
                    )}
                 </motion.div>
            )}

           {step === 7 && (
                         <motion.div
                           key="step7"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                         >
                           <div style={{
                             background: '#F9FAFB',
                             padding: '1.5rem',
                             borderRadius: '16px',
                             marginBottom: '1rem'
                           }}>
                             <h3 style={{
                               fontSize: '1.25rem',
                               fontWeight: '700',
                               color: '#1E293B',
                               marginBottom: '1rem',
                               fontFamily: 'Outfit, sans-serif'
                             }}>{listingData.title}</h3>
                             <p style={{
                               fontSize: '1rem',
                               color: '#64748B',
                               marginBottom: '1rem',
                               fontFamily: 'Outfit, sans-serif'
                             }}>{listingData.description}</p>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                               <div>
                                 <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>Age Range</div>
                                 <div style={{ fontWeight: '600', color: '#1E293B' }}>{listingData.age_min}-{listingData.age_max} years</div>
                               </div>
                               <div>
                                 <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>Duration</div>
                                 <div style={{ fontWeight: '600', color: '#1E293B' }}>{listingData.duration_minutes} minutes</div>
                               </div>
                               <div>
                                 <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>Price</div>
                                 <div style={{ fontWeight: '600', color: '#1E293B' }}>₹{listingData.base_price_inr}</div>
                               </div>
                               {listingData.trial_available && (
                                 <div>
                                   <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>Trial Price</div>
                                   <div style={{ fontWeight: '600', color: '#1E293B' }}>₹{listingData.trial_price_inr}</div>
                                 </div>
                               )}
                             </div>
                             
                             {/* Summary of plans and batches */}
                             <div style={{ marginTop: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                 <span style={{ color: '#64748B' }}>Plans Created:</span>
                                 <span style={{ fontWeight: '600', color: '#1E293B' }}>{listingData.plan_options.length}</span>
                               </div>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                 <span style={{ color: '#64748B' }}>Batches Created:</span>
                                 <span style={{ fontWeight: '600', color: '#1E293B' }}>{listingData.batches.length}</span>
                               </div>
                             </div>
                           </div>
                         </motion.div>
                       )}

          </AnimatePresence>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '2px solid #f1f5f9'
          }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#64748B',
                  border: '2px solid #e2e8f0',
                  fontWeight: '600',
                  fontSize: '16px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-scale"
              style={{
                flex: 2,
                padding: '1rem',
                borderRadius: '12px',
                background: THEME_GRADIENT,
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : step === 7 ? (isEditMode ? 'Update Listing' : 'Publish Listing') : 'Continue'}
              {step < 4 && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileCreateListing;