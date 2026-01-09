import React, { useState, useEffect, Suspense, lazy } from 'react';
// import './App.css';
import "./index.css";
// import './styles/ui-improvements.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import LoadingFallback from './components/LoadingFallback';

// Eagerly load critical components
import HomeRebuild from './pages/HomeRebuild';
import AuthModal from './components/AuthModal';
import CustomerOnboarding from './components/CustomerOnboarding';
import MobileOnboardingV2 from './components/mobile/MobileOnboardingV2';
import PartnerOnboarding from './components/PartnerOnboardingEnhanced';
import PartnerOnboardingWizard from './components/PartnerOnboardingWizard';
import LocationSheet from './components/LocationSheet';
import ModernLocationSheet from './components/mobile/ModernLocationSheet';
import ModernAuthModalV2 from './components/mobile/ModernAuthModalV2';
import InstallPrompt from './components/InstallPrompt';
import ScrollToTop from './components/ScrollToTop';
import AIAdvisor from './components/AIAdvisor';
import MobileDetector from './components/MobileDetector';
import MobileRedirect from './components/MobileRedirect';

// Lazy load non-critical pages
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MyInvoices = lazy(() => import('./pages/MyInvoices'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Profile = lazy(() => import('./pages/Profile'));
const AccountDashboard = lazy(() => import('./pages/AccountDashboard'));

// Partner Landing
const PartnerLanding = lazy(() => import('./pages/PartnerLanding'));

// Lazy load partner pages
const PartnerDashboard = lazy(() => import('./pages/partner/Dashboard'));
const PartnerAnalyticsDashboard = lazy(() => import('./pages/partner/PartnerAnalyticsDashboard'));
const PartnerCustomers = lazy(() => import('./pages/partner/PartnerCustomers'));
const PartnerInvoices = lazy(() => import('./pages/partner/PartnerInvoices'));
const PartnerProfile = lazy(() => import('./pages/partner/PartnerProfile'));
const PartnerListingsManager = lazy(() => import('./pages/partner/ListingsManager'));
const ListingCreationWizard = lazy(() => import('./pages/partner/ListingCreationWizard'));
const SessionScheduler = lazy(() => import('./pages/partner/SessionScheduler'));
const PartnerBookings = lazy(() => import('./pages/partner/BookingManager'));
const PartnerFinancials = lazy(() => import('./pages/partner/Financials'));
const VenueManager = lazy(() => import('./pages/partner/VenueManager'));
const VenueManagerV2 = lazy(() => import('./pages/partner/VenueManagerV2'));
const PartnerProfileEdit = lazy(() => import('./pages/partner/PartnerProfileEdit'));
const PartnerBusinessDetails = lazy(() => import('./pages/partner/PartnerBusinessDetails'));
const PartnerSettings = lazy(() => import('./pages/partner/PartnerSettings'));

// Lazy load admin pages - New Comprehensive Admin Panel
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminFinancials = lazy(() => import('./pages/admin/AdminFinancials'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const BookingsManager = lazy(() => import('./pages/admin/BookingsManager'));
const BadgeManager = lazy(() => import('./pages/admin/BadgeManager'));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'));
const ConfigEditor = lazy(() => import('./pages/admin/ConfigEditor'));
const AdminCreateListing = lazy(() => import('./pages/admin/AdminCreateListing'));

// Lazy load mobile pages
const MobileHome = lazy(() => import('./pages/mobile/MobileHome'));
const MobileWishlistV2 = lazy(() => import('./pages/mobile/MobileWishlistV2'));
const MobileBookingsV2 = lazy(() => import('./pages/mobile/MobileBookingsV2'));
const MobileProfileV2 = lazy(() => import('./pages/mobile/MobileProfileV2'));
const MobileLeaderboard = lazy(() => import('./pages/mobile/MobileLeaderboard'));
const MobileListingV2 = lazy(() => import('./pages/mobile/MobileListingV2'));
const MobileBookingV3 = lazy(() => import('./pages/mobile/MobileBookingV3'));
const MobileSearch = lazy(() => import('./pages/mobile/MobileSearch'));
const MobileChat = lazy(() => import('./pages/mobile/MobileChat'));
const MobileLearningJourney = lazy(() => import('./pages/mobile/MobileLearningJourney'));
const MobileEditProfile = lazy(() => import('./pages/mobile/MobileEditProfile'));
const MobileChildProfiles = lazy(() => import('./pages/mobile/MobileChildProfiles'));
const MobileSettings = lazy(() => import('./pages/mobile/MobileSettingsV2'));
const MobileBecomePartner = lazy(() => import('./pages/mobile/MobileBecomePartner'));
const MobileAdminListings = lazy(() => import('./pages/mobile/MobileAdminListings'));
const MobileWallet = lazy(() => import('./pages/mobile/MobileWallet'));
const MobileTerms = lazy(() => import('./pages/mobile/MobileTerms'));
const MobilePrivacy = lazy(() => import('./pages/mobile/MobilePrivacy'));
const MobileHelpCenter = lazy(() => import('./pages/mobile/MobileHelpCenter'));

// Lazy load mobile partner pages
const MobilePartnerDashboard = lazy(() => import('./pages/mobile/partner/MobilePartnerDashboard'));
const MobilePartnerListings = lazy(() => import('./pages/mobile/partner/MobilePartnerListings'));
const MobilePartnerBookings = lazy(() => import('./pages/mobile/partner/MobilePartnerBookings'));
const MobilePartnerProfile = lazy(() => import('./pages/mobile/partner/MobilePartnerProfile'));
const MobilePartnerAnalytics = lazy(() => import('./pages/mobile/partner/MobilePartnerAnalytics'));
const MobileCreateListing = lazy(() => import('./pages/mobile/partner/MobileCreateListing'));

// Lazy load mobile admin pages
const MobileAdminDashboard = lazy(() => import('./pages/mobile/admin/MobileAdminDashboard'));
const MobileAdminUsers = lazy(() => import('./pages/mobile/admin/MobileAdminUsers'));
const MobileAdminPartners = lazy(() => import('./pages/mobile/admin/MobileAdminPartners'));
const MobileAdminListingsV2 = lazy(() => import('./pages/mobile/admin/MobileAdminListingsV2'));
const MobileAdminSettings = lazy(() => import('./pages/mobile/admin/MobileAdminSettings'));

// Lazy load footer pages
const About = lazy(() => import('./pages/About'));
const Careers = lazy(() => import('./pages/Careers'));
const Blog = lazy(() => import('./pages/Blog'));
const Press = lazy(() => import('./pages/Press'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Safety = lazy(() => import('./pages/Safety'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Support = lazy(() => import('./pages/Support'));
const VendorTerms = lazy(() => import('./pages/VendorTerms'));
const ListStudio = lazy(() => import('./pages/ListStudio'));
const Resources = lazy(() => import('./pages/Resources'));
const FAQ = lazy(() => import('./pages/FAQ'));

import { useLocationPref } from './hooks/useLocationPref';
import { registerServiceWorker } from './utils/pwa';
import CapacitorService from './services/capacitor';
import { setupAccessibilityObserver } from './utils/accessibilityFix';
import { API_URL } from './config/runtime';

export const API = API_URL;

export const AuthContext = React.createContext();

function App() {
  // CRITICAL FIX: Initialize user from localStorage to preserve role across app reopens
  const getInitialUser = () => {
    const cachedUser = localStorage.getItem('yuno_user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        console.error('Failed to parse cached user:', e);
        return null;
      }
    }
    return null;
  };
  
  const [user, setUser] = useState(getInitialUser());
  const [token, setToken] = useState(localStorage.getItem('yuno_token'));
  const [loading, setLoading] = useState(true); // Add loading state to prevent race condition
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('customer'); // 'customer' or 'partner'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingType, setOnboardingType] = useState(null); // 'customer' or 'partner'
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const { loc, ask, setManualLocation, setOnlineOnly, saveToProfile } = useLocationPref();

  useEffect(() => {
    console.log('🔍 App Mount - Initial State:', {
      hasToken: !!token,
      initialUser: user ? { role: user.role, onboarding_complete: user.onboarding_complete } : null
    });
    
    if (token) {
      fetchUser();
    } else {
      setLoading(false); // No token, no need to fetch user
    }
  }, [token]);

  // Handle Google OAuth callback
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        // Extract session_id from URL fragment
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');
        
        if (sessionId) {
          try {
            setLoading(true);
            
            // Call backend to validate session
            const response = await axios.post(
              `${API}/auth/google/session`,
              {},
              {
                headers: { 'X-Session-ID': sessionId }
              }
            );
            
            // Login with the received token
            login(response.data.access_token, response.data.user, response.data.is_new_user);
            
            // Clean URL fragment
            window.history.replaceState(null, '', window.location.pathname);
            
            setLoading(false);
          } catch (error) {
            console.error('Google auth error:', error);
            setLoading(false);
            // Optionally show error toast
          }
        }
      }
    };
    
    handleGoogleCallback();
  }, []);

  // Register Service Worker for PWA
  useEffect(() => {
    registerServiceWorker();
    
    // Setup accessibility enhancements
    const accessibilityObserver = setupAccessibilityObserver();
    
    // Add skip to main content link
    // import('./utils/accessibility').then(({ addSkipLink }) => {
    //   addSkipLink();
    // });
    
    // Initialize Capacitor native features
    if (CapacitorService.isNative()) {
      // Hide splash screen after app loads
      setTimeout(() => {
        CapacitorService.hideSplashScreen();
      }, 1000);
      
      // Set status bar style
      // CapacitorService.setStatusBarStyle('light');
      // CapacitorService.setStatusBarColor('#3B82F6');
      
      // Add app lifecycle listeners
      CapacitorService.addAppListeners({
        onStateChange: (isActive) => {
          // App state changed
        },
        onUrlOpen: (url) => {
          // Handle deep links here
        }
      });
    }
    
    // Cleanup
    return () => {
      if (accessibilityObserver) accessibilityObserver.disconnect();
    };
  }, []);

  // Show location sheet on first visit if location not set (but not on partner or mobile pages)
  useEffect(() => {
    // Don't show during initial loading phase
    if (loading) return;
    
    const locationPromptShown = localStorage.getItem('rrray_location_prompt_shown');
    const isPartnerPage = window.location.pathname.includes('/partner');
    const isMobilePage = window.location.pathname.startsWith('/mobile');
    const isHomePage = window.location.pathname === '/';
    
    // Only show on desktop home page after loading is complete
    if (!locationPromptShown && !loc && !isPartnerPage && !isMobilePage && isHomePage && !CapacitorService.isNative()) {
      // Add a small delay to ensure page has fully rendered
      const timer = setTimeout(() => {
        setShowLocationSheet(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loc, loading]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout to prevent freezing
      });
      
      console.log('🔍 FetchUser API Response:', {
        role: response.data.role,
        onboarding_complete: response.data.onboarding_complete
      });
      
      setUser(response.data);
      // Update localStorage with fresh data
      localStorage.setItem('yuno_user', JSON.stringify(response.data));
      setLoading(false); // User data loaded, safe to render routes
    } catch (e) {
      console.error('Failed to fetch user:', e.message);
      
      // CRITICAL FIX: Try to restore user from localStorage before logging out
      const cachedUser = localStorage.getItem('yuno_user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.warn('API failed - using cached user data:', userData.role);
          setUser(userData);
          setLoading(false);
          return; // Don't logout, use cached data
        } catch (parseError) {
          console.error('Failed to parse cached user:', parseError);
        }
      }
      
      // If it's a timeout or network error, don't logout immediately
      if (e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK') {
        console.warn('Network issue - will retry on next app open');
        setUser(null); // Clear user but keep token for retry
      } else {
        // Invalid token or other auth errors - logout
        logout();
      }
      setLoading(false); // Stop loading regardless of error
    }
  };

  const login = (newToken, userData, isNewUser = false, skipOnboarding = false) => {
    console.log('🔍 Login Function Called:', {
      isNewUser,
      userRole: userData.role,
      onboarding_complete: userData.onboarding_complete,
      skipOnboarding
    });

    localStorage.setItem('yuno_token', newToken);
    localStorage.setItem('yuno_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setShowAuth(false);

    const isPartner = userData.role === 'partner_owner' || userData.role === 'partner_staff';
    const isCustomer = userData.role === 'customer';

    console.log('🔍 Role-based routing:', { 
      role: userData.role, 
      isPartner, 
      isCustomer,
      currentPath: window.location.pathname 
    });

    // ✅ Redirect partners to dashboard ONLY when:
    // - onboarding is already complete, OR
    // - this was a pure login (not a new signup), OR
    // - onboarding was explicitly skipped
    if (
      isPartner &&
      !window.location.pathname.includes('/partner') &&
      (userData.onboarding_complete === true || !isNewUser || skipOnboarding)
    ) {
      console.log('✅ Redirecting partner to dashboard');
      setTimeout(() => { window.location.href = '/mobile/partner/dashboard'; }, 100);
    }

    // ✅ Trigger onboarding ONLY for brand new users whose onboarding is not complete,
    // and only when we did NOT skip onboarding.
    if (isNewUser === true && !userData.onboarding_complete && !skipOnboarding) {
      const type = isCustomer ? 'customer' : 'partner';
      console.log('✅ TRIGGERING ONBOARDING FOR NEW USER:', type);
      setOnboardingType(type);
      setShowOnboarding(true);
    } else {
      console.log('❌ ONBOARDING NOT TRIGGERED:', {
        isNewUser,
        onboarding_complete: userData.onboarding_complete,
        skipOnboarding
      });
    }
  };

  const completeOnboarding = async () => {
    try {
      // Call backend to mark onboarding as complete
      await axios.post(`${API}/auth/complete-onboarding`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
    
    setShowOnboarding(false);
    setOnboardingType(null);
    // Refresh user data
    fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('yuno_token');
    localStorage.removeItem('yuno_user'); // Clear stored user data
    setToken(null);
    setUser(null);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      login,
      logout,
      showAuth: (mode = 'customer') => { setAuthMode(mode); setShowAuth(true); },
      showAuthModal: (mode = 'customer') => { setAuthMode(mode); setShowAuth(true); },
      location: loc,
      setLocation: setShowLocationSheet,
      setShowAuth:setShowAuth
    }}>
      <div className="App">
        <BrowserRouter>
          <ScrollToTop />
          <MobileDetector />
          <MobileRedirect />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomeRebuild />} />
              
              {/* Mobile Partner Routes - MUST come FIRST to avoid route conflicts */}
              <Route path="/mobile/partner/dashboard" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobilePartnerDashboard /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/listings" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobilePartnerListings /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/listings/create" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobileCreateListing /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/listings/edit/:id" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobileCreateListing /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/bookings" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobilePartnerBookings /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/analytics" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobilePartnerAnalytics /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/partner/profile" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <MobilePartnerProfile /> : <Navigate to="/mobile" />} />
              
              {/* Mobile Admin Routes */}
              <Route path="/mobile/admin/dashboard" element={user?.role === 'admin' ? <MobileAdminDashboard /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/admin/users" element={user?.role === 'admin' ? <MobileAdminUsers /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/admin/partners" element={user?.role === 'admin' ? <MobileAdminPartners /> : <Navigate to="/mobile" />} />
              <Route path="/mobile/admin/listings" element={user?.role === 'admin' ? <MobileAdminListingsV2 /> : <MobileAdminListings />} />
              <Route path="/mobile/admin/settings" element={user?.role === 'admin' ? <MobileAdminSettings /> : <Navigate to="/mobile" />} />
              
              {/* Mobile Customer/General Routes - Come AFTER specific partner/admin routes */}
              <Route path="/mobile" element={<MobileHome />} />
              <Route path="/mobile/home" element={<MobileHome />} />
              <Route path="/mobile/search" element={<MobileSearch />} />
              <Route path="/mobile/listing/:id" element={<MobileListingV2 />} />
              <Route path="/mobile/booking/:id" element={<MobileBookingV3 />} />
              <Route path="/mobile/chat/:teacherId" element={<MobileChat />} />
              <Route path="/mobile/learning-journey" element={<MobileLearningJourney />} />
              <Route path="/mobile/wishlist" element={<MobileWishlistV2 />} />
              <Route path="/mobile/bookings" element={<MobileBookingsV2 />} />
              <Route path="/mobile/profile" element={<MobileProfileV2 />} />
              <Route path="/mobile/edit-profile" element={<MobileEditProfile />} />
              <Route path="/mobile/child-profiles" element={<MobileChildProfiles />} />
              <Route path="/mobile/settings" element={<MobileSettings />} />
              <Route path="/mobile/become-partner" element={<MobileBecomePartner />} />
              <Route path="/mobile/wallet" element={<MobileWallet />} />
              <Route path="/mobile/terms" element={<MobileTerms />} />
              <Route path="/mobile/privacy" element={<MobilePrivacy />} />
              <Route path="/mobile/help" element={<MobileHelpCenter />} />
              <Route path="/mobile/leaderboard" element={<MobileLeaderboard />} />
              
              <Route path="/partner-landing" element={<PartnerLanding />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/checkout/:sessionId" element={user ? <Checkout /> : <Navigate to="/" />} />
              <Route path="/checkout/plan/:listingId/:planId" element={user ? <Checkout /> : <Navigate to="/" />} />
              <Route path="/dashboard" element={user?.role === 'customer' ? <AccountDashboard /> : <Navigate to="/" />} />
              <Route path="/bookings" element={user ? <MyBookings /> : <Navigate to="/" />} />
              <Route path="/invoices" element={user ? <MyInvoices /> : <Navigate to="/" />} />
              <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
            
            {/* Partner Routes */}
            <Route path="/partner" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <Navigate to="/partner/dashboard" /> : <HomeRebuild />} />
            <Route path="/partner/signup" element={<HomeRebuild />} />
            <Route path="/partner/onboarding" element={user?.role === 'partner_owner' ? <PartnerProfile /> : <Navigate to="/" />} />
            <Route path="/partner/profile" element={user?.role === 'partner_owner' ? <PartnerProfile /> : <Navigate to="/" />} />
            <Route path="/partner/dashboard" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerDashboard /> : <Navigate to="/" />} />
            <Route path="/partner/analytics" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerAnalyticsDashboard /> : <Navigate to="/" />} />
            <Route path="/partner/customers" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerCustomers /> : <Navigate to="/" />} />
            <Route path="/partner/invoices" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerInvoices /> : <Navigate to="/" />} />
            <Route path="/partner/listings" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerListingsManager /> : <Navigate to="/" />} />
            <Route path="/partner/listings/new" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <ListingCreationWizard /> : <Navigate to="/" />} />
            <Route path="/partner/listings/edit/:id" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <ListingCreationWizard /> : <Navigate to="/" />} />
            <Route path="/partner/sessions" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <SessionScheduler /> : <Navigate to="/" />} />
            <Route path="/partner/bookings" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerBookings /> : <Navigate to="/" />} />
            <Route path="/partner/financials" element={user?.role === 'partner_owner' || user?.role === 'partner_staff' ? <PartnerFinancials /> : <Navigate to="/" />} />
            <Route path="/partner/venues" element={user?.role === 'partner_owner' ? <VenueManagerV2 /> : <Navigate to="/" />} />
            <Route path="/partner/profile/edit" element={user?.role === 'partner_owner' ? <PartnerProfileEdit /> : <Navigate to="/" />} />
            <Route path="/partner/profile/business" element={user?.role === 'partner_owner' ? <PartnerBusinessDetails /> : <Navigate to="/" />} />
            <Route path="/partner/profile/settings" element={user?.role === 'partner_owner' ? <PartnerSettings /> : <Navigate to="/" />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/admin/financials" element={user?.role === 'admin' ? <AdminFinancials /> : <Navigate to="/" />} />
            <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/" />} />
            <Route path="/admin/partners" element={user?.role === 'admin' ? <AdminPartners /> : <Navigate to="/" />} />
            <Route path="/admin/analytics" element={user?.role === 'admin' ? <AnalyticsDashboard /> : <Navigate to="/" />} />
            <Route path="/admin/bookings" element={user?.role === 'admin' ? <BookingsManager /> : <Navigate to="/" />} />
            <Route path="/admin/badges" element={user?.role === 'admin' ? <BadgeManager /> : <Navigate to="/" />} />
            <Route path="/admin/invoices" element={user?.role === 'admin' ? <AdminInvoices /> : <Navigate to="/" />} />
            <Route path="/admin/create-listing" element={user?.role === 'admin' ? <AdminCreateListing /> : <Navigate to="/" />} />
            <Route path="/admin/config" element={user?.role === 'admin' ? <ConfigEditor /> : <Navigate to="/" />} />
            
            {/* Footer Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/press" element={<Press />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/vendor-terms" element={<VendorTerms />} />
            <Route path="/list-studio" element={<ListStudio />} />
            <Route path="/partner/login" element={<PartnerLanding />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
          </Suspense>
          
          {/* AI Advisor Chatbot - Persistent across all pages */}
          <AIAdvisor />
          
          {showAuth && (
            CapacitorService.isNative() || window.innerWidth <= 768 ? (
              <ModernAuthModalV2 
                isOpen={showAuth}
                mode="customer"  // MOBILE: Customer login only, no partner access
                onClose={() => setShowAuth(false)}
                onSuccess={login}
                allowModeToggle={false}  // MOBILE: Disable partner toggle completely
              />
            ) : (
              <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />
            )
          )}
           {/* {showAuth &&  (
              <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />
            )
          } */}
        </BrowserRouter>
        
        {/* Location Sheet */}
        {showLocationSheet && (
          CapacitorService.isNative() ? (
            <ModernLocationSheet
              isOpen={showLocationSheet}
              onClose={() => {
                setShowLocationSheet(false);
                localStorage.setItem('rrray_location_prompt_shown', 'true');
              }}
              onLocationSet={(method, data) => {
                if (method === 'gps') {
                  ask();
                } else if (method === 'manual') {
                  setManualLocation(data.pin, data.city);
                } else if (method === 'online') {
                  setOnlineOnly();
                }
                
                // Save to user profile if logged in
                if (token) {
                  setTimeout(() => saveToProfile(token), 500);
                }
                
                localStorage.setItem('rrray_location_prompt_shown', 'true');
              }}
            />
          ) : (
            <LocationSheet
              isOpen={showLocationSheet}
              onClose={() => {
                setShowLocationSheet(false);
                localStorage.setItem('rrray_location_prompt_shown', 'true');
              }}
              onLocationSet={(method, data) => {
                if (method === 'gps') {
                  ask();
                } else if (method === 'manual') {
                  setManualLocation(data.pin, data.city);
                } else if (method === 'online') {
                  setOnlineOnly();
                }
                
                // Save to user profile if logged in
                if (token) {
                  setTimeout(() => saveToProfile(token), 500);
                }
                
                localStorage.setItem('rrray_location_prompt_shown', 'true');
              }}
            />
          )
        )}
        
        {/* Onboarding Modals */}
        {showOnboarding && onboardingType === 'customer' && (
          window.innerWidth <= 768 ? (
            <MobileOnboardingV2 onComplete={completeOnboarding} />
          ) : (
            <CustomerOnboarding onComplete={completeOnboarding} />
          )
        )}
        {(() => {
          console.log('🔍 Onboarding Render Check:', {
            showOnboarding,
            onboardingType,
            shouldShowPartner: showOnboarding && onboardingType === 'partner'
          });
          return null;
        })()}
        {/* Partner Onboarding: Desktop only - hidden for mobile release */}
        {/* {showOnboarding && onboardingType === 'partner' && window.innerWidth > 768 && (
          <PartnerOnboardingWizard onComplete={completeOnboarding} />
        )} */}
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
