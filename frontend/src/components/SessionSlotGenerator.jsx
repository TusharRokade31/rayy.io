import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Clock, Repeat, 
  X, CheckCircle2, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';

const SessionSlotGenerator = ({ onChange, initialData }) => {
  // State ported from SessionScheduler's bulkData
  const [bulkData, setBulkData] = useState({
    start_date: '',
    end_date: '',
    days: [], // ['monday', 'wednesday', 'friday']
    time_slots: [{ time: '10:00', seats: 10 }],
    duration_minutes: 60
  });

  // Pre-fill if data exists
  useEffect(() => {
    if (initialData) {
      setBulkData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // --- Logic ported from SessionScheduler ---

  const addTimeSlot = () => {
    setBulkData({
      ...bulkData,
      time_slots: [...bulkData.time_slots, { time: '10:00', seats: 10 }]
    });
  };

  const removeTimeSlot = (index) => {
    if (bulkData.time_slots.length > 1) {
      setBulkData({
        ...bulkData,
        time_slots: bulkData.time_slots.filter((_, i) => i !== index)
      });
    }
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...bulkData.time_slots];
    updated[index][field] = value;
    setBulkData({ ...bulkData, time_slots: updated });
  };

  const toggleDay = (day) => {
    setBulkData({
      ...bulkData,
      days: bulkData.days.includes(day)
        ? bulkData.days.filter(d => d !== day)
        : [...bulkData.days, day]
    });
  };

  const handleGenerate = () => {
    // Validation Logic from SessionScheduler
    if (!bulkData.start_date) {
      toast.error('Please select a start date');
      return;
    }
    
    if (!bulkData.end_date) {
      toast.error('Please select an end date');
      return;
    }
    
    if (bulkData.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    
    // Validate each time slot
    for (let i = 0; i < bulkData.time_slots.length; i++) {
      const slot = bulkData.time_slots[i];
      if (!slot.time) {
        toast.error(`Please set time for slot ${i + 1}`);
        return;
      }
      if (!slot.seats || parseInt(slot.seats) <= 0) {
        toast.error(`Please set valid seats for slot ${i + 1}`);
        return;
      }
    }

    // Format payload for parent component
    const generatedSessions = {
      start_date: bulkData.start_date,
      end_date: bulkData.end_date,
      days: bulkData.days,
      duration_minutes: parseInt(bulkData.duration_minutes) || 60,
      time_slots: bulkData.time_slots.map(slot => ({
        time: slot.time,
        seats: parseInt(slot.seats, 10) || 10
      }))
    };

    onChange(generatedSessions);
    toast.success("Availability configuration set successfully!");
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#1E293B',
          fontFamily: 'Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar className="w-5 h-5 text-indigo-600" />
          Flexible Availability
        </h3>
        <p style={{
          fontSize: '0.95rem',
          color: '#64748B',
          fontFamily: 'Outfit, sans-serif',
          marginTop: '0.5rem'
        }}>
          Define your schedule range. We will automatically generate bookable slots for these times.
        </p>
      </div>

      {/* Date Range Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
            Start Date <span style={{ color: '#EF4444' }}>*</span>
          </Label>
          <Input
            type="date"
            value={bulkData.start_date}
            onChange={(e) => setBulkData({ ...bulkData, start_date: e.target.value })}
            style={{
              marginTop: '0.5rem',
              fontFamily: 'Outfit, sans-serif',
              borderRadius: '12px'
            }}
          />
        </div>
        <div>
          <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
            End Date <span style={{ color: '#EF4444' }}>*</span>
          </Label>
          <Input
            type="date"
            value={bulkData.end_date}
            onChange={(e) => setBulkData({ ...bulkData, end_date: e.target.value })}
            style={{
              marginTop: '0.5rem',
              fontFamily: 'Outfit, sans-serif',
              borderRadius: '12px'
            }}
          />
        </div>
      </div>

      {/* Days Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
          Select Days <span style={{ color: '#EF4444' }}>*</span>
        </Label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: bulkData.days.includes(day) ? 'none' : '2px solid #e2e8f0',
                background: bulkData.days.includes(day) ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : 'white',
                color: bulkData.days.includes(day) ? 'white' : '#64748B',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
            Time Slots & Capacity <span style={{ color: '#EF4444' }}>*</span>
          </Label>
          <button
            onClick={addTimeSlot}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: 'white',
              color: '#3B82F6',
              border: '2px solid #3B82F6',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Add Slot
          </button>
        </div>
        
        {bulkData.time_slots.map((slot, index) => (
          <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <Input
              type="time"
              value={slot.time}
              onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
              style={{
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '10px'
              }}
            />
            <Input
              type="number"
              value={slot.seats}
              onChange={(e) => updateTimeSlot(index, 'seats', e.target.value)}
              placeholder="Seats"
              style={{
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '10px'
              }}
            />
            {bulkData.time_slots.length > 1 && (
              <button
                onClick={() => removeTimeSlot(index)}
                style={{
                  background: '#FEE2E2',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color="#EF4444" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleGenerate}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          color: 'white',
          fontWeight: '700',
          fontSize: '16px',
          fontFamily: 'Outfit, sans-serif',
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        <CheckCircle2 className="w-5 h-5" />
        Set Availability
      </button>
    </div>
  );
};

export default SessionSlotGenerator;