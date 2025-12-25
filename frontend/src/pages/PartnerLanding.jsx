import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import { CheckCircle, TrendingUp, DollarSign, Calendar, Users, BarChart, Shield, Sparkles } from 'lucide-react';

const PartnerLanding = () => {
  const navigate = useNavigate();
  const { user, showAuth } = useContext(AuthContext);

  const handleGetStarted = () => {
    if (!user) {
      // Show partner auth modal - onboarding will trigger automatically after signup
      showAuth('partner');
    } else if (user.role === 'partner_owner') {
      navigate('/partner/dashboard');
    } else {
      // If logged in but not a partner, show auth modal to create partner account
      showAuth('partner');
    }
  };

  const benefits = [
    {
      icon: Users,
      title: 'Reach Thousands of Parents',
      description: 'Connect with families actively looking for quality classes',
      color: '#6EE7B7'
    },
    {
      icon: Calendar,
      title: 'Easy Booking Management',
      description: 'Manage sessions, attendance, and schedules in one place',
      color: '#3B82F6'
    },
    {
      icon: DollarSign,
      title: 'Flexible Pricing',
      description: 'Set your own prices with trial, weekly, and monthly plans',
      color: '#FBBF24'
    },
    {
      icon: BarChart,
      title: 'Growth Analytics',
      description: 'Track bookings, revenue, and student engagement',
      color: '#8B5CF6'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Reliable payouts with transparent fee structure',
      color: '#10B981'
    },
    {
      icon: TrendingUp,
      title: 'Marketing Support',
      description: 'Get featured in trending sections and recommendations',
      color: '#F59E0B'
    }
  ];

  const steps = [
    { number: '1', title: 'Sign Up', description: 'Create your partner account in 2 minutes' },
    { number: '2', title: 'Complete KYC', description: 'Verify your business details and documents' },
    { number: '3', title: 'Create Listings', description: 'Add your classes with photos and details' },
    { number: '4', title: 'Go Live', description: 'Start receiving bookings instantly!' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        padding: '6rem 2rem 4rem',
        background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '40%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                marginBottom: '2rem'
              }}
            >
              ✨ Join 500+ Partners Growing with rayy
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1.5rem',
              fontFamily: 'Space Grotesk, sans-serif',
              lineHeight: '1.2'
            }}>
              Grow Your Classes.<br />
              Reach More Students.
            </h1>

            <p style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
              color: 'rgba(255, 255, 255, 0.95)',
              maxWidth: '700px',
              margin: '0 auto 3rem',
              lineHeight: '1.6',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Partner with rayy to fill your classes and manage bookings effortlessly. 
              From dance to coding, art to sports — we help you grow 🚀
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '20px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              Get Started Free <Sparkles size={22} />
            </motion.button>

            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '1rem'
            }}>
              No credit card required • Set up in 5 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Commission Structure Section - NEW */}
      <section style={{ padding: '3rem 2rem', background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-block',
              background: '#78350F',
              color: '#FEF3C7',
              padding: '0.5rem 1.5rem',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '1.5rem'
            }}>
              🎁 SPECIAL WELCOME OFFER
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              color: '#78350F',
              marginBottom: '1rem',
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              Start with 0% Commission
            </h2>

            <p style={{
              fontSize: '1.1rem',
              color: '#92400E',
              maxWidth: '700px',
              margin: '0 auto 2.5rem',
              lineHeight: '1.6'
            }}>
              We want you to succeed! Enjoy zero platform fees for your first month.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              {/* First 30 Days */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '3px solid #10B981'
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  0%
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '0.75rem'
                }}>
                  First 30 Days
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  Keep 100% of your earnings. Build your presence and grow your customer base risk-free.
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#D1FAE5',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#065F46'
                }}>
                  ✓ No platform fees
                </div>
              </motion.div>

              {/* After 30 Days */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '3px solid #06B6D4'
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  10%
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '0.75rem'
                }}>
                  After Day 31
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  Industry-low 10% commission on successful bookings. No hidden fees or surprises.
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#E0F2FE',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0C4A6E'
                }}>
                  ✓ Transparent pricing
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <p style={{
                color: '#78350F',
                fontSize: '14px',
                fontWeight: '600',
                margin: 0
              }}>
                💡 <strong>Plus:</strong> Bi-weekly payouts • Trial class promotion • Marketing support • Dashboard analytics
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '4rem 2rem', background: '#F9FAFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '1rem',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1E293B'
            }}>
              Why Partner with rayy?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Everything you need to run and grow your classes
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${benefit.color} 0%, ${benefit.color}dd 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <benefit.icon size={28} color="white" />
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  color: '#1E293B',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748B',
                  lineHeight: '1.6'
                }}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '1rem',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1E293B'
            }}>
              Get Started in 4 Easy Steps
            </h2>
          </motion.div>

          <div style={{ position: 'relative' }}>
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                style={{
                  display: 'flex',
                  gap: '2rem',
                  marginBottom: idx < steps.length - 1 ? '3rem' : 0,
                  position: 'relative'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: 'white',
                      fontFamily: 'Space Grotesk, sans-serif',
                      boxShadow: '0 8px 24px rgba(110, 231, 183, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    {step.number}
                  </motion.div>
                  {idx < steps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '90px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '60px',
                      background: 'linear-gradient(180deg, #6EE7B7 0%, #3B82F6 100%)',
                      opacity: 0.3
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: '1rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    color: '#1E293B',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#64748B',
                    lineHeight: '1.6'
                  }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1.5rem',
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              Ready to Grow Your Classes?
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '2.5rem',
              lineHeight: '1.6'
            }}>
              Join hundreds of partners who trust rayy to fill their classes every week
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                color: 'white',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '20px',
                fontFamily: 'Outfit, sans-serif',
                border: 'none',
                boxShadow: '0 8px 24px rgba(110, 231, 183, 0.4)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              Start Your Free Account <CheckCircle size={22} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PartnerLanding;
