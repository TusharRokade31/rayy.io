import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const MobileChat = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacher();
      fetchMessages();
    }
  }, [user, teacherId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTeacher = async () => {
    try {
      const response = await axios.get(`${API}/partners/${teacherId}`);
      setTeacher(response.data);
    } catch (error) {
      console.error('Error fetching teacher:', error);
      // Mock teacher data
      setTeacher({
        id: teacherId,
        brand_name: 'Teacher',
        logo: null,
        response_time: '< 1 hour'
      });
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Mock messages for now
      const mockMessages = [
        {
          id: '1',
          sender: 'teacher',
          text: 'Hello! Thanks for your interest in my class. How can I help you?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
      setMessages(mockMessages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate teacher response
    setTimeout(() => {
      const autoReply = {
        id: (Date.now() + 1).toString(),
        sender: 'teacher',
        text: "Thanks for your message! I'll get back to you soon.",
        timestamp: new Date().toISOString(),
        read: false
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);

    toast.success('Message sent!');
  };

  const quickQuestions = [
    "What's the class schedule?",
    "Is trial available?",
    "What materials do I need?",
    "Can I reschedule?"
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        
        {teacher && (
          <>
            {teacher.logo ? (
              <img
                src={teacher.logo}
                alt={teacher.brand_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {teacher.brand_name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{teacher.brand_name}</h2>
              <p className="text-xs text-gray-600">
                Typically responds in {teacher.response_time || '< 1 hour'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {format(parseISO(message.timestamp), 'hh:mm a')}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setNewMessage(question)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 pb-safe">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileChat;