/**
 * Performance optimization configuration for mobile apps
 */

export const PERFORMANCE_CONFIG = {
  // Listing limits per section
  MAX_LISTINGS_PER_SECTION: 10,
  MAX_CATEGORY_ITEMS: 8,
  MAX_TRENDING_ITEMS: 12,
  
  // Video settings
  VIDEO_PRELOAD: 'none', // Don't preload videos
  VIDEO_LAZY_THRESHOLD: 0.5, // Load when 50% visible
  VIDEO_UNLOAD_ON_EXIT: true, // Unload when scrolled away
  
  // Image settings
  IMAGE_LAZY_LOADING: true,
  IMAGE_QUALITY: 80, // For future image optimization
  
  // API settings
  API_TIMEOUT: 10000, // 10 seconds
  API_RETRY_COUNT: 2,
  
  // Cache settings
  CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  
  // Debounce settings
  SEARCH_DEBOUNCE: 300, // ms
  SCROLL_DEBOUNCE: 100, // ms
};

export default PERFORMANCE_CONFIG;
