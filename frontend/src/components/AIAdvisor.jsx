import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL || '';

const AIAdvisor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { location } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Generate session ID on mount
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Show welcome message when chat opens
    if (isOpen && messages.length === 0) {
      fetchProactiveSuggestions();
      // Auto-focus textarea when chat opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const fetchProactiveSuggestions = async () => {
    const token = localStorage.getItem('yuno_token');
    
    if (token) {
      // User is logged in - get personalized suggestions
      try {
        const response = await axios.post(`${API}/api/ai-advisor/chat`, {
          message: "__GET_PROACTIVE_SUGGESTIONS__", // Special flag
          session_id: sessionId,
          location: location
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.response && response.data.recommended_listings) {
          setMessages([{
            type: 'ai',
            text: response.data.response,
            recommended_listings: response.data.recommended_listings,
            timestamp: new Date()
          }]);
          return;
        }
      } catch (error) {
        console.error('Error fetching proactive suggestions:', error);
      }
    }
    
    // Fallback to generic welcome message
    setMessages([
      {
        type: 'ai',
        text: "Hey 👋 I'm rayy Advisor! Tell me about your child — age, interests, and what you're looking for. I'll help you find the perfect class!",
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/api/ai-advisor/chat`, {
        message: inputMessage,
        session_id: sessionId,
        location: location
      });

      const aiMsg = {
        type: 'ai',
        text: response.data.response,
        recommended_listings: response.data.recommended_listings || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI Advisor error:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        text: "Sorry, I'm having trouble right now. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      // Auto-focus textarea after AI responds
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleListingClick = (listingId) => {
    navigate(`/listings/${listingId}`);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ai-advisor-fab"
        style={{
          position: 'fixed',
          bottom: window.innerWidth <= 768 ? '90px' : '24px', // Above mobile bottom nav
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #F59E0B 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(167, 139, 250, 0.5), 0 0 0 0 rgba(167, 139, 250, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
          animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(167, 139, 250, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(167, 139, 250, 0.5)';
        }}
      >
        <Sparkles size={24} strokeWidth={2.5} />
        <style>{`
          @keyframes pulse-ring {
            0%, 100% {
              box-shadow: 0 8px 24px rgba(167, 139, 250, 0.5), 0 0 0 0 rgba(167, 139, 250, 0.7);
            }
            50% {
              box-shadow: 0 8px 24px rgba(167, 139, 250, 0.5), 0 0 0 10px rgba(167, 139, 250, 0);
            }
          }
          @media (max-width: 768px) {
            .ai-advisor-fab {
              width: 52px !important;
              height: 52px !important;
              bottom: 85px !important;
            }
          }
        `}</style>
      </button>
    );
  }

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="ai-advisor-window" style={{
      position: 'fixed',
      bottom: isMobile ? '0' : '24px',
      right: isMobile ? '0' : '24px',
      left: isMobile ? '0' : 'auto',
      width: isMobile ? '100%' : '400px',
      height: isMobile ? '100vh' : '650px',
      maxHeight: isMobile ? '100vh' : 'calc(100vh - 100px)',
      background: 'white',
      borderRadius: isMobile ? '0' : '24px',
      boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #F59E0B 100%)',
        color: 'white',
        padding: isMobile ? '1.25rem 1rem' : '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '17px', letterSpacing: '-0.02em' }}>rayy Advisor</div>
            <div style={{ fontSize: '12px', opacity: 0.95, fontWeight: '500' }}>AI-Powered Class Finder</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f9fafb'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '0.875rem 1.125rem',
              borderRadius: msg.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.type === 'user' ? 
                'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)' : 
                'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              color: msg.type === 'user' ? 'white' : '#1e293b',
              fontSize: '14px',
              lineHeight: '1.6',
              fontWeight: msg.type === 'user' ? '500' : '400',
              boxShadow: msg.type === 'user' ? 
                '0 4px 12px rgba(167, 139, 250, 0.3)' : 
                '0 2px 8px rgba(0, 0, 0, 0.06)',
              whiteSpace: 'pre-wrap',
              border: msg.type === 'ai' ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
            }}>
              {msg.text}

              {/* Recommended Listings */}
              {msg.recommended_listings && msg.recommended_listings.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {msg.recommended_listings.map(listing => (
                    <div
                      key={listing.id}
                      onClick={() => handleListingClick(listing.id)}
                      style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 100%)',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = '2px solid #3B82F6';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = '2px solid transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {listing.media && listing.media.length > 0 && (
                        <img
                          src={listing.media[0]}
                          alt={listing.title}
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '0.5rem'
                          }}
                        />
                      )}
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {listing.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>
                        Ages {listing.age_min}-{listing.age_max} • {listing.is_online ? 'Online' : listing.venue_name}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6' }}>
                        ₹{listing.price_per_session}/session • {listing.credits_per_session} credits
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '16px 16px 16px 4px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #e2e8f0',
        background: 'white'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about classes..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              border: '2px solid #E5E7EB',
              fontSize: '14px',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '100px',
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
              transition: 'all 0.2s',
              background: '#F9FAFB'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#A78BFA';
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.background = '#F9FAFB';
              e.target.style.boxShadow = 'none';
            }}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '0.875rem',
              borderRadius: '14px',
              background: inputMessage.trim() && !isLoading ? 
                'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)' : '#E5E7EB',
              color: 'white',
              border: 'none',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: inputMessage.trim() && !isLoading ? 
                '0 4px 12px rgba(167, 139, 250, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (inputMessage.trim() && !isLoading) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          gap: 5px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A78BFA 0%, #EC4899 100%);
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: scale(0.7) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1) translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};

export default AIAdvisor;
