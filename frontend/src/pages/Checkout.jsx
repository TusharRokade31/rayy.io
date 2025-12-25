import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { CreditCard, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

const Checkout = () => {
  const { sessionId, listingId, planId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  // Get session IDs from URL query params for plan bookings
  const [searchParams] = new URLSearchParams(window.location.search);
  const sessionIdsParam = new URLSearchParams(window.location.search).get('sessions');
  const sessionIds = sessionIdsParam ? sessionIdsParam.split(',') : [];
  
  // Determine if this is a plan booking or single session booking
  const isPlanBooking = !!(listingId && planId);
  
  const [session, setSession] = useState(null);
  const [selectedSessionsData, setSelectedSessionsData] = useState([]);
  const [listing, setListing] = useState(null);
  const [plan, setPlan] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay_card');
  const [useCredits, setUseCredits] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialEligibility, setTrialEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sessionId, listingId, planId]);

  const fetchData = async () => {
    try {
      if (isPlanBooking) {
        // Plan booking flow
        const listingResp = await axios.get(`${API}/listings/${listingId}`);
        setListing(listingResp.data);
        
        // Get plans
        const plansResp = await axios.get(`${API}/listings/${listingId}/plans`);
        const selectedPlan = plansResp.data.plans.find(p => p.id === planId);
        setPlan(selectedPlan);
        setIsTrial(selectedPlan?.is_trial || false);
        
        // Fetch selected sessions details
        if (sessionIds.length > 0) {
          const sessionsPromises = sessionIds.map(id => 
            axios.get(`${API}/sessions/${id}`).then(r => r.data.session)
          );
          const sessionsData = await Promise.all(sessionsPromises);
          setSelectedSessionsData(sessionsData);
        }
        
        if (selectedPlan?.is_trial) {
          await checkTrialEligibility(listingId);
        }
      } else {
        // Single session booking flow
        const sessionResp = await axios.get(`${API}/sessions/${sessionId}`);
        const sess = sessionResp.data.session;
        setSession(sess);

        const listingResp = await axios.get(`${API}/listings/${sess.listing_id}`);
        setListing(listingResp.data);
        
        if (listingResp.data.trial_available) {
          await checkTrialEligibility(sess.listing_id);
        }
      }
      
      // Get wallet
      const walletResp = await axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(walletResp.data.wallet);

      // Set default child if available
      if (user.child_profiles && user.child_profiles.length > 0) {
        setSelectedChild(user.child_profiles[0]);
      }
      
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      toast.error('Failed to load checkout data');
    }
    setLoading(false);
  };
  
  const checkTrialEligibility = async (listingId) => {
    try {
      const response = await axios.get(`${API}/trial-eligibility/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrialEligibility(response.data);
    } catch (error) {
      console.error('Trial eligibility check failed:', error);
      setTrialEligibility({ eligible: false, reason: 'Unable to check eligibility' });
    }
  };

  const handleBooking = async () => {
    if (!selectedChild) {
      toast.error('Please select a child');
      return;
    }
    
    // Validate trial selection
    if (isTrial && !trialEligibility?.eligible) {
      toast.error(trialEligibility?.reason || 'Trial not available');
      return;
    }

    setBooking(true);
    try {
      if (isPlanBooking) {
        // Plan booking
        const response = await axios.post(`${API}/bookings/plan`, {
          listing_id: listingId,
          plan_id: planId,
          session_ids: sessionIds,
          child_profile_name: selectedChild.name,
          child_profile_age: selectedChild.age,
          payment_method: useCredits ? 'credit_wallet' : paymentMethod,
          use_credits: useCredits
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success(`🎉 ${response.data.sessions_count} sessions booked successfully!`);
        navigate('/bookings');
      } else {
        // Single session booking
        const response = await axios.post(`${API}/bookings`, {
          session_id: sessionId,
          child_profile_name: selectedChild.name,
          child_profile_age: selectedChild.age,
          payment_method: useCredits ? 'credit_wallet' : paymentMethod,
          use_credits: useCredits,
          is_trial: isTrial
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success(isTrial ? '🎉 Trial class booked!' : 'Booking confirmed!');
        navigate('/bookings');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Booking failed'));
    }
    setBooking(false);
  };

  if (loading || (!session && !plan) || !listing) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
        <Navbar />
        <div data-testid="loading-state" style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  // Calculate pricing based on plan or session
  let unitPrice, taxes, total, creditCost, displayTitle, displayDescription;
  
  if (isPlanBooking && plan) {
    unitPrice = plan.price_inr;
    taxes = unitPrice * ((listing?.tax_percent || 0) / 100);
    total = unitPrice + taxes;
    creditCost = Math.ceil(total); // 1 credit = ₹1 (includes taxes)
    displayTitle = plan.name;
    displayDescription = `${plan.sessions_count} sessions - ${plan.description}`;
  } else {
    const basePrice = session?.price_inr || session?.price_override_inr || listing?.base_price_inr || 0;
    const trialPrice = listing?.trial_price_inr || 0;
    unitPrice = isTrial ? trialPrice : basePrice;
    taxes = unitPrice * ((listing?.tax_percent || 0) / 100);
    total = unitPrice + taxes;
    creditCost = Math.ceil(total); // 1 credit = ₹1 (includes taxes)
    displayTitle = listing?.title || 'Session Booking';
    displayDescription = 'Single session';
  }

  return (
    <div data-testid="checkout-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%)' }}>
      <Navbar />

      <div className="checkout-page-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '2rem',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#1e293b'
        }}>Complete Your Booking</h1>

        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Left - Form */}
          <div>
            {/* Session/Plan Details */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                {isPlanBooking ? 'Plan Details' : 'Session Details'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'start', gap: '1.5rem' }}>
                {listing.media && listing.media[0] && (
                  <img 
                    src={`${listing.media[0]}?w=120&h=120&fit=crop`} 
                    alt={`${listing.title} class thumbnail`}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }} 
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{listing.title}</h3>
                  
                  {isPlanBooking && plan ? (
                    <>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#06b6d4', marginBottom: '0.5rem' }}>
                        {plan.name}
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.75rem' }}>
                        {plan.description}
                      </p>
                      <div style={{
                        display: 'inline-block',
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        {plan.sessions_count} sessions included
                        {plan.discount_percent > 0 && ` • ${plan.discount_percent}% OFF`}
                      </div>
                      
                      {/* Show selected sessions */}
                      {selectedSessionsData.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                            Selected Sessions:
                          </div>
                          {selectedSessionsData.map((sess, idx) => (
                            <div key={sess.id} style={{
                              fontSize: '13px',
                              color: '#64748b',
                              padding: '0.5rem',
                              background: '#f8fafc',
                              borderRadius: '6px',
                              marginBottom: '0.25rem'
                            }}>
                              {idx + 1}. {format(parseISO(sess.start_at), 'EEE, MMM dd')} at {format(parseISO(sess.start_at), 'h:mm a')}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : session?.start_at ? (
                    <>
                      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.75rem' }}>
                        {format(parseISO(session.start_at), 'EEEE, MMMM dd, yyyy')}
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#06b6d4' }}>
                        {format(parseISO(session.start_at), 'h:mm a')}
                        {session.end_at && ` - ${format(parseISO(session.end_at), 'h:mm a')}`}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Details loading...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Child Selection */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>Select Child</h2>
              {user.child_profiles && user.child_profiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {user.child_profiles.map((child, idx) => (
                    <div
                      key={idx}
                      data-testid={`child-option-${idx}`}
                      onClick={() => setSelectedChild(child)}
                      style={{
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        border: selectedChild === child ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedChild === child ? '#f0f9ff' : 'white'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{child.name}</div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>Age {child.age}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: '#fef2f2', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ color: '#991b1b', marginBottom: '1rem' }}>No children added to your profile</p>
                  <button onClick={() => navigate('/profile')} style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px'
                  }}>Add Child in Profile</button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>Payment Method</h2>
              
              {/* Credits Option */}
              {wallet && wallet.balance >= creditCost && (
                <div
                  data-testid="payment-credits"
                  onClick={() => setUseCredits(true)}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: useCredits ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    background: useCredits ? '#ecfeff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Wallet size={24} style={{ color: '#06b6d4' }} />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Pay with rayy Credits</div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.25rem' }}>Use {creditCost} credits (Balance: {wallet.balance})</div>
                      </div>
                    </div>
                    {useCredits && <CheckCircle size={24} style={{ color: '#06b6d4' }} />}
                  </div>
                </div>
              )}
              
              {/* Low Balance Warning */}
              {wallet && wallet.balance < creditCost && wallet.balance > 0 && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    Insufficient credits. Your balance: {wallet.balance}. <button onClick={() => navigate('/wallet')} style={{ color: '#06b6d4', fontWeight: '600', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Buy Credits</button>
                  </div>
                </div>
              )}

              {/* Card/UPI Option */}
              <div
                data-testid="payment-card"
                onClick={() => setUseCredits(false)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: !useCredits ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  background: !useCredits ? '#f0f9ff' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CreditCard size={24} style={{ color: '#06b6d4' }} />
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Card / UPI</div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.25rem' }}>Pay ₹{total.toFixed(2)}</div>
                    </div>
                  </div>
                  {!useCredits && <CheckCircle size={24} style={{ color: '#06b6d4' }} />}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary */}
          <div>
            <div style={{
              position: 'sticky',
              top: '100px',
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>Order Summary</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Show discount info for plans */}
                {isPlanBooking && plan && plan.discount_percent > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>Original Price</span>
                      <span style={{ fontWeight: '600', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{(listing.base_price_inr * plan.sessions_count).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>Discount ({plan.discount_percent}% OFF)</span>
                      <span style={{ fontWeight: '700', color: '#10b981' }}>-₹{plan.savings_inr.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#64748b' }}>
                    {isPlanBooking && plan ? `${plan.sessions_count} Sessions` : 'Base Price'}
                  </span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{unitPrice}</span>
                </div>
                
                {!useCredits && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#64748b' }}>GST ({listing.tax_percent || 0}%)</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{taxes.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div style={{
                paddingTop: '1.5rem',
                borderTop: '2px solid #e2e8f0',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Total</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#06b6d4' }}>
                    {useCredits ? `${creditCost} Credits` : `₹${total.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <button
                data-testid="confirm-booking-button"
                onClick={handleBooking}
                disabled={booking || !selectedChild}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '17px',
                  boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
                }}
              >
                {booking ? 'Processing...' : 'Confirm Booking'}
              </button>

              <p style={{
                fontSize: '13px',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '1rem',
                lineHeight: '1.5'
              }}>
                By confirming, you agree to our cancellation policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
