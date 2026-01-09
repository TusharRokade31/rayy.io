import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Zap, Calendar, TrendingUp, Award, Clock, MousePointerClick } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const PlanOptionsBuilder = ({ plans = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState({
    plan_type: 'single',
    timing_type: 'FLEXIBLE', // Default to Flexible
    name: '',
    description: '',
    sessions_count: 1,
    price_inr: '',
    discount_percent: 0,
    validity_days: 30
  });

  const planTypeTemplates = {
    trial: { icon: Zap, color: 'orange', defaultName: 'Trial Class', defaultSessions: 1 },
    single: { icon: Calendar, color: 'blue', defaultName: 'Single Session', defaultSessions: 1 },
    weekly: { icon: TrendingUp, color: 'green', defaultName: 'Weekly Plan', defaultSessions: 4 },
    monthly: { icon: Award, color: 'purple', defaultName: 'Monthly Plan', defaultSessions: 12 }
  };

  const handlePlanTypeChange = (type) => {
    const template = planTypeTemplates[type];
    setFormData({
      ...formData,
      plan_type: type,
      name: template.defaultName,
      sessions_count: template.defaultSessions
    });
  };

  const handleAddPlan = () => {
    if (!formData.name || !formData.price_inr || formData.sessions_count < 1) {
      toast.error('Please fill all required fields');
      return;
    }

    const newPlan = {
      id: Date.now().toString(),
      ...formData,
      price_inr: parseFloat(formData.price_inr),
      sessions_count: parseInt(formData.sessions_count),
      discount_percent: parseFloat(formData.discount_percent || 0),
      validity_days: parseInt(formData.validity_days)
    };

    onChange([...plans, newPlan]);
    resetForm();
    setIsAdding(false);
    toast.success('Plan added successfully!');
  };

  const handleUpdatePlan = () => {
    const updatedPlans = plans.map(p => 
      p.id === editingPlanId 
        ? { 
            ...formData, 
            id: p.id,
            price_inr: parseFloat(formData.price_inr),
            sessions_count: parseInt(formData.sessions_count),
            discount_percent: parseFloat(formData.discount_percent || 0),
            validity_days: parseInt(formData.validity_days)
          }
        : p
    );
    onChange(updatedPlans);
    resetForm();
    setEditingPlanId(null);
    toast.success('Plan updated successfully!');
  };

  const handleDeletePlan = (planId) => {
    onChange(plans.filter(p => p.id !== planId));
    toast.success('Plan deleted');
  };

  const handleEditPlan = (plan) => {
    setFormData({
      plan_type: plan.plan_type,
      name: plan.name,
      description: plan.description || '',
      sessions_count: plan.sessions_count,
      price_inr: plan.price_inr.toString(),
      discount_percent: plan.discount_percent || 0,
      validity_days: plan.validity_days
    });
    setEditingPlanId(plan.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      plan_type: 'single',
      name: '',
      description: '',
      sessions_count: 1,
      price_inr: '',
      discount_percent: 0,
      validity_days: 30
    });
  };

  const getPlanTypeColor = (type) => {
    const template = planTypeTemplates[type] || planTypeTemplates.single;
    return template.color;
  };

  const getPlanTypeIcon = (type) => {
    const template = planTypeTemplates[type] || planTypeTemplates.single;
    return template.icon;
  };

  const calculatePricePerSession = (totalPrice, sessionCount) => {
    return (totalPrice / sessionCount).toFixed(2);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Pricing Plans</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Plan
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50/50"
          >
            <div className="space-y-4">
              
              {/* TIMING TYPE SELECTION (NEW) */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100">
                <Label className="mb-2 block">How do students book this plan? *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timing_type: 'FIXED' })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.timing_type === 'FIXED' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold text-sm">Fixed Batch</span>
                    <span className="text-xs text-center">User picks a specific batch (e.g., Mon/Wed 5 PM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timing_type: 'FLEXIBLE' })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.timing_type === 'FLEXIBLE' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <MousePointerClick className="w-6 h-6" />
                    <span className="font-semibold text-sm">Flexible Slots</span>
                    <span className="text-xs text-center">User picks any {formData.sessions_count} sessions from available slots</span>
                  </button>
                </div>
              </div>

              {/* PLAN TYPE SELECTOR */}
              <div>
                <Label>Plan Type *</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Object.entries(planTypeTemplates).map(([type, template]) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handlePlanTypeChange(type)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center ${
                          formData.plan_type === type ? `border-${template.color}-500 bg-${template.color}-50` : 'border-gray-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 text-${template.color}-600`} />
                        <span className="text-xs font-medium capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REST OF THE FORM INPUTS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <Label>Sessions</Label>
                  <Input type="number" value={formData.sessions_count} onChange={e => setFormData({...formData, sessions_count: e.target.value})} />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={formData.price_inr} onChange={e => setFormData({...formData, price_inr: e.target.value})} />
                </div>
                <div>
                  <Label>Validity (Days)</Label>
                  <Input type="number" value={formData.validity_days} onChange={e => setFormData({...formData, validity_days: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={editingPlanId ? handleUpdatePlan : handleAddPlan}>
                  <Check className="w-4 h-4 mr-2" /> {editingPlanId ? 'Update' : 'Add'}
                </Button>
                <Button variant="outline" onClick={() => { setIsAdding(false); setEditingPlanId(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER LIST OF PLANS */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold">{plan.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  plan.timing_type === 'FIXED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {plan.timing_type === 'FIXED' ? 'Batch' : 'Flexible'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{plan.sessions_count} Sessions • ₹{plan.price_inr}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEditPlan(plan)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit2 size={16} /></button>
              <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanOptionsBuilder;