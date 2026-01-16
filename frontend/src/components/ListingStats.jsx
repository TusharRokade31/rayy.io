import React from 'react';
import { IndianRupee, TrendingUp, DollarSign, Award, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subLabel, colorTheme }) => {
  // Color themes map to match the image's pastel aesthetic
  const themes = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
  };

  const theme = themes[colorTheme] || themes.blue;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-start min-w-[240px] h-full transition-transform hover:-translate-y-1 duration-200">
      {/* Icon Section */}
      <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${theme.icon}`} />
      </div>

      {/* Label */}
      <div className="text-gray-500 text-sm font-medium mb-1">
        {label}
      </div>

      {/* Value */}
      <div className="text-3xl font-extrabold text-gray-900 mb-1">
        {value}
      </div>

      {/* Optional Sub-label (like "Total earned") */}
      {subLabel && (
        <div className="text-gray-400 text-xs mt-auto">
          {subLabel}
        </div>
      )}
    </div>
  );
};

const ListingStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Revenue Style (Blue) */}
      <StatCard
        icon={IndianRupee}
        label="Today's Revenue"
        value="₹0"
        colorTheme="blue"
      />

      {/* Card 2: Growth Style (Green) */}
      <StatCard
        icon={TrendingUp}
        label="This Week"
        value="₹0"
        colorTheme="green"
      />

      {/* Card 3: Monthly Style (Purple) */}
      <StatCard
        icon={DollarSign}
        label="This Month"
        value="₹0"
        colorTheme="purple"
      />

      {/* Card 4: Lifetime Style (Orange) */}
      <StatCard
        icon={Award}
        label="Lifetime Earnings"
        value="₹0"
        subLabel="Total earned"
        colorTheme="orange"
      />
    </div>
  );
};

// Alternative Version: Specific for "Listings" context if you need that instead
export const ListingStatusCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={Package}
        label="Total Listings"
        value={stats?.total || '0'}
        subLabel="All categories"
        colorTheme="blue"
      />
      <StatCard
        icon={Clock}
        label="Pending Approval"
        value={stats?.pending || '0'}
        subLabel="Needs review"
        colorTheme="orange"
      />
      <StatCard
        icon={CheckCircle}
        label="Active Listings"
        value={stats?.approved || '0'}
        subLabel="Live on platform"
        colorTheme="green"
      />
      <StatCard
        icon={XCircle}
        label="Rejected"
        value={stats?.rejected || '0'}
        subLabel="Action required"
        colorTheme="purple"
      />
    </div>
  );
};

export default ListingStats;