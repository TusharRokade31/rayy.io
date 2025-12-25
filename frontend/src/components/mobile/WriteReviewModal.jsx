import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Camera, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const WriteReviewModal = ({ listing, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }
    
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    // Submit review
    if (onSubmit) {
      onSubmit({ rating, text: reviewText, photos });
    }
    
    toast.success('Review submitted! 🎉');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Listing Info */}
            <div className="flex gap-4">
              <img
                src={listing.media?.[0] || listing.image_url}
                alt={listing.title}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div>
                <h3 className="font-bold text-gray-900">{listing.title}</h3>
                <p className="text-sm text-gray-600">{listing.partner_name}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Rate your experience</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 5 && '⭐ Excellent!'}
                  {rating === 4 && '😊 Very Good!'}
                  {rating === 3 && '🙂 Good!'}
                  {rating === 2 && '😐 Fair'}
                  {rating === 1 && '😞 Needs Improvement'}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Share your experience</h3>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you liked about the class, the teacher, or what could be improved..."
                className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{reviewText.length}/500</p>
            </div>

            {/* Photo Upload */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Add photos (optional)</h3>
              
              <div className="flex gap-3 flex-wrap">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Upload ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {photos.length < 3 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">Maximum 3 photos</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || !reviewText.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              Submit Review
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WriteReviewModal;
