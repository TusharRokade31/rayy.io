import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Lock, Database, Bell, UserCheck } from 'lucide-react';
import MagicHeader from '../../components/mobile/MagicHeader';
import GlassCard from '../../components/mobile/GlassCard';

const MobilePrivacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: "1. Information We Collect",
      content: "We collect information you provide directly (name, email, phone), usage data (sessions, bookings), and technical data (device info, IP address) to provide and improve our services."
    },
    {
      icon: Eye,
      title: "2. How We Use Your Information",
      content: "We use your data to: facilitate bookings, process payments, send notifications, improve our services, ensure safety and security, and communicate important updates."
    },
    {
      icon: UserCheck,
      title: "3. Information Sharing",
      content: "We share necessary information with teachers/partners for bookings, payment processors for transactions, and service providers who assist our operations. We never sell your personal data."
    },
    {
      icon: Lock,
      title: "4. Data Security",
      content: "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information."
    },
    {
      icon: Shield,
      title: "5. Your Rights",
      content: "You have the right to: access your data, request corrections, delete your account, opt-out of marketing communications, and download your data."
    },
    {
      icon: Bell,
      title: "6. Cookies & Tracking",
      content: "We use cookies and similar technologies to enhance user experience, analyze usage patterns, and personalize content. You can control cookie settings in your browser."
    },
    {
      icon: UserCheck,
      title: "7. Children's Privacy",
      content: "Our platform is for parents/guardians to book activities for children. We do not knowingly collect data directly from children under 13 without parental consent."
    },
    {
      icon: Database,
      title: "8. Data Retention",
      content: "We retain your information as long as your account is active or as needed to provide services. You can request deletion at any time, subject to legal requirements."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24">
      <MagicHeader title="Privacy Policy" onBack={() => navigate(-1)} />

      <div className="p-4 pt-20 space-y-4">
        {/* Header */}
        <GlassCard className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600">Last updated: January 2025</p>
          <p className="text-xs text-gray-500 mt-2">We are committed to protecting your privacy</p>
        </GlassCard>

        {/* Sections */}
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <GlassCard key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
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

        {/* GDPR Compliance */}
        <GlassCard className="p-4 bg-gradient-to-r from-green-50 to-blue-50">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Shield size={20} className="text-green-600" />
            GDPR Compliance
          </h3>
          <p className="text-sm text-gray-600">
            We comply with GDPR and Indian data protection laws. Users have full control over their data.
          </p>
        </GlassCard>

        {/* Contact */}
        <GlassCard className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">Questions About Privacy?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Contact our Data Protection Officer:</p>
            <p className="font-semibold text-gray-900">Email: privacy@yuno.in</p>
            <p className="font-semibold text-gray-900">Phone: +91 80 1234 5678</p>
          </div>
        </GlassCard>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default MobilePrivacy;
