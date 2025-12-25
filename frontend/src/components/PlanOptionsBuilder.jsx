import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Zap, Calendar, TrendingUp, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const PlanOptionsBuilder = ({ plans = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState({
    plan_type: 'single',
    name: '',
    description: '',
    sessions_count: 1,
    price_inr: '',
    discount_percent: 0,
    validity_days: 30
  });

  const planTypeTemplates = {
    trial: {
      icon: Zap,
      color: 'orange',
      defaultName: 'Trial Class',
      defaultDescription: 'Try before you commit',
      defaultSessions: 1,
      defaultValidity: 30
    },
    single: {
      icon: Calendar,
      color: 'blue',
      defaultName: 'Single Session',
      defaultDescription: 'Pay as you go',
      defaultSessions: 1,
      defaultValidity: 30
    },
    weekly: {
      icon: TrendingUp,
      color: 'green',
      defaultName: 'Weekly Plan',
      defaultDescription: 'Multiple sessions per week',
      defaultSessions: 4,
      defaultValidity: 60
    },
    monthly: {
      icon: Award,
      color: 'purple',
      defaultName: 'Monthly Plan',
      defaultDescription: 'Best value for regular learners',
      defaultSessions: 12,
      defaultValidity: 90
    }
  };

  const handlePlanTypeChange = (type) => {
    const template = planTypeTemplates[type];
    setFormData({
      ...formData,
      plan_type: type,
      name: template.defaultName,
      description: template.defaultDescription,
      sessions_count: template.defaultSessions,
      validity_days: template.defaultValidity
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
      validity_days: parseInt(formData.validity_days),
      is_active: true
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pricing Plans</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create flexible plans for your students
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </Button>
        )}
      </div>

      {/* Plan Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50/50"
          >
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                {editingPlanId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingPlanId ? 'Edit Plan' : 'New Plan'}
              </h4>

              {/* Plan Type Selector */}
              <div>
                <Label>Plan Type *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {Object.entries(planTypeTemplates).map(([type, template]) => {
                    const Icon = template.icon;
                    const isSelected = formData.plan_type === type;
                    
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handlePlanTypeChange(type)}
                        className={`
                          p-4 rounded-xl border-2 transition-all text-center
                          ${isSelected 
                            ? `border-${template.color}-500 bg-${template.color}-50` 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? `text-${template.color}-600` : 'text-gray-400'}`} />
                        <div className={`text-sm font-medium capitalize ${isSelected ? `text-${template.color}-700` : 'text-gray-700'}`}>
                          {type}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div>
                  <Label htmlFor="plan-name">Plan Name *</Label>
                  <Input
                    id="plan-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 5-Day Weekend Intensive"
                    className="mt-1"
                  />
                </div>

                {/* Sessions Count */}
                <div>
                  <Label htmlFor="sessions-count">Number of Sessions *</Label>
                  <Input
                    id="sessions-count"
                    type="number"
                    min="1"
                    value={formData.sessions_count}
                    onChange={(e) => setFormData({ ...formData, sessions_count: e.target.value })}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="plan-price">Total Price (₹) *</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_inr}
                    onChange={(e) => setFormData({ ...formData, price_inr: e.target.value })}
                    placeholder="999"
                    className="mt-1"
                  />
                  {formData.price_inr && formData.sessions_count > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{calculatePricePerSession(formData.price_inr, formData.sessions_count)} per session
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                {/* Validity */}
                <div>
                  <Label htmlFor="validity">Validity (Days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                    placeholder="30"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="plan-description">Description</Label>
                <textarea
                  id="plan-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this plan..."
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={editingPlanId ? handleUpdatePlan : handleAddPlan}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingPlanId ? 'Update Plan' : 'Add Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingPlanId(null);
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

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No plans created yet</p>
          <p className="text-gray-400 text-xs mt-1">Click "Add Plan" to create your first pricing plan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => {
            const Icon = getPlanTypeIcon(plan.plan_type);
            const color = getPlanTypeColor(plan.plan_type);
            
            return (
              <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700 font-medium capitalize`}>
                          {plan.plan_type}
                        </span>
                      </div>
                      
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Sessions:</span>
                          <span className="font-medium text-gray-900">{plan.sessions_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-semibold text-gray-900">₹{plan.price_inr}</span>
                          <span className="text-gray-400 text-xs">
                            (₹{calculatePricePerSession(plan.price_inr, plan.sessions_count)}/session)
                          </span>
                        </div>
                        {plan.discount_percent > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 font-medium">{plan.discount_percent}% OFF</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Validity:</span>
                          <span className="font-medium text-gray-900">{plan.validity_days} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEditPlan(plan)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanOptionsBuilder;
