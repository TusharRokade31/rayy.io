import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import { ArrowLeft, Check, X, Edit, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import MagicHeader from '../../components/mobile/MagicHeader';

const MobileAdminListings = () => {
  const navigate = useNavigate();
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const fetchPendingListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/admin/listings/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching pending listings:', error);
      toast.error('Failed to load pending listings');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (listing, type) => {
    setSelectedListing(listing);
    setActionType(type);
    setShowModal(true);
    setAdminNotes('');
  };

  const confirmAction = async () => {
    if (!selectedListing) return;

    try {
      const token = localStorage.getItem('yuno_token');
      
      if (actionType === 'approve') {
        await axios.post(
          `${API}/admin/listings/${selectedListing.id}/approve`,
          { admin_notes: adminNotes },
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { admin_notes: adminNotes }
          }
        );
        toast.success('Listing approved and made live!');
      } else if (actionType === 'reject') {
        if (!adminNotes.trim()) {
          toast.error('Please provide a rejection reason');
          return;
        }
        await axios.post(
          `${API}/admin/listings/${selectedListing.id}/reject`,
          { reason: adminNotes },
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { reason: adminNotes }
          }
        );
        toast.success('Listing rejected');
      }

      setShowModal(false);
      fetchPendingListings(); // Refresh list
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24">
      <MagicHeader title="Pending Approvals" onBack={() => navigate(-1)} />

      <div className="p-4 pt-20">
        {/* Stats */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 mb-4 shadow-lg border border-white/50">
          <div className="flex items-center gap-2 text-purple-600">
            <Clock size={20} />
            <span className="font-semibold">
              {pendingListings.length} {pendingListings.length === 1 ? 'Listing' : 'Listings'} Awaiting Approval
            </span>
          </div>
        </div>

        {/* Pending Listings */}
        {pendingListings.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg border border-white/50">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No listings pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-white/50"
              >
                {/* Listing Image/Video */}
                <div className="relative h-48 bg-gray-200">
                  {listing.video_url ? (
                    <video
                      src={listing.video_url}
                      poster={listing.media?.[0]}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                  ) : listing.media?.[0] ? (
                    <img
                      src={listing.media[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                      <span className="text-gray-400">No media</span>
                    </div>
                  )}
                  
                  {/* Video Badge */}
                  {listing.video_url && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs font-semibold">
                      📹 Video
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                      ₹{listing.base_price_inr}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                      {listing.age_min}-{listing.age_max} yrs
                    </span>
                    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-lg">
                      {listing.duration_minutes} min
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/mobile/listing/${listing.id}`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    <button
                      onClick={() => handleAction(listing, 'reject')}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(listing, 'approve')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Listing' : 'Reject Listing'}
            </h3>

            <p className="text-gray-600 mb-4">
              {selectedListing?.title}
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {actionType === 'approve' ? 'Admin Notes (Optional)' : 'Rejection Reason *'}
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Add any notes about this approval...'
                  : 'Please provide a reason for rejection...'
              }
              className="w-full border border-gray-300 rounded-xl p-3 text-sm mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-3 rounded-xl font-semibold text-white ${
                  actionType === 'approve'
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminListings;
