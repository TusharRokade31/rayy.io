import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Globe, X } from 'lucide-react';

const ModernLocationSheet = ({ isOpen, onClose, onLocationSet }) => {
  const [step, setStep] = useState(1); // 1: choose method, 2: manual entry
  const [pin, setPin] = useState('');
  const [city, setCity] = useState('Gurgaon');

  if (!isOpen) return null;

  const handleGPS = () => {
    onLocationSet('gps');
    onClose();
  };

  const handleManual = () => {
    if (!pin || pin.length !== 6) {
      return;
    }
    onLocationSet('manual', { pin, city });
    onClose();
  };

  const handleOnline = () => {
    onLocationSet('online');
    onClose();
  };

  const locationOptions = [
    {
      icon: Navigation,
      title: 'Use my location',
      subtitle: 'Auto-detect using GPS',
      color: 'from-blue-400 to-cyan-400',
      action: handleGPS
    },
    {
      icon: MapPin,
      title: 'Enter area / PIN',
      subtitle: 'Manually set location',
      color: 'from-purple-400 to-pink-400',
      action: () => setStep(2)
    },
    {
      icon: Globe,
      title: 'Online classes only',
      subtitle: 'Skip location setting',
      color: 'from-emerald-400 to-teal-400',
      action: handleOnline
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        >
          {step === 1 ? (
            <>
              {/* Compact Header */}
              <div className="relative px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Set Your Location
                </h2>
                <p className="text-sm text-gray-600">
                  Find classes near you
                </p>
              </div>

              {/* Minimal Options */}
              <div className="p-4 space-y-2">
                {locationOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileTap={{ scale: 0.97 }}
                      onClick={option.action}
                      className="w-full group relative overflow-hidden rounded-2xl"
                    >
                      <div className="relative flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-all">
                        <div className={`w-10 h-10 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {option.title}
                          </h3>
                          <p className="text-xs text-gray-500">{option.subtitle}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Info Note */}
              <div className="px-6 pb-6 pt-2">
                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <span>🔒</span> We use your location only to show nearby classes. You can change this anytime.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry - Compact */}
              <div className="px-6 py-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <button
                  onClick={() => setStep(1)}
                  className="mb-3 text-purple-600 font-semibold text-sm flex items-center gap-1"
                >
                  ← Back
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Enter Your Area
                </h2>
                <p className="text-sm text-gray-600">
                  We&apos;ll find classes near you
                </p>
              </div>

              <div className="p-6 space-y-3">
                {/* PIN Code Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN"
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                  />
                </div>

                {/* City Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name"
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleManual}
                  disabled={pin.length !== 6}
                  className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
                    pin.length === 6
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continue
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernLocationSheet;
