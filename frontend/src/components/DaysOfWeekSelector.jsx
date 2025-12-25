import React from 'react';
import { motion } from 'framer-motion';

const DaysOfWeekSelector = ({ selectedDays = [], onChange, disabled = false }) => {
  const days = [
    { short: 'Mon', full: 'monday', emoji: '🌟' },
    { short: 'Tue', full: 'tuesday', emoji: '🔥' },
    { short: 'Wed', full: 'wednesday', emoji: '⚡' },
    { short: 'Thu', full: 'thursday', emoji: '🎯' },
    { short: 'Fri', full: 'friday', emoji: '🚀' },
    { short: 'Sat', full: 'saturday', emoji: '🌈' },
    { short: 'Sun', full: 'sunday', emoji: '☀️' }
  ];

  const toggleDay = (dayFull) => {
    if (disabled) return;
    
    if (selectedDays.includes(dayFull)) {
      onChange(selectedDays.filter(d => d !== dayFull));
    } else {
      onChange([...selectedDays, dayFull]);
    }
  };

  const selectWeekdays = () => {
    if (disabled) return;
    onChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectWeekend = () => {
    if (disabled) return;
    onChange(['saturday', 'sunday']);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectWeekdays}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={selectWeekend}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          Weekend
        </button>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          All Days
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = selectedDays.includes(day.full);
          
          return (
            <motion.button
              key={day.full}
              type="button"
              onClick={() => toggleDay(day.full)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              className={`
                relative p-3 rounded-xl border-2 transition-all
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-center">
                <div className="text-xl mb-1">{day.emoji}</div>
                <div className={`text-xs font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {day.short}
                </div>
              </div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Days Summary */}
      {selectedDays.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium text-indigo-700">{selectedDays.length} day(s)</span>
        </div>
      )}
    </div>
  );
};

export default DaysOfWeekSelector;
