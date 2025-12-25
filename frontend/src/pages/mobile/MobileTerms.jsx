import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Users, AlertCircle } from 'lucide-react';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';

const MobileTerms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "1. Acceptance of Terms",
      content: "By accessing and using Yuno's services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
    },
    {
      icon: Users,
      title: "2. User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account."
    },
    {
      icon: FileText,
      title: "3. Service Usage",
      content: "Our platform connects parents with verified teachers and activity providers. All bookings, payments, and communications must be conducted through our platform."
    },
    {
      icon: AlertCircle,
      title: "4. Cancellation Policy",
      content: "Cancellations must be made at least 24 hours before the scheduled session. Refunds will be processed according to our refund policy. Late cancellations may incur charges."
    },
    {
      icon: Shield,
      title: "5. Privacy & Data",
      content: "We collect and process personal data as described in our Privacy Policy. We are committed to protecting your privacy and securing your information."
    },
    {
      icon: FileText,
      title: "6. Payment Terms",
      content: "All payments are processed securely through our payment partners. Prices are in INR and include applicable taxes. Credits purchased are non-transferable."
    },
    {
      icon: Users,
      title: "7. Teacher/Partner Terms",
      content: "Teachers and activity partners must complete verification and agree to background checks. Partners are independent contractors, not employees of Yuno."
    },
    {
      icon: AlertCircle,
      title: "8. Liability",
      content: "Yuno acts as a platform connecting users with service providers. While we verify partners, we are not liable for the quality of services provided."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24">
      <MagicHeader title="Terms of Service" onBack={() => navigate(-1)} />

      <div className="p-4 pt-20 space-y-4">
        {/* Header */}
        <GlassCard className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600">Last updated: January 2025</p>
        </GlassCard>

        {/* Sections */}
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <GlassCard key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <IconComponent size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}

        {/* Additional Info */}
        <GlassCard className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">Contact Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>If you have questions about these Terms, please contact us:</p>
            <p className="font-semibold text-gray-900">Email: legal@yuno.in</p>
            <p className="font-semibold text-gray-900">Phone: +91 80 1234 5678</p>
          </div>
        </GlassCard>

        {/* Acceptance Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default MobileTerms;
