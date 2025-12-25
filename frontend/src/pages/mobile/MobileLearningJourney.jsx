import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext, API } from '../../App';
import { 
  ArrowLeft, Award, TrendingUp, Target, Download, 
  Video, BookOpen, Star, Trophy, Zap, Crown, CheckCircle,
  Lock, Calendar, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const MobileLearningJourney = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
    totalClasses: 0,
    hoursLearned: 0,
    skillsAcquired: 0,
    certificates: 0
  });
  
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [badges, setBadges] = useState([]);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    if (user) {
      fetchLearningData();
    }
  }, [user]);

  const fetchLearningData = async () => {
    try {
      // Fetch user's bookings and learning data
      const bookingsRes = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('yuno_token')}` }
      });
      
      const completedBookings = bookingsRes.data.filter(b => b.status === 'attended') || [];
      
      // Calculate stats
      setStats({
        totalClasses: completedBookings.length,
        hoursLearned: completedBookings.length * 1, // Assuming 1 hour per class
        skillsAcquired: Math.min(completedBookings.length * 2, 50),
        certificates: Math.floor(completedBookings.length / 4) // 1 cert per 4 classes
      });

      // Mock skill progression data
      const mockSkills = [
        { name: 'Coding', level: 65, category: 'STEM', icon: '💻', progress: 65 },
        { name: 'Public Speaking', level: 80, category: 'Life Skills', icon: '🎤', progress: 80 },
        { name: 'Art & Craft', level: 45, category: 'Creative', icon: '🎨', progress: 45 },
        { name: 'Music', level: 30, category: 'Creative', icon: '🎵', progress: 30 }
      ];
      setSkills(mockSkills);

      // Mock badges
      const mockBadges = [
        { id: 1, name: 'Early Bird', icon: '🌅', unlocked: true, description: 'Attended first class' },
        { id: 2, name: 'Perfect Attendance', icon: '✅', unlocked: true, description: '5 classes in a row' },
        { id: 3, name: 'Explorer', icon: '🔍', unlocked: completedBookings.length >= 3, description: 'Tried 3+ categories' },
        { id: 4, name: 'Star Student', icon: '⭐', unlocked: completedBookings.length >= 10, description: 'Completed 10 classes' },
        { id: 5, name: 'Master', icon: '👑', unlocked: false, description: 'Complete 50 classes' },
        { id: 6, name: 'Streak King', icon: '🔥', unlocked: false, description: '30 day streak' }
      ];
      setBadges(mockBadges);

      // Mock certificates
      const mockCerts = [];
      for (let i = 0; i < stats.certificates; i++) {
        mockCerts.push({
          id: i + 1,
          course: completedBookings[i * 4]?.listing_title || 'Course',
          date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      setCertificates(mockCerts);

      // Mock recordings
      setRecordings(completedBookings.slice(0, 3).map(b => ({
        id: b.id,
        title: b.listing_title,
        date: b.session_date,
        duration: '45 mins',
        thumbnail: b.listing_image
      })));

    } catch (error) {
      console.error('Error fetching learning data:', error);
    }
  };

  const downloadCertificate = (certId) => {
    toast.success('Certificate downloaded! 🎉');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <Trophy className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
        <p className="text-gray-600 mb-6 text-center">
          Please login to track your learning journey
        </p>
        <button
          onClick={() => navigate('/mobile/profile')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white pt-safe">
        <div className="px-6 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold ml-3">Learning Journey</h1>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
            <BookOpen className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">{stats.totalClasses}</p>
            <p className="text-sm opacity-90">Classes Attended</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
            <Clock className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">{stats.hoursLearned}</p>
            <p className="text-sm opacity-90">Hours Learned</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
            <Zap className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">{stats.skillsAcquired}</p>
            <p className="text-sm opacity-90">Skills Acquired</p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
            <Award className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">{stats.certificates}</p>
            <p className="text-sm opacity-90">Certificates</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Skills Progress */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Progression</h2>
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{skill.name}</p>
                      <p className="text-xs text-gray-600">{skill.category}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{skill.level}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.progress}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Badges & Achievements */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Badges & Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative bg-white rounded-xl p-4 text-center shadow-sm ${
                  !badge.unlocked ? 'opacity-50' : ''
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                
                {!badge.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        {certificates.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Certificates</h2>
            <div className="space-y-3">
              {certificates.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="font-bold text-gray-900">{cert.course}</p>
                      <p className="text-sm text-gray-600">
                        Completed • {new Date(cert.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadCertificate(cert.id)}
                    className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Class Recordings */}
        {recordings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Class Recordings</h2>
            <div className="space-y-3">
              {recordings.map((recording, index) => (
                <motion.div
                  key={recording.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm flex"
                >
                  <img
                    src={recording.thumbnail || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100'}
                    alt={recording.title}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="p-4 flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{recording.title}</p>
                    <p className="text-sm text-gray-600">{recording.duration}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-semibold flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Watch
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg font-semibold flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalClasses === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Journey!</h3>
            <p className="text-gray-600 mb-6">
              Book your first class to begin tracking your progress
            </p>
            <button
              onClick={() => navigate('/mobile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Explore Classes
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};

export default MobileLearningJourney;
