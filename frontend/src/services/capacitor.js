// Capacitor Native Services - Unified API for native features
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

// Check if running natively
export const isNative = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform(); // 'ios', 'android', 'web'
};

// ============ PUSH NOTIFICATIONS ============
export const initPushNotifications = async () => {
  if (!isNative()) {
    console.log('Push notifications only available on native platforms');
    return null;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive === 'granted') {
      // Register with Apple / Google
      await PushNotifications.register();
      console.log('✅ Push notifications enabled');
      return true;
    } else {
      console.log('❌ Push notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Push notification setup failed:', error);
    return false;
  }
};

export const addPushListeners = (callbacks) => {
  if (!isNative()) return;

  // Registration success
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token:', token.value);
    callbacks?.onRegistration?.(token.value);
  });

  // Registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
    callbacks?.onError?.(error);
  });

  // Notification received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    callbacks?.onReceived?.(notification);
  });

  // Notification tapped (app in background/closed)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification);
    callbacks?.onTapped?.(notification);
  });
};

// ============ CAMERA ============
export const takePhoto = async (options = {}) => {
  try {
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      ...options
    });

    return {
      success: true,
      imageUrl: image.webPath,
      format: image.format,
      dataUrl: image.dataUrl
    };
  } catch (error) {
    console.error('Camera error:', error);
    return { success: false, error: error.message };
  }
};

export const pickImage = async (options = {}) => {
  try {
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      ...options
    });

    return {
      success: true,
      imageUrl: image.webPath,
      format: image.format,
      dataUrl: image.dataUrl
    };
  } catch (error) {
    console.error('Photo picker error:', error);
    return { success: false, error: error.message };
  }
};

// ============ GEOLOCATION ============
export const getCurrentPosition = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return {
      success: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return { success: false, error: error.message };
  }
};

export const watchPosition = (callback) => {
  return Geolocation.watchPosition({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }, (position, error) => {
    if (error) {
      callback({ success: false, error: error.message });
    } else {
      callback({
        success: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    }
  });
};

export const clearWatch = async (watchId) => {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }
};

// ============ APP LIFECYCLE ============
export const addAppListeners = (callbacks) => {
  // App state changes
  App.addListener('appStateChange', (state) => {
    console.log('App state changed:', state.isActive ? 'active' : 'background');
    callbacks?.onStateChange?.(state.isActive);
  });

  // Deep links / URL opens
  App.addListener('appUrlOpen', (data) => {
    console.log('App opened from URL:', data.url);
    callbacks?.onUrlOpen?.(data.url);
  });

  // Back button (Android)
  App.addListener('backButton', (data) => {
    if (data.canGoBack) {
      window.history.back();
    } else {
      callbacks?.onBackButton?.();
    }
  });
};

export const exitApp = () => {
  App.exitApp();
};

// ============ SPLASH SCREEN ============
export const hideSplashScreen = async () => {
  if (isNative()) {
    await SplashScreen.hide();
  }
};

export const showSplashScreen = async () => {
  if (isNative()) {
    await SplashScreen.show();
  }
};

// ============ HAPTICS ============
export const hapticImpact = async (style = 'medium') => {
  if (!isNative()) return;
  
  const styleMap = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy
  };

  await Haptics.impact({ style: styleMap[style] || ImpactStyle.Medium });
};

export const hapticVibrate = async (duration = 100) => {
  if (!isNative()) return;
  await Haptics.vibrate({ duration });
};

export const hapticNotification = async (type = 'success') => {
  if (!isNative()) return;
  // Type: 'success', 'warning', 'error'
  await Haptics.notification({ type });
};

// ============ STATUS BAR ============
export const setStatusBarStyle = async (style = 'light') => {
  if (!isNative()) return;
  
  await StatusBar.setStyle({ 
    style: style === 'light' ? Style.Light : Style.Dark 
  });
};

export const setStatusBarColor = async (color) => {
  if (!isNative() || getPlatform() !== 'android') return;
  await StatusBar.setBackgroundColor({ color });
};

export const hideStatusBar = async () => {
  if (!isNative()) return;
  await StatusBar.hide();
};

export const showStatusBar = async () => {
  if (!isNative()) return;
  await StatusBar.show();
};

// ============ PERMISSIONS ============
export const checkPermissions = async (type) => {
  try {
    switch(type) {
      case 'camera':
        return await Camera.checkPermissions();
      case 'location':
        return await Geolocation.checkPermissions();
      case 'push':
        return await PushNotifications.checkPermissions();
      default:
        return null;
    }
  } catch (error) {
    console.error(`Permission check failed for ${type}:`, error);
    return null;
  }
};

export const requestPermissions = async (type) => {
  try {
    switch(type) {
      case 'camera':
        return await Camera.requestPermissions();
      case 'location':
        return await Geolocation.requestPermissions();
      case 'push':
        return await PushNotifications.requestPermissions();
      default:
        return null;
    }
  } catch (error) {
    console.error(`Permission request failed for ${type}:`, error);
    return null;
  }
};

// ============ UTILITY ============
export const getDeviceInfo = () => {
  return {
    platform: getPlatform(),
    isNative: isNative(),
    isIOS: getPlatform() === 'ios',
    isAndroid: getPlatform() === 'android',
    isWeb: getPlatform() === 'web'
  };
};

export default {
  isNative,
  getPlatform,
  getDeviceInfo,
  
  // Push Notifications
  initPushNotifications,
  addPushListeners,
  
  // Camera
  takePhoto,
  pickImage,
  
  // Geolocation
  getCurrentPosition,
  watchPosition,
  clearWatch,
  
  // App
  addAppListeners,
  exitApp,
  
  // Splash Screen
  hideSplashScreen,
  showSplashScreen,
  
  // Haptics
  hapticImpact,
  hapticVibrate,
  hapticNotification,
  
  // Status Bar
  setStatusBarStyle,
  setStatusBarColor,
  hideStatusBar,
  showStatusBar,
  
  // Permissions
  checkPermissions,
  requestPermissions
};
