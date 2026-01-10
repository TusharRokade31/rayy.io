import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MessageTeacherButton = ({ teacherId, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mobile/chat/${teacherId}`);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      Message Teacher
    </motion.button>
  );
};

export default MessageTeacherButton;