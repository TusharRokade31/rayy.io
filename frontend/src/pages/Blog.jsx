import React from 'react';
import Navbar from '../components/Navbar';
import { BookOpen, TrendingUp, Users } from 'lucide-react';

const Blog = () => {
  const blogPosts = [
    {
      title: 'How to Choose the Right Class for Your Child',
      excerpt: 'A comprehensive guide to finding activities that match your child\'s interests and developmental stage.',
      category: 'Parenting',
      date: 'Jan 15, 2025',
      readTime: '5 min read'
    },
    {
      title: 'The Benefits of Early Coding Education',
      excerpt: 'Why introducing coding concepts early can boost problem-solving skills and creativity.',
      category: 'Education',
      date: 'Jan 10, 2025',
      readTime: '7 min read'
    },
    {
      title: 'Partner Success Story: From 10 to 100 Students',
      excerpt: 'How one dance studio grew their student base using rayy\'s platform.',
      category: 'Success Stories',
      date: 'Jan 5, 2025',
      readTime: '4 min read'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />
      
      <div className="mobile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
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
            rayy Blog
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto' }}>
            Stories, insights, and tips for learners, parents, and partners
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {blogPosts.map((post, idx) => (
            <div key={idx} style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={60} color="white" />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#64748B'
                }}>
                  <span style={{
                    background: '#F0F9FF',
                    color: '#0891B2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>{post.category}</span>
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  {post.title}
                </h3>
                <p style={{ color: '#64748B', lineHeight: '1.6' }}>
                  {post.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '16px'
        }}>
          <p style={{ color: '#64748B', fontSize: '1.1rem' }}>
            More articles coming soon! Follow us on social media for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blog;