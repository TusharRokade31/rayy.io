import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, API } from '../../App';
import MobileLayout from '../../layouts/MobileLayout';
import { Trophy, Medal, Award, Star, TrendingUp, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

const MobileLeaderboard = () => {
  const { user, showAuth } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, month, week

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // For now, we'll create mock data since the API might not have a leaderboard endpoint
      // In production, replace with actual API call
      const mockData = [
        { id: '1', name: 'Priya Sharma', avatar: null, points: 2850, bookings: 45, badges: 12, rank: 1 },
        { id: '2', name: 'Rahul Kumar', avatar: null, points: 2640, bookings: 38, badges: 10, rank: 2 },
        { id: '3', name: 'Ananya Patel', avatar: null, points: 2420, bookings: 35, badges: 9, rank: 3 },
        { id: '4', name: 'Arjun Singh', avatar: null, points: 2180, bookings: 32, badges: 8, rank: 4 },
        { id: '5', name: 'Kavya Reddy', avatar: null, points: 1950, bookings: 28, badges: 7, rank: 5 },
        { id: '6', name: 'Rohan Malhotra', avatar: null, points: 1820, bookings: 25, badges: 6, rank: 6 },
        { id: '7', name: 'Ishaan Verma', avatar: null, points: 1680, bookings: 22, badges: 5, rank: 7 },
        { id: '8', name: 'Diya Gupta', avatar: null, points: 1540, bookings: 20, badges: 5, rank: 8 },
        { id: '9', name: 'Aarav Joshi', avatar: null, points: 1420, bookings: 18, badges: 4, rank: 9 },
        { id: '10', name: 'Saanvi Mehta', avatar: null, points: 1280, bookings: 15, badges: 4, rank: 10 },
      ];
      
      setLeaderboard(mockData);
      
      // Set user rank if logged in
      if (user) {
        const userInLeaderboard = mockData.find(u => u.id === user.id);
        if (userInLeaderboard) {
          setUserRank(userInLeaderboard);
        } else {
          // User not in top 10
          setUserRank({
            id: user.id,
            name: user.name,
            avatar: null,
            points: 450,
            bookings: 5,
            badges: 2,
            rank: 156
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500', bg: 'from-yellow-400 to-yellow-600' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400', bg: 'from-gray-300 to-gray-500' };
    if (rank === 3) return { icon: Award, color: 'text-amber-600', bg: 'from-amber-400 to-amber-600' };
    return { icon: Trophy, color: 'text-blue-500', bg: 'from-blue-400 to-blue-600' };
  };

  const getAvatarColor = (index) => {
    const colors = [
      'from-pink-400 to-rose-500',
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-indigo-500',
      'from-green-400 to-emerald-500',
      'from-orange-400 to-red-500',
    ];
    return colors[index % colors.length];
  };

  const LeaderboardItem = ({ user, index }) => {
    const rankInfo = getRankIcon(user.rank);
    const RankIcon = rankInfo.icon;
    const isTopThree = user.rank <= 3;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex items-center gap-4 p-4 rounded-2xl ${
          isTopThree 
            ? 'bg-gradient-to-r from-white to-gray-50 shadow-lg border-2 border-yellow-200' 
            : 'bg-white shadow-md'
        }`}
      >
        {/* Rank */}
        <div className="flex-shrink-0">
          {isTopThree ? (
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankInfo.bg} flex items-center justify-center shadow-lg`}>
              <RankIcon className="w-6 h-6 text-white" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">#{user.rank}</span>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-bold text-base text-gray-900">{user.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center text-xs text-gray-600">
              <Zap className="w-3 h-3 text-yellow-500 mr-1" />
              <span className="font-semibold">{user.points}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Star className="w-3 h-3 text-blue-500 mr-1" />
              <span>{user.bookings} bookings</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Award className="w-3 h-3 text-purple-500 mr-1" />
              <span>{user.badges} badges</span>
            </div>
          </div>
        </div>

        {/* Points Badge */}
        <div className="flex-shrink-0">
          <div className={`px-3 py-2 rounded-full ${
            isTopThree 
              ? `bg-gradient-to-r ${rankInfo.bg} text-white` 
              : 'bg-gray-100 text-gray-700'
          }`}>
            <span className="text-sm font-bold">{user.points}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MobileLayout>
      <div className="bg-gradient-to-b from-yellow-50 to-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 pt-safe px-4 py-8 rounded-b-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
                <p className="text-sm text-white/80">Compete & Earn Rewards</p>
              </div>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex gap-2 bg-white/20 backdrop-blur-sm rounded-full p-1">
            {['all', 'month', 'week'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                  timeFilter === filter
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* User's Rank Card */}
        {user && userRank && (
          <div className="px-4 -mt-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-bold">#{userRank.rank}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Your Rank</p>
                    <p className="text-xl font-bold">{user.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{userRank.points}</p>
                  <p className="text-sm text-white/80">points</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="px-4 space-y-3 pb-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Top Performers</h2>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                Live Rankings
              </div>
            </div>
            
            {leaderboard.map((user, index) => (
              <LeaderboardItem key={user.id} user={user} index={index} />
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="px-4 pb-24 mt-6">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">How to earn points?</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>🎯 Complete a booking: +50 points</li>
              <li>⭐ Leave a review: +10 points</li>
              <li>🎖️ Earn a badge: +100 points</li>
              <li>🔥 Weekly streak: +25 points/day</li>
            </ul>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </MobileLayout>
  );
};

export default MobileLeaderboard;
