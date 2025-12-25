import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  ChevronDown, 
  MessageCircle, 
  Mail, 
  Phone,
  Book,
  CreditCard,
  Calendar,
  Users,
  Shield
} from 'lucide-react';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';

const MobileHelpCenter = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      category: "Getting Started",
      icon: Book,
      questions: [
        {
          q: "How do I create an account?",
          a: "Tap on the profile icon and select 'Login/Sign Up'. Enter your phone number and verify with the OTP sent to you."
        },
        {
          q: "How do I find activities near me?",
          a: "On the home page, select your location or choose 'Online classes only' to see all available activities."
        },
        {
          q: "Can I book for multiple children?",
          a: "Yes! Go to Profile > Child Profiles to add multiple children. You can select which child when making a booking."
        }
      ]
    },
    {
      category: "Bookings & Payments",
      icon: Calendar,
      questions: [
        {
          q: "How do I book an activity?",
          a: "Browse activities, tap on one you like, select a plan, choose date/time, and confirm booking. Payment is processed securely."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept UPI, debit/credit cards, net banking, and wallet payments through our secure payment partners."
        },
        {
          q: "Can I cancel or reschedule?",
          a: "Yes, cancellations must be made 24 hours before the session. Go to My Bookings, select the booking, and choose 'Cancel' or 'Reschedule'."
        },
        {
          q: "When will I get my refund?",
          a: "Refunds are processed within 5-7 business days to your original payment method after cancellation approval."
        }
      ]
    },
    {
      category: "Wallet & Credits",
      icon: CreditCard,
      questions: [
        {
          q: "What is Yuno Wallet?",
          a: "Yuno Wallet lets you add credits for faster checkout. You can also earn credits through referrals and offers."
        },
        {
          q: "How do I add money to my wallet?",
          a: "Go to Wallet > Add Money, select a package, and complete the payment. Bonus credits are added automatically!"
        },
        {
          q: "Do wallet credits expire?",
          a: "Purchased credits are valid for 1 year from date of purchase. Bonus credits may have different validity."
        }
      ]
    },
    {
      category: "Safety & Teachers",
      icon: Shield,
      questions: [
        {
          q: "Are teachers verified?",
          a: "Yes! All teachers go through background verification, skill assessment, and document checks before joining our platform."
        },
        {
          q: "How can I contact a teacher?",
          a: "After booking, you can message the teacher through the 'Chat' button in your booking details."
        },
        {
          q: "What safety measures are in place?",
          a: "We verify all teachers, provide secure payment, and maintain emergency contact protocols. Parents can rate and review after each session."
        }
      ]
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with support team",
      action: () => {},
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "support@yuno.in",
      action: () => window.open('mailto:support@yuno.in'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "+91 80 1234 5678",
      action: () => window.open('tel:+918012345678'),
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24">
      <MagicHeader title="Help Center" onBack={() => navigate(-1)} />

      <div className="p-4 pt-20 space-y-4">
        {/* Header */}
        <GlassCard className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</h1>
          <p className="text-sm text-gray-600">Find answers to common questions</p>
        </GlassCard>

        {/* Contact Options */}
        <div className="grid grid-cols-3 gap-3">
          {contactOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={option.action}
                className="relative"
              >
                <GlassCard className="p-3 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${option.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <div className="text-xs font-semibold text-gray-900 mb-1">{option.title}</div>
                  <div className="text-[10px] text-gray-600">{option.description}</div>
                </GlassCard>
              </motion.button>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {faqs.map((category, catIndex) => {
            const IconComponent = category.icon;
            return (
              <div key={catIndex}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <IconComponent size={20} className="text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">{category.category}</h2>
                </div>

                <div className="space-y-2">
                  {category.questions.map((faq, faqIndex) => {
                    const key = `${catIndex}-${faqIndex}`;
                    const isExpanded = expandedFaq === key;

                    return (
                      <GlassCard key={key} className="overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : key)}
                          className="w-full p-4 text-left flex items-center justify-between"
                        >
                          <span className="font-semibold text-gray-900 pr-2">{faq.q}</span>
                          <ChevronDown 
                            size={20} 
                            className={`text-purple-600 flex-shrink-0 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-white/50 pt-3">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Need Help */}
        <GlassCard className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our support team is available 9 AM - 9 PM IST
          </p>
          <button
            onClick={() => window.open('mailto:support@yuno.in')}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
          >
            Contact Support
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default MobileHelpCenter;
