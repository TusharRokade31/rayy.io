import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { useLocationPref } from '../../hooks/useLocationPref';

const SearchBar = () => {
  const navigate = useNavigate();
  const { loc, setLocation } = useContext(AuthContext);
  const [showAgeFilter, setShowAgeFilter] = useState(false);
  const [selectedAge, setSelectedAge] = useState(null);

  const ageBands = [
    { label: '1-3', value: '1-3', emoji: '🍼' },
    { label: '4-6', value: '4-6', emoji: '👦🏽' },
    { label: '7-12', value: '7-12', emoji: '🧑🏻\u200d💻' },
    { label: '13-18', value: '13-18', emoji: '🧘🏻\u200d♀️' },
    { label: '19-49', value: '19-49', emoji: '💼' },
    { label: '50+', value: '50-999', emoji: '👴' }
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedAge) params.append('age', selectedAge);
    navigate(`/mobile/search?${params.toString()}`);
  };

  const handleLocationClick = () => {
    if (setLocation) {
      setLocation(true);
    }
  };

  return (
    <div className="px-4 py-3 bg-white">
      {/* Main Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          
          <div className="flex-1" onClick={handleSearch}>
            <input
              type="text"
              placeholder="Search activities, classes..."
              className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 bg-transparent outline-none"
              onFocus={handleSearch}
              readOnly
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-100 pt-3">
          {/* Age Filter */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAgeFilter(!showAgeFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              selectedAge
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            {selectedAge ? `Age: ${selectedAge}` : 'Age'}
          </motion.button>

          {/* Location Filter */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLocationClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              loc?.city
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {loc?.city || 'Location'}
          </motion.button>
        </div>
      </motion.div>

      {/* Age Filter Dropdown */}
      {showAgeFilter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-3"
        >
          <div className="grid grid-cols-3 gap-2">
            {ageBands.map((band) => (
              <motion.button
                key={band.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAge(band.value);
                  setShowAgeFilter(false);
                }}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all ${
                  selectedAge === band.value
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl mb-1">{band.emoji}</span>
                <span className="text-xs font-semibold">{band.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchBar;
