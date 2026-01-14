import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, API } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent } from './ui/dialog';
import { Plus, X, Sparkles, Gift, CheckCircle2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getErrorMessage } from '../utils/errorHandler';

const CustomerOnboarding = ({ onComplete }) => {
  const { user, setUser, token } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [childProfiles, setChildProfiles] = useState([{ name: '', age: '', dob: '' }]);
  const [preferences, setPreferences] = useState({
    interests: [],
    location: '',
    city: '',
    notification_preferences: {
      email: true,
      whatsapp: false
    }
  });
  const [recommendedClasses, setRecommendedClasses] = useState([]);

  const interests = [
    { id: 'art', name: 'Art & Craft', emoji: '🎨' },
    { id: 'dance', name: 'Dance', emoji: '💃' },
    { id: 'coding', name: 'Coding & STEM', emoji: '💻' },
    { id: 'fitness', name: 'Fitness', emoji: '💪' },
    { id: 'martial', name: 'Martial Arts', emoji: '🥋' },
    { id: 'music', name: 'Music', emoji: '🎵' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'drama', name: 'Drama & Theater', emoji: '🎭' }
  ];

  const addChildProfile = () => {
    setChildProfiles([...childProfiles, { name: '', age: '', dob: '' }]);
  };

  const removeChildProfile = (index) => {
    if (childProfiles.length > 1) {
      setChildProfiles(childProfiles.filter((_, i) => i !== index));
    }
  };

  const updateChildProfile = (index, field, value) => {
    const updated = [...childProfiles];
    updated[index][field] = value;
    
    // Auto-calculate age from DOB
    if (field === 'dob' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      updated[index].age = age.toString();
    }
    
    setChildProfiles(updated);
  };

  const toggleInterest = (interestId) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate child profiles
      const validProfiles = childProfiles.filter(p => p.name && p.age);
      if (validProfiles.length === 0) {
        toast.error('Please add at least one child profile');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate interests
      if (preferences.interests.length === 0) {
        toast.error('Please select at least one interest');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Location step - optional, can skip
      setStep(4);
      // Fetch recommended classes based on interests
      await fetchRecommendedClasses();
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      await completeOnboarding();
    }
  };

  const fetchRecommendedClasses = async () => {
    try {
      const response = await axios.get(`${API}/search?limit=3`);
      setRecommendedClasses(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      // Get token from context or localStorage
      const authToken = token || localStorage.getItem('yuno_token');
      
      if (!authToken) {
        toast.error('Authentication failed. Please login again.');
        setLoading(false);
        return;
      }
      
      // Update user profile with child profiles
      await axios.put(
        `${API}/users/me`,
        {
          child_profiles: childProfiles.filter(p => p.name && p.age),
          preferences: preferences
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Activate wallet with bonus credits
      await axios.post(
        `${API}/wallet/activate`,
        { bonus_credits: 10 },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('🎉 Welcome to rayy! You got 10 bonus credits!');
      
      // Update user context with refreshed data
      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(userResponse.data);

      setTimeout(() => {
        onComplete();
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Onboarding error:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 422) {
        toast.error('Please check all required fields');
      } else if (error.response?.data?.detail) {
        toast.error(getErrorMessage(error, 'Failed to save profile'));
      } else {
        toast.error('Failed to complete onboarding. Please try again.');
      }
    } finally {
      setLoading(false);
    }
   };

  const handleSkip = () => {
    toast('You can complete your profile anytime from settings');
    onComplete();
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        style={{
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
          maxHeight: '90vh'
        }}
        // hideClose={true}
      >
        {/* Progress Bar */}
        <div style={{
          height: '6px',
          background: '#f1f5f9',
          position: 'relative'
        }}>
          <motion.div
            initial={{ width: '20%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </div>

        <div style={{ padding: '2.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 6px)' }}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Child Profiles */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👶</div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Tell us about your child</h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748B',
                    fontFamily: 'Outfit, sans-serif'
                  }}>We'll recommend classes perfect for their age</p>
                </div>

                {childProfiles.map((profile, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)',
                      padding: '1.5rem',
                      borderRadius: '16px',
                      marginBottom: '1rem',
                      position: 'relative'
                    }}
                  >
                    {childProfiles.length > 1 && (
                      <button
                        onClick={() => removeChildProfile(index)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <X size={16} color="#64748B" />
                      </button>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Child's Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => updateChildProfile(index, 'name', e.target.value)}
                        placeholder="e.g., Aarav"
                        style={{
                          marginTop: '0.5rem',
                          fontFamily: 'Outfit, sans-serif',
                          borderRadius: '12px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Date of Birth</Label>
                        <Input
                          type="date"
                          value={profile.dob}
                          onChange={(e) => updateChildProfile(index, 'dob', e.target.value)}
                          style={{
                            marginTop: '0.5rem',
                            fontFamily: 'Outfit, sans-serif',
                            borderRadius: '12px'
                          }}
                        />
                      </div>
                      <div>
                        <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Age</Label>
                        <Input
                          value={profile.age}
                          readOnly
                          placeholder="Auto-filled"
                          style={{
                            marginTop: '0.5rem',
                            fontFamily: 'Outfit, sans-serif',
                            borderRadius: '12px',
                            background: '#f1f5f9'
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={addChildProfile}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#3B82F6',
                    border: '2px dashed #3B82F6',
                    fontWeight: '600',
                    fontSize: '15px',
                    fontFamily: 'Outfit, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}
                >
                  <Plus size={20} />
                  Add Another Child
                </button>
              </motion.div>
            )}

            {/* STEP 2: Interests */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>What interests your child?</h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748B',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Select all that apply (you can change this later)</p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  {interests.map((interest) => (
                    <motion.div
                      key={interest.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleInterest(interest.id)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '16px',
                        background: preferences.interests.includes(interest.id)
                          ? 'linear-gradient(135deg, #6EE7B715 0%, #3B82F615 100%)'
                          : '#F9FAFB',
                        border: preferences.interests.includes(interest.id)
                          ? '2px solid #6EE7B7'
                          : '2px solid #e2e8f0',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {preferences.interests.includes(interest.id) && (
                        <CheckCircle2
                          size={20}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            color: '#6EE7B7'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{interest.emoji}</div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1E293B',
                        fontFamily: 'Outfit, sans-serif'
                      }}>{interest.name}</div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Your Location</Label>
                  <Input
                    value={preferences.location}
                    onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                    placeholder="e.g., Sector 29, Gurgaon"
                    style={{
                      marginTop: '0.5rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px'
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Location Setup */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Set your location</h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748B',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Find classes near you for easy commute</p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)',
                  padding: '2rem',
                  borderRadius: '16px'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '600', color: '#475569' }}>
                      City
                    </Label>
                    <Input
                      placeholder="e.g., Bangalore, Mumbai, Delhi"
                      value={preferences.city}
                      onChange={(e) => setPreferences(prev => ({ ...prev, city: e.target.value }))}
                      style={{
                        padding: '0.75rem',
                        fontSize: '1rem',
                        fontFamily: 'Outfit, sans-serif',
                        borderRadius: '12px'
                      }}
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setPreferences(prev => ({ 
                              ...prev, 
                              location: `${position.coords.latitude},${position.coords.longitude}`,
                              city: 'Location detected'
                            }));
                            toast.success('Location detected!');
                          },
                          () => {
                            toast.error('Unable to detect location');
                          }
                        );
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: 'white',
                      border: '2px dashed #3B82F6',
                      borderRadius: '12px',
                      color: '#3B82F6',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '0.95rem'
                    }}
                  >
                    📍 Use Current Location
                  </button>

                  <button
                    onClick={() => setStep(4)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '0.9rem',
                      marginTop: '0.75rem'
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Class Recommendations */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Classes picked for you</h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748B',
                    fontFamily: 'Outfit, sans-serif'
                  }}>Based on your interests, here are our top picks</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recommendedClasses.length > 0 ? (
                    recommendedClasses.map((listing, index) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                          background: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '16px',
                          padding: '1rem',
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          backgroundImage: listing.media?.[0] ? `url(${listing.media[0]})` : 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#1E293B',
                            marginBottom: '0.25rem',
                            fontFamily: 'Outfit, sans-serif'
                          }}>
                            {listing.title}
                          </h4>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#64748B',
                            marginBottom: '0.5rem',
                            fontFamily: 'Outfit, sans-serif'
                          }}>
                            {listing.category}
                          </p>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#3B82F6'
                          }}>
                            Starting at ₹{listing.trial_price_inr || listing.base_price_inr}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                      Loading recommendations...
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#F0F9FF',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#0369A1',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '500'
                  }}>
                    💡 You can explore more classes after setup
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Bonus Credits */}
            {step === 5 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{ fontSize: '5rem', marginBottom: '1rem' }}
                  >
                    🎁
                  </motion.div>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '1rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>You're all set!</h2>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, #FBBF2415 0%, #F472B615 100%)',
                    padding: '2rem',
                    borderRadius: '20px',
                    marginBottom: '2rem',
                    border: '2px solid #FBBF2430'
                  }}>
                    <Sparkles size={32} style={{ color: '#FBBF24', margin: '0 auto 1rem' }} />
                    <div style={{
                      fontSize: '3rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #FBBF24 0%, #F472B6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '0.5rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}>10 Bonus Credits</div>
                    <p style={{
                      fontSize: '1.1rem',
                      color: '#64748B',
                      fontFamily: 'Outfit, sans-serif'
                    }}>Use them to book your first trial class!</p>
                  </div>

                  <div style={{
                    background: '#F9FAFB',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    textAlign: 'left'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#1E293B',
                      marginBottom: '1rem',
                      fontFamily: 'Outfit, sans-serif'
                    }}>What's Next?</h3>
                    <ul style={{ paddingLeft: '1.5rem', color: '#64748B', fontFamily: 'Outfit, sans-serif' }}>
                      <li style={{ marginBottom: '0.5rem' }}>Browse trial sessions starting at ₹99</li>
                      <li style={{ marginBottom: '0.5rem' }}>Book a class in 3 taps</li>
                      <li style={{ marginBottom: '0.5rem' }}>Get reminders before each session</li>
                      <li>Leave reviews and earn more credits!</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            {step > 1 && step < 3 && (
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
            
            {step < 3 && (
              <button
                onClick={handleSkip}
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: '#64748B',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                Skip for now
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-scale"
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Completing...' : step === 5 ? 'Start Exploring' : 'Continue'}
              {step < 3 && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOnboarding;
