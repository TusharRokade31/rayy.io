import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Clock, Users, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import DaysOfWeekSelector from './DaysOfWeekSelector';

const BatchManager = ({ batches = [], plans = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    days_of_week: [],
    time: '17:00',
    duration_minutes: 60,
    capacity: 10,
    plan_types: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  const handleAddBatch = () => {
    if (!formData.name || formData.days_of_week.length === 0 || formData.plan_types.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    const newBatch = {
      id: Date.now().toString(),
      ...formData,
      duration_minutes: parseInt(formData.duration_minutes),
      capacity: parseInt(formData.capacity),
      enrolled_count: 0,
      is_active: true
    };

    onChange([...batches, newBatch]);
    resetForm();
    setIsAdding(false);
    toast.success('Batch created successfully!');
  };

  const handleUpdateBatch = () => {
    const updatedBatches = batches.map(b =>
      b.id === editingBatchId
        ? {
            ...formData,
            id: b.id,
            duration_minutes: parseInt(formData.duration_minutes),
            capacity: parseInt(formData.capacity),
            enrolled_count: b.enrolled_count || 0
          }
        : b
    );
    onChange(updatedBatches);
    resetForm();
    setEditingBatchId(null);
    setIsAdding(false);
    toast.success('Batch updated successfully!');
  };

  const handleDeleteBatch = (batchId) => {
    onChange(batches.filter(b => b.id !== batchId));
    toast.success('Batch deleted');
  };

  const handleEditBatch = (batch) => {
    setFormData({
      name: batch.name,
      days_of_week: batch.days_of_week,
      time: batch.time,
      duration_minutes: batch.duration_minutes,
      capacity: batch.capacity,
      plan_types: batch.plan_types,
      start_date: batch.start_date,
      end_date: batch.end_date || ''
    });
    setEditingBatchId(batch.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      days_of_week: [],
      time: '17:00',
      duration_minutes: 60,
      capacity: 10,
      plan_types: [],
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };

  const togglePlanType = (planType) => {
    if (formData.plan_types.includes(planType)) {
      setFormData({
        ...formData,
        plan_types: formData.plan_types.filter(pt => pt !== planType)
      });
    } else {
      setFormData({
        ...formData,
        plan_types: [...formData.plan_types, planType]
      });
    }
  };

  const formatDays = (days) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends';
    }
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create batches with specific timings and capacity
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Batch
          </Button>
        )}
      </div>

      {/* Batch Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-2 border-dashed border-purple-200 rounded-2xl p-6 bg-purple-50/50"
          >
            <div className="space-y-5">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                {editingBatchId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingBatchId ? 'Edit Batch' : 'New Batch'}
              </h4>

              {/* Batch Name */}
              <div>
                <Label htmlFor="batch-name">Batch Name *</Label>
                <Input
                  id="batch-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Batch - 5PM"
                  className="mt-1"
                />
              </div>

              {/* Days of Week */}
              <div>
                <Label>Schedule - Select Days *</Label>
                <div className="mt-2">
                  <DaysOfWeekSelector
                    selectedDays={formData.days_of_week}
                    onChange={(days) => setFormData({ ...formData, days_of_week: days })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time */}
                <div>
                  <Label htmlFor="batch-time">Session Time *</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="batch-time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="60"
                    className="mt-1"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <Label htmlFor="capacity">Batch Capacity *</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="10"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="start-date">Start Date *</Label>
                  <div className="relative mt-1">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Allowed Plan Types */}
              <div>
                <Label>Which plans can book this batch? *</Label>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Select the pricing plans that students can use to book this batch
                </p>
                {plans.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    ⚠️ Please create pricing plans first before adding batches
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {plans.map((plan) => {
                      const isSelected = formData.plan_types.includes(plan.plan_type);
                      
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => togglePlanType(plan.plan_type)}
                          className={`
                            p-3 rounded-xl border-2 transition-all text-left
                            ${isSelected
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium capitalize ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                              {plan.plan_type}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {plan.sessions_count} session{plan.sessions_count > 1 ? 's' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={editingBatchId ? handleUpdateBatch : handleAddBatch}
                  className="flex items-center gap-2"
                  disabled={plans.length === 0}
                >
                  <Check className="w-4 h-4" />
                  {editingBatchId ? 'Update Batch' : 'Create Batch'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingBatchId(null);
                    resetForm();
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batches List */}
      {batches.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No batches created yet</p>
          <p className="text-gray-400 text-xs mt-1">
            {plans.length === 0 
              ? 'Create pricing plans first, then add batches'
              : 'Click "Add Batch" to create your first batch'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <motion.div
              key={batch.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{batch.name}</h4>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{formatDays(batch.days_of_week)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{formatTime(batch.time)} • {batch.duration_minutes}min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Capacity: {batch.enrolled_count || 0}/{batch.capacity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Plans: {batch.plan_types.map(pt => pt.charAt(0).toUpperCase() + pt.slice(1)).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditBatch(batch)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBatch(batch.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchManager;
