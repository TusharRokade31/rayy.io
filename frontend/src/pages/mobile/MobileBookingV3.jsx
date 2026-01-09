import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import { 
  ArrowLeft, Calendar, Clock, Users, User, Info, AlertCircle,
  Check, Sparkles, Tag, CreditCard, Zap, TrendingUp, Award,
  MapPin, ChevronRight, CheckCircle2, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const MobileBookingV3 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showAuthModal } = useContext(AuthContext);
  
  const [bookingOptions, setBookingOptions] = useState(null);
  const [bookinglisting, setBookinglisting] = useState(null);
  const [batches, setBatches] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  
  // Simplified booking flow state
  const [bookingStep, setBookingStep] = useState(1); // 1: Plan Selection, 2: Batch/Sessions, 3: Child & Payment
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay_card');
  const [useCredits, setUseCredits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // For slot picker navigation

  useEffect(() => {
    fetchBookingOptions();
    if (user) fetchWallet();
  }, [id, user]);

  const fetchBookingOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/listings/${id}/booking-options`);
      
      // console.log('📊 Booking Options Response:', response.data);
      // console.log('📊 Response type:', typeof response.data);
      // console.log('📊 Is Array?:', Array.isArray(response.data));
      console.log('📊 Booking Options Response:', response.data);
      
      // Check if response is a Pydantic validation error
      if (response.data && response.data.detail && Array.isArray(response.data.detail)) {
        console.error('❌ Validation error from API:', response.data.detail);
        toast.error('Invalid booking configuration');
        setLoading(false);
        return;
      }

      
      // Validate response has required structure
      if (!response.data || !response.data.listing || !response.data.plan_options) {
        console.error('❌ Invalid response structure:', response.data);
        toast.error('Invalid booking data received');
        setLoading(false);
        return;
      }
      
      console.log('✅ Setting valid booking options');
      setBookingOptions(response.data.plan_options);
      setBookinglisting(response.data.listing);
      setBatches(response.data.batches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking options:', error);
      toast.error('Failed to load booking details');
      setLoading(false);
    }
  };

  // const fetchBatchSessions = async (batchId) => {
  //   try {
  //     const response = await axios.get(`${API}/listings/${id}/batches/${batchId}/sessions`);
  //     console.log('📊 Batch Sessions Response:', response.data);
      
  //     // Validate response structure
  //     if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
  //       if ('sessions' in response.data && Array.isArray(response.data.sessions)) {
  //         // CRITICAL: Filter out Pydantic error objects from sessions array
        
  //         setSessions(response.data.sessions);
  //       } else if (response.data.detail) {
  //         console.error('API validation error:', response.data.detail);
  //         setSessions([]);
  //         toast.error('No sessions available');
  //       } else {
  //         setSessions([]);
  //       }
  //     } else {
  //       setSessions([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching sessions:', error);
  //     setSessions([]);
  //     toast.error('Failed to load sessions');
  //   }
  // };

  const fetchAllSessions = async () => {
    try {
      // Fetch all sessions for the listing (90 day limit)
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(`${API}/listings/${id}/sessions`);

      console.log(response, "session ")
      
      // Validate response structure - defend against Pydantic errors
      if (response.data && typeof response.data === 'object') {
        if ('sessions' in response.data && Array.isArray(response.data.sessions)) {
          // CRITICAL: Filter out Pydantic error objects from sessions array
          const validSessions = response.data.sessions.filter(session => 
            session && 
            typeof session === 'object' && 
            (session.id || session._id) && 
            (session.date || session.start_at) &&
            !session.type && // Pydantic errors have 'type' property
            !session.loc &&  // Pydantic errors have 'loc' property
            !session.msg     // Pydantic errors have 'msg' property
          );
          setSessions(response.data.sessions);
          if (validSessions.length === 0 && response.data.sessions.length > 0) {
            console.warn('All sessions were invalid/error objects');
            toast.error('No valid sessions available');
          }
        } else if (response.data.detail) {
          console.error('API validation error:', response.data.detail);
          setSessions([]);
          toast.error('No sessions available for this listing');
        } else {
          setSessions([]);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
      toast.error('Failed to load available sessions');
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
      });
      // API returns {wallet: {...}, transactions: [...]}
      setWallet(response.data.wallet || response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWallet({ credits_balance: 0 }); // Set default if error
    }
  };

  const handlePlanSelect = (plan) => {
    console.log("handlePlanSelect,plan", plan);
    setSelectedPlan(plan);
    setSelectedBatch(null);
    setSelectedSessions([]);
    setSessions([]);
    setCurrentWeekOffset(0);
    
    // Check timing type to determine next step
    const timingType = plan.timing_type || 'FLEXIBLE';

    fetchAllSessions();
    
    if (timingType === 'FIXED') {
      // Fixed plans need batch selection
      setBookingStep(2); // Go to batch selection
    } else {
      // Flexible plans go straight to slot picker
      // Fetch all available sessions for ALL flexible plans (trial, single, weekly, monthly)
      fetchAllSessions();
      setBookingStep(2); // Go to session selection
    }
  };

  const handleBatchSelect = async (batch) => {
    console.log("handleBatchSelect", batch);
    setSelectedBatch(batch);
    setSelectedSessions([]);
    // await fetchBatchSessions(batch.id);
    
    // For fixed batches, auto-select all sessions and skip to confirmation
    // User doesn't pick individual sessions for fixed timing
    setBookingStep(3); // Go to child & payment
  };

  const handleSessionToggle = (session) => {
    const isSelected = selectedSessions.find(s => s.id === session.id);
    
    if (isSelected) {
      setSelectedSessions(selectedSessions.filter(s => s.id !== session.id));
    } else {
      if (selectedSessions.length >= selectedPlan.sessions_count) {
        toast.error(`You can only select ${selectedPlan.sessions_count} session(s) for this plan`);
        return;
      }
      setSelectedSessions([...selectedSessions, session]);
    }
  };

  const handleContinueToChild = () => {
    if (!user) {
      showAuthModal();
      return;
    }
    
    if (selectedSessions.length !== selectedPlan.sessions_count) {
      toast.error(`Please select exactly ${selectedPlan.sessions_count} session(s)`);
      return;
    }
    
    setBookingStep(3);
  };

  // Auto-select first child when user data loads on payment step
  useEffect(() => {
    if (user && bookingStep === 3 && !selectedChild && user.child_profiles && user.child_profiles.length > 0) {
      setSelectedChild(user.child_profiles[0]);
    }
  }, [user, bookingStep]);

  const handleChildSelect = (child) => {
    setSelectedChild(child);
  };

  const handleBooking = async () => {
    // Validation based on timing type
    if (!user || !selectedChild || !selectedPlan) {
      toast.error('Please complete all booking steps');
      return;
    }

    const isFixed = (selectedPlan.timing_type || 'FLEXIBLE') === 'FIXED';
    
    // For FIXED plans: Must have batch
    // For FLEXIBLE plans: Must have selected sessions
    if (isFixed && !selectedBatch) {
      toast.error('Please select a batch');
      return;
    }
    
    // if (!isFixed && selectedSessions.length === 0) {
    //   toast.error('Please select sessions');
    //   return;
    // }

    setSubmitting(true);
    try {
      const bookingData = {
        listing_id: id,
        plan_option_id: selectedPlan.id,
        batch_id: selectedBatch?.id || "",  // ✅ Empty string instead of null
        session_ids: selectedSessions.length > 0 ? selectedSessions.map(s => s.id) : [],
        child_profile_name: String(selectedChild.name),  // ✅ Ensure string
        child_profile_age: parseInt(selectedChild.age) || 0,  // ✅ Ensure integer
        payment_method: paymentMethod,
        use_credits: paymentMethod === 'credit_wallet'
      };

      console.log('📤 Sending booking data:', bookingData);

      await axios.post(`${API}/bookings/v2`, bookingData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
      });

      toast.success('🎉 Booking confirmed!');
      navigate('/mobile/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      
      // Extract error message safely - handle Pydantic error objects
      let errorMessage = 'Booking failed. Please try again.';
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if it's a Pydantic validation error array
        if (Array.isArray(errorData.detail)) {
          // Extract messages from validation error array
          errorMessage = errorData.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof errorData.detail === 'string') {
          // Simple string error
          errorMessage = errorData.detail;
        } else if (errorData.detail?.msg) {
          // Single Pydantic error object
          errorMessage = errorData.detail.msg;
        } else if (errorData.message) {
          // Alternative message field
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getPlanIcon = (planType) => {
    const icons = {
      trial: Zap,
      single: Calendar,
      weekly: TrendingUp,
      monthly: Award
    };
    return icons[planType] || Calendar;
  };

  const getPlanColor = (planType) => {
    const colors = {
      trial: 'orange',
      single: 'blue',
      weekly: 'green',
      monthly: 'purple'
    };
    return colors[planType] || 'gray';
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDays = (days) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends';
    }
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const price = selectedPlan.price_inr;
    const tax = price * (bookinglisting?.listing?.tax_percent || 18) / 100;
    let total = price + tax;
    
    if (useCredits && wallet) {
      const creditsToUse = Math.min(wallet.credits_balance, total);
      total -= creditsToUse;
    }
    
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking options...</p>
        </div>
      </div>
    );
  }

  // Validate bookingOptions is not an error object
  // if (!bookingOptions || !bookingOptions.listing || !bookingOptions.plan_options || bookingOptions.detail) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
  //       <div className="max-w-md mx-auto mt-8 text-center">
  //         <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //         <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Available</h2>
  //         <p className="text-gray-600 mb-4">
  //           {bookingOptions?.detail ? 'Invalid booking configuration' : 'This listing is not available for booking.'}
  //         </p>
  //         <button
  //           onClick={() => navigate(-1)}
  //           className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium"
  //         >
  //           Go Back
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // CRITICAL: Safe destructuring with default values to prevent undefined variables
  // const { 
  //   listing = {}, 
  //   plan_options = [], 
  //   // batches = [] 
  // } = bookingOptions || {};

  // Filter batches based on selected plan with comprehensive validation
  const availableBatches = selectedPlan && Array.isArray(batches)
    ? batches.filter(b => 
        b && 
        typeof b === 'object' && 
        b.plan_types && 
        Array.isArray(b.plan_types) &&
        b.plan_types.includes(selectedPlan.plan_type) && 
        !b.is_full &&
        !b.type && !b.loc && !b.msg  // Filter out Pydantic errors
      )
    : [];

    console.log(availableBatches, "availableBatches");

    console.log(selectedPlan, "below availableBatches");

  // CRITICAL: Wrap entire render in try-catch to prevent any render crashes
  try {
    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => bookingStep > 1 ? setBookingStep(bookingStep - 1) : navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{bookinglisting.title}</h1>
            <p className="text-sm text-gray-500">
              Step {bookingStep} of 3
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${(bookingStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Plan */}
          {bookingStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                <p className="text-gray-600">Select the plan that works best for you</p>
              </div>

              {!Array.isArray(bookingOptions) || bookingOptions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No plans available for this listing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingOptions.filter(plan => plan && plan.id).map((plan) => {
                    const Icon = getPlanIcon(plan.plan_type);
                    const color = getPlanColor(plan.plan_type);
                    
                    return (
                      <motion.button
                        key={plan.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlanSelect(plan)}
                        className={`
                          w-full bg-white rounded-2xl p-6 shadow-sm border-2
                          ${selectedPlan?.id === plan.id ? 'border-indigo-500' : 'border-gray-100'}
                          hover:shadow-md transition-all text-left
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-7 h-7 text-${color}-600`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                              {plan.discount_percent > 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  {plan.discount_percent}% OFF
                                </span>
                              )}
                            </div>
                            
                            {plan.description && (
                              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                            )}
                            
                            {/* Timing Type Badge */}
                            <div className="mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                (plan.timing_type || 'FLEXIBLE') === 'FIXED' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {(plan.timing_type || 'FLEXIBLE') === 'FIXED' ? 'Fixed Timing (Batch-based)' : 'Flexible Timing (Pick your slots)'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600 font-medium">
                                  {plan.sessions_count} session{plan.sessions_count > 1 ? 's' : ''}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                  {plan.validity_days} days
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-indigo-600">₹{plan.price_inr}</div>
                                <div className="text-xs text-gray-500">
                                  ₹{(plan.price_inr / plan.sessions_count).toFixed(0)}/session
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Batch Selection (FIXED) or Slot Picker (FLEXIBLE) */}
          {bookingStep === 2 && selectedPlan && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Selected Plan Summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    {React.createElement(getPlanIcon(selectedPlan.plan_type), { className: 'w-5 h-5 text-indigo-600' })}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{selectedPlan.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedPlan.sessions_count} sessions • ₹{selectedPlan.price_inr}
                    </div>
                  </div>
                </div>
              </div>

              {/* FIXED TIMING: Show Batch Selection */}
              
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Batch</h2>
                    <p className="text-gray-600">Fixed timing - Select a batch schedule</p>
                  </div>

                  {availableBatches.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No batches available</p>
                      <p className="text-sm text-gray-500">Please try a different plan</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableBatches.map((batch) => (
                        <motion.button
                          key={batch.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleBatchSelect(batch)}
                          className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all text-left"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{batch.name}</h3>
                              
                              <div className="space-y-1.5 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="font-medium">{formatDays(batch.days_of_week)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatTime(batch.time)} • {batch.duration_minutes} min</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>{batch.capacity - batch.enrolled_count} spots left</span>
                                </div>
                              </div>
                            </div>
                            
                            <ChevronRight className="w-6 h-6 text-gray-400 self-center" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              
            </motion.div>
          )}

          {/* STEP 3: Child Selection + Payment (Combined) */}
          {bookingStep === 3 && !user && (
            <motion.div
              key="step3-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 text-center shadow-sm"
            >
              <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">Please login to complete your booking</p>
              <button
                onClick={() => showAuthModal && showAuthModal()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Login to Continue
              </button>
            </motion.div>
          )}
          
          {bookingStep === 3 && user && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Booking</h2>
                <p className="text-gray-600">Select child and choose payment method</p>
              </div>

              {/* Booking Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    {React.createElement(getPlanIcon(selectedPlan.plan_type), { className: 'w-5 h-5 text-indigo-600' })}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{selectedPlan.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedPlan.sessions_count} sessions • {selectedPlan.timing_type === 'FIXED' ? 'Fixed Batch' : 'Flexible Timing'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">₹{selectedPlan.price_inr}</div>
                  </div>
                </div>

                {selectedBatch && (
                  <div className="pt-3 border-t border-indigo-200">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Selected Batch:</div>
                    <div className="text-sm font-medium text-gray-900">{selectedBatch.name}</div>
                    <div className="text-xs text-gray-600">{formatDays(selectedBatch.days_of_week)} • {formatTime(selectedBatch.time)}</div>
                  </div>
                )}

                {selectedSessions.length > 0 && (
                  <div className="pt-3 border-t border-indigo-200">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Selected Sessions:</div>
                    <div className="text-sm text-gray-900">{selectedSessions.length} session(s) selected</div>
                  </div>
                )}
              </div>

              {/* Child Selection (Mandatory) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Select Child
                  <span className="text-xs font-semibold text-red-600 ml-1">*Required</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">Who is this booking for?</p>

                {user.child_profiles && user.child_profiles.length > 0 ? (
                  <div className="space-y-2">
                    {user.child_profiles.map((child, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedChild(child)}
                        className={`w-full rounded-xl p-4 border-2 transition-all text-left ${
                          selectedChild?.name === child.name
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                            selectedChild?.name === child.name
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {child.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{child.name}</div>
                            <div className="text-sm text-gray-600">{child.age} years old</div>
                          </div>
                          {selectedChild?.name === child.name && (
                            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-3">No child profiles found</p>
                    <button
                      onClick={() => navigate('/mobile/child-profiles')}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Add Child Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan Price</span>
                    <span className="font-semibold text-gray-900">₹{selectedPlan.price_inr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax ({bookinglisting?.tax_percent || 18}%)</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(selectedPlan.price_inr * (bookinglisting?.tax_percent || 18) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Payment Method
                  <span className="text-xs font-semibold text-red-600 ml-1">*Required</span>
                </h3>

                {/* Wallet Balance Info */}
                {wallet && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Your Wallet Balance</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">₹{wallet.credits_balance || wallet.balance || 0}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Wallet Payment - Only if balance is sufficient */}
                  {wallet && wallet.credits_balance >= calculateTotal() ? (
                    <label className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'credit_wallet'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="credit_wallet"
                        checked={paymentMethod === 'credit_wallet'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-yellow-600"
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">Pay with Wallet</div>
                        <div className="text-sm text-gray-600">Balance: ₹{wallet.credits_balance}</div>
                      </div>
                      {paymentMethod === 'credit_wallet' && (
                        <CheckCircle2 className="w-6 h-6 text-yellow-600" />
                      )}
                    </label>
                  ) : (
                    /* Show Gateway Payment when wallet balance insufficient */
                    <label className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'razorpay_card'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay_card"
                        checked={paymentMethod === 'razorpay_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">Card / UPI / Net Banking</div>
                        <div className="text-sm text-gray-600">Pay securely via Razorpay</div>
                      </div>
                      {paymentMethod === 'razorpay_card' && (
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                      )}
                    </label>
                  )}

                  {/* Show info if wallet balance insufficient */}
                  {wallet && wallet.credits_balance < calculateTotal() && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <div className="font-semibold mb-1">Wallet balance insufficient</div>
                        <div>Your wallet balance (₹{wallet.credits_balance}) is less than the total amount (₹{calculateTotal().toFixed(2)}). Please use payment gateway.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Booking Button */}
              <button
                onClick={handleBooking}
                disabled={submitting || !selectedChild}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Confirm Booking • ₹{calculateTotal().toFixed(2)}</span>
                  </>
                )}
              </button>

              {!selectedChild && (
                <div className="text-center text-sm text-red-600 font-medium">
                  ⚠️ Please select a child to continue
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
  } catch (error) {
    console.error('MobileBookingV3 render error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading the booking page. Please try refreshing or go back.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
};

export default MobileBookingV3;
