import React, { useState } from 'react';
import { MapPin, Navigation, Wifi, X } from 'lucide-react';
import { Button } from './ui/button';

const LocationSheet = ({ isOpen, onClose, onLocationSet }) => {
  const [manualEntry, setManualEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [city, setCity] = useState('Gurgaon');

  if (!isOpen) return null;

  const handleGPS = () => {
    onLocationSet('gps');
    onClose();
  };

  const handleManual = () => {
    if (!pin || pin.length !== 6) {
      alert('Please enter a valid 6-digit PIN code');
      return;
    }
    onLocationSet('manual', { pin, city });
    onClose();
  };

  const handleOnline = () => {
    onLocationSet('online');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Set Your Location
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Find classes near you
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!manualEntry ? (
            <>
              {/* GPS Option */}
              <button
                onClick={handleGPS}
                className="w-full p-4 border-2 border-teal-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all flex items-center gap-4 text-left group"
              >
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Navigation className="h-6 w-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Use my location</div>
                  <div className="text-sm text-gray-500">Auto-detect using GPS</div>
                </div>
              </button>

              {/* Manual Option */}
              <button
                onClick={() => setManualEntry(true)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-4 text-left group"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <MapPin className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Enter area / PIN</div>
                  <div className="text-sm text-gray-500">Manually set location</div>
                </div>
              </button>

              {/* Online Only Option */}
              <button
                onClick={handleOnline}
                className="w-full p-4 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center gap-4 text-left group"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Wifi className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Online classes only</div>
                  <div className="text-sm text-gray-500">Skip location setting</div>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Manual Entry Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setManualEntry(false)}
                    className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleManual}
                    className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              🔒 We use your location only to show nearby classes. Stored on your device; you can remove anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSheet;
