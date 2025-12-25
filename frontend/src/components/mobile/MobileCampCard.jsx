import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedVideoPlayer from './OptimizedVideoPlayer';

const MobileCampCard = ({ camp }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'coding': '#3B82F6',
      'art': '#F472B6',
      'sports': '#10B981',
      'music': '#F59E0B',
      'drama': '#8B5CF6',
      'fitness': '#6EE7B7'
    };
    return colors[category?.toLowerCase()] || '#64748b';
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/mobile/listing/${camp.id}`)}
      className="relative flex-shrink-0 w-[340px] h-[400px] rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Background Video or Image */}
      {camp.video_url ? (
        <>
          <OptimizedVideoPlayer
            src={camp.video_url}
            poster={camp.media?.[0]}
            muted={true}
            loop={true}
            showControls={false}
            className="absolute inset-0 h-full w-full"
            lazyLoad={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </>
      ) : (
        <>
          {camp.media && camp.media[0] && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${camp.media[0]})`,
                filter: 'brightness(0.7)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5 text-white">
        {/* Category Badge */}
        <div 
          className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide"
          style={{ backgroundColor: getCategoryColor(camp.category) }}
        >
          {camp.category || 'Camp'}
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 right-4 bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
          <Calendar size={14} />
          {camp.camp_duration_days || camp.duration_minutes || '5'} Days
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold mb-2 leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {camp.title}
          </h2>
          <p className="text-sm opacity-95 line-clamp-2" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>
            {camp.description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/15 backdrop-blur-md p-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <div>
                <div className="text-xs opacity-80">Start Date</div>
                <div className="text-xs font-semibold">
                  {formatDate(camp.event_date)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <div>
                <div className="text-xs opacity-80">Age Group</div>
                <div className="text-xs font-semibold">
                  {camp.age_min}-{camp.age_max} yrs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80 mb-1">Package Price</div>
            <div className="text-3xl font-extrabold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              ₹{camp.base_price_inr || camp.price_per_session || 0}
            </div>
          </div>

          <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold shadow-xl">
            Enroll Now →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileCampCard;