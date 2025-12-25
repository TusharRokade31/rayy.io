import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedVideoPlayer from './OptimizedVideoPlayer';

const MobileWorkshopCard = ({ workshop }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (workshop.is_external && workshop.external_booking_url) {
      window.open(workshop.external_booking_url, '_blank');
    } else {
      navigate(`/mobile/listing/${workshop.id}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Video/Speaker Photo Section */}
      <div className="relative h-[180px] bg-gradient-to-br from-purple-500 to-purple-700">
        {workshop.video_url ? (
          <OptimizedVideoPlayer
            src={workshop.video_url}
            poster={workshop.media?.[0]}
            muted={true}
            loop={true}
            showControls={false}
            className="h-full w-full"
            lazyLoad={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 h-full">
            {workshop.media && workshop.media[0] && (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white mb-2 bg-white">
                <img
                  src={workshop.media[0]}
                  alt={workshop.speaker_name || 'Workshop'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="text-center text-white">
              <div className="text-lg font-bold mb-1">
                {workshop.speaker_name || workshop.partner_name || 'Expert Speaker'}
              </div>
              <div className="text-xs opacity-90">
                {workshop.speaker_credentials?.split('|')[0] || 'Professional Instructor'}
              </div>
            </div>
          </div>
        )}

        {/* External Badge */}
        {workshop.is_external && (
          <div className="absolute top-2 right-2 bg-white/25 backdrop-blur-md px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 z-10">
            <ExternalLink size={10} />
            External
          </div>
        )}
      </div>

      {/* Workshop Details */}
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 min-h-[48px]">
          {workshop.title}
        </h3>

        {/* Meta Info */}
        <div className="space-y-2 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{formatDate(workshop.event_date)} • {workshop.duration_minutes || 60} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>Ages {workshop.age_min}-{workshop.age_max}</span>
          </div>
        </div>

        {/* Urgency Message */}
        {workshop.urgency_message && (
          <div className={`p-2 rounded-lg text-xs font-semibold mb-3 ${
            workshop.urgency_message.includes('🔥') 
              ? 'bg-yellow-100 text-yellow-900' 
              : 'bg-blue-100 text-blue-900'
          }`}>
            {workshop.urgency_message}
          </div>
        )}

        {/* Price & CTA */}
        <div className="text-2xl font-bold mb-3" style={{ color: workshop.base_price_inr === 0 ? '#10b981' : '#3B82F6' }}>
          {workshop.base_price_inr === 0 ? 'FREE' : `₹${workshop.base_price_inr}`}
        </div>

        <button className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          {workshop.is_external ? (
            <>Register <ExternalLink size={16} /></>
          ) : (
            'Book Now'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default MobileWorkshopCard;