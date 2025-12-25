import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, API } from '../../App';
import { 
  Sparkles, 
  MapPin, 
  Heart, 
  Calendar,
  User,
  Check,
  ChevronRight,
  Gift,
  Star,
  Zap,
  Navigation
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Memoized Welcome Screen Component
const WelcomeScreen = React.memo(({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
    >
      <Sparkles className="w-16 h-16 text-purple-600" />
    </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="text-4xl font-bold text-white text-center mb-4"
    >
      Welcome to rayy! 🎉
    </motion.h1>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-white/90 text-center text-lg mb-8 max-w-sm"
    >
      Let's personalize your experience and find the perfect classes for your child
    </motion.p>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mb-8 w-full max-w-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-white font-semibold">Welcome Gift</p>
          <p className="text-white/80 text-sm">₹50 credits added to your wallet!</p>
        </div>
      </div>
    </motion.div>

    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="w-full max-w-sm bg-white text-purple-600 py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2"
    >
      Let's Get Started
      <ChevronRight className="w-5 h-5" />
    </motion.button>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="text-white/70 text-sm mt-4"
    >
      Takes less than 2 minutes
    </motion.p>
  </motion.div>
));
WelcomeScreen.displayName = 'WelcomeScreen';

// Memoized Child Profile Screen Component
const ChildProfileScreen = React.memo(({ 
  childProfiles, 
  onUpdateChild, 
  onAddChild, 
  onRemoveChild, 
  onNext, 
  onBack 
}) => {
  const containerRef = React.useRef(null);
  
  // Auto-scroll when children array changes
  React.useEffect(() => {
    if (containerRef.current && childProfiles.length > 1) {
      // Scroll to show the newly added child and continue button
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [childProfiles.length]);
  
  return (
  <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 pt-16 overflow-y-auto">
    <div className="max-w-2xl mx-auto pb-20">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-600">Step 1 of 3</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your child 👶</h2>
        <p className="text-gray-600 mb-8">We'll find the perfect classes based on their age</p>

        <div className="space-y-4">
          {childProfiles.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Child {index + 1}</span>
                </div>
                {childProfiles.length > 1 && (
                  <button
                    onClick={() => onRemoveChild(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => onUpdateChild(index, 'name', e.target.value)}
                    placeholder="Enter child's name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={child.age}
                    onChange={(e) => onUpdateChild(index, 'age', e.target.value)}
                    placeholder="Age"
                    min="1"
                    max="18"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {childProfiles.length < 5 && (
          <button
            onClick={onAddChild}
            className="w-full mt-4 py-3 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 font-semibold hover:bg-purple-50 transition-all"
          >
            + Add Another Child
          </button>
        )}

        <button
          onClick={onNext}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  </div>
  );
});
ChildProfileScreen.displayName = 'ChildProfileScreen';

// Memoized Interests Screen Component
const InterestsScreen = React.memo(({ 
  categories, 
  selectedInterests, 
  onToggleInterest, 
  onNext, 
  onBack 
}) => (
  <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
    <div className="flex-1 flex flex-col p-6 pt-16 pb-6 overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-600">Step 2 of 3</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-shrink-0">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">What interests them? ✨</h2>
            <p className="text-gray-600 mb-6">Select categories (choose at least one)</p>
          </div>

          {/* Scrollable grid container - FIX FOR ISSUE #3 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
            <div className="grid grid-cols-2 gap-4 pb-4">
            {categories.map((category, index) => {
              const isSelected = selectedInterests.includes(category.id);
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleInterest(category.id)}
                  className={`relative overflow-hidden rounded-2xl p-5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br ' + category.gradient + ' shadow-xl scale-105'
                      : 'bg-white shadow-lg'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-purple-600" />
                    </motion.div>
                  )}
                  <div className={`text-4xl mb-2 ${isSelected ? 'scale-110' : ''} transition-transform`}>
                    {category.emoji}
                  </div>
                  <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {category.name}
                  </div>
                </motion.button>
              );
            })}
            </div>
          </div>

          <div className="flex gap-3 mt-6 flex-shrink-0">
            <button
              onClick={onBack}
              className="px-6 py-4 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700"
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={selectedInterests.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
));
InterestsScreen.displayName = 'InterestsScreen';

// Memoized Location Screen Component
const LocationScreen = React.memo(({ 
  location, 
  fetchingLocation, 
  loading, 
  onFetchLocation, 
  onLocationChange, 
  onNext, 
  onBack, 
  onSkip 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 pt-16 overflow-y-auto">
    <div className="max-w-2xl mx-auto pb-20">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-600">Step 3 of 3</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where are you located? 📍</h2>
        <p className="text-gray-600 mb-8">Find classes near you</p>

        {/* Auto-detect Location Button */}
        <button
          onClick={onFetchLocation}
          disabled={fetchingLocation}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
        >
          {fetchingLocation ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Detecting Location...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Use Current Location
            </>
          )}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-500">or enter manually</span>
          </div>
        </div>

        {/* Manual Location Input */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => onLocationChange('city', e.target.value)}
              placeholder="e.g., Mumbai, Delhi, Bangalore"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Area (Optional)</label>
            <input
              type="text"
              value={location.area}
              onChange={(e) => onLocationChange('area', e.target.value)}
              placeholder="e.g., Andheri, Indiranagar"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-4 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Finishing...
              </>
            ) : (
              <>
                Complete Setup
                <Star className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <button
          onClick={onSkip}
          className="w-full mt-4 text-gray-600 text-sm underline"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  </div>
));
LocationScreen.displayName = 'LocationScreen';

// Memoized Success Screen Component
const SuccessScreen = React.memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
    >
      <Check className="w-16 h-16 text-green-600" />
    </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="text-4xl font-bold text-white text-center mb-4"
    >
      All Set! 🎊
    </motion.h1>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-white/90 text-center text-lg mb-8 max-w-sm"
    >
      Your personalized experience is ready. Let's explore amazing classes!
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="flex items-center gap-2 text-white/90 text-sm"
    >
      <Zap className="w-4 h-4" />
      <span>Redirecting to home...</span>
    </motion.div>
  </motion.div>
));
SuccessScreen.displayName = 'SuccessScreen';

// Main Component
const MobileOnboardingV2 = ({ onComplete }) => {
  const { user, setUser, token } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [childProfiles, setChildProfiles] = useState([{ name: '', age: '' }]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [location, setLocation] = useState({
    city: '',
    area: '',
    lat: null,
    lng: null
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const categories = useMemo(() => [
    { id: 'art', name: 'Art & Craft', emoji: '🎨', gradient: 'from-pink-500 to-rose-500' },
    { id: 'dance', name: 'Dance', emoji: '💃', gradient: 'from-purple-500 to-pink-500' },
    { id: 'music', name: 'Music', emoji: '🎵', gradient: 'from-blue-500 to-purple-500' },
    { id: 'sports', name: 'Sports', emoji: '⚽', gradient: 'from-green-500 to-emerald-500' },
    { id: 'coding', name: 'Coding', emoji: '💻', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'martial-arts', name: 'Martial Arts', emoji: '🥋', gradient: 'from-orange-500 to-red-500' },
    { id: 'yoga', name: 'Yoga', emoji: '🧘', gradient: 'from-teal-500 to-green-500' },
    { id: 'swimming', name: 'Swimming', emoji: '🏊', gradient: 'from-blue-400 to-cyan-400' },
    { id: 'acting', name: 'Acting', emoji: '🎭', gradient: 'from-purple-400 to-pink-400' },
    { id: 'cooking', name: 'Cooking', emoji: '👨‍🍳', gradient: 'from-yellow-500 to-orange-500' },
  ], []);

  // Stable callbacks with correct dependencies - FIX FOR ISSUE #1
  const fetchLocation = useCallback(async () => {
    setFetchingLocation(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              
              const city = response.data.address.city || 
                          response.data.address.town || 
                          response.data.address.village ||
                          response.data.address.state_district ||
                          'Your Location';
              
              const area = response.data.address.suburb || 
                          response.data.address.neighbourhood ||
                          response.data.address.road ||
                          '';
              
              setLocation({
                city,
                area,
                lat: latitude,
                lng: longitude
              });
              
              toast.success(`Location detected: ${city}`);
            } catch (error) {
              console.error('Geocoding error:', error);
              setLocation(prev => ({ ...prev, lat: latitude, lng: longitude }));
            }
            setFetchingLocation(false);
          },
          (error) => {
            console.error('Location error:', error);
            toast.error('Please enter your location manually');
            setFetchingLocation(false);
          }
        );
      } else {
        toast.error('Location not supported on this device');
        setFetchingLocation(false);
      }
    } catch (error) {
      console.error('Location error:', error);
      setFetchingLocation(false);
    }
  }, []);

  const handleLocationChange = useCallback((field, value) => {
    setLocation(prev => ({ ...prev, [field]: value }));
  }, []);

  const addChild = useCallback(() => {
    setChildProfiles(prev => {
      if (prev.length < 5) {
        // Scroll to bottom after adding child
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
        return [...prev, { name: '', age: '' }];
      }
      return prev;
    });
  }, []);

  const removeChild = useCallback((index) => {
    setChildProfiles(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const updateChild = useCallback((index, field, value) => {
    setChildProfiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const toggleInterest = useCallback((categoryId) => {
    setSelectedInterests(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const handleChildNext = useCallback(() => {
    const validChildren = childProfiles.filter(c => c.name && c.age);
    if (validChildren.length === 0) {
      toast.error('Please add at least one child');
      return;
    }
    setStep(2);
  }, [childProfiles]);

  const handleInterestsNext = useCallback(() => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    setStep(3);
  }, [selectedInterests]);

  const completeOnboarding = useCallback(async () => {
    setLoading(true);
    try {
      const validChildren = childProfiles.filter(c => c.name && c.age);
      for (const child of validChildren) {
        await axios.post(`${API}/auth/add-child`, child, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await axios.put(
        `${API}/auth/update-profile`,
        {
          onboarding_complete: true,
          interests: selectedInterests,
          location: location.city,
          area: location.area,
          coordinates: location.lat && location.lng ? {
            lat: location.lat,
            lng: location.lng
          } : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(prev => ({ ...prev, onboarding_complete: true }));

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setStep(4);
      
      setTimeout(() => {
        onComplete();
      }, 3000);

    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [childProfiles, selectedInterests, location, token, setUser, onComplete]);

  const handleLocationNext = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <AnimatePresence mode="wait">
        {step === 0 && <WelcomeScreen key="welcome" onNext={() => setStep(1)} />}
        {step === 1 && (
          <ChildProfileScreen 
            key="child"
            childProfiles={childProfiles}
            onUpdateChild={updateChild}
            onAddChild={addChild}
            onRemoveChild={removeChild}
            onNext={handleChildNext}
          />
        )}
        {step === 2 && (
          <InterestsScreen 
            key="interests"
            categories={categories}
            selectedInterests={selectedInterests}
            onToggleInterest={toggleInterest}
            onNext={handleInterestsNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <LocationScreen 
            key="location"
            location={location}
            fetchingLocation={fetchingLocation}
            loading={loading}
            onFetchLocation={fetchLocation}
            onLocationChange={handleLocationChange}
            onNext={handleLocationNext}
            onBack={() => setStep(2)}
            onSkip={handleLocationNext}
          />
        )}
        {step === 4 && <SuccessScreen key="success" />}
      </AnimatePresence>
    </div>
  );
};

export default MobileOnboardingV2;
