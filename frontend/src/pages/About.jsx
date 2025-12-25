import React from 'react';
import Navbar from '../components/Navbar';
import { Users, Target, Heart, Award } from 'lucide-react';

const About = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="mobile-heading-xl" style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Outfit, sans-serif'
          }}>
            About rayy
          </h1>
          <p className="mobile-text" style={{
            fontSize: '1.25rem',
            color: '#64748B',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            We're on a mission to make quality learning accessible, fun, and personalized for every child from ages 1-24.
          </p>
        </div>

        {/* Mission Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          marginBottom: '3rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Target size={40} color="white" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Our Mission
              </h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>
                Connect learners with the best instructors and classes that spark curiosity and build lifelong skills.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Heart size={40} color="white" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Our Values
              </h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>
                Quality, safety, accessibility, and fun guide everything we do to create the best learning experience.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Users size={40} color="white" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Our Community
              </h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>
                A growing network of passionate educators, curious learners, and supportive parents building the future together.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div style={{
          background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
          borderRadius: '20px',
          padding: '3rem',
          color: 'white',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Our Story
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1rem' }}>
            rayy was born from a simple observation: finding quality classes for kids shouldn't be this hard. 
            Parents were spending hours researching, calling, and comparing options. Educators had amazing programs 
            but struggled to reach the right students.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            We built rayy to bridge this gap - a platform where discovery is instant, booking is simple, 
            and every child can explore their potential through art, coding, sports, music, and more.
          </p>
        </div>

        {/* Stats Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          {[
            { label: 'Happy Learners', value: '10,000+' },
            { label: 'Partner Studios', value: '500+' },
            { label: 'Classes Available', value: '5,000+' },
            { label: 'Cities', value: '25+' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem',
                fontFamily: 'Outfit, sans-serif'
              }}>
                {stat.value}
              </div>
              <div style={{ color: '#64748B', fontWeight: '600' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
