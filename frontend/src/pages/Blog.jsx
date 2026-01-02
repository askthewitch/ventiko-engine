import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async' // IMPORT ADDED

function Blog() {
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      slug: "hyrox-beginners-guide",
      title: "The Complete Hyrox Protocol: Gear, Fuel & Recovery",
      excerpt: "Competing in your first Hyrox? Here is the exact bio-optimization strategy used by elite athletes to crush the Roxzone.",
      date: "Dec 30, 2025",
      readTime: "5 min read",
      category: "Performance"
    },
    {
      id: 2,
      slug: "sleep-stack-science",
      title: "Why Magnesium Glycinate is Not Enough",
      excerpt: "The truth about sleep stacks. We analyze the synergy between L-Theanine, Apigenin, and Magnesium for deep REM cycles.",
      date: "Dec 29, 2025",
      readTime: "4 min read",
      category: "Sleep"
    },
    {
      id: 3,
      slug: "morning-routine-cortisol",
      title: "Optimizing Your Morning Cortisol Awakening Response",
      excerpt: "Stop drinking coffee immediately. Here is the science-backed protocol for morning light exposure and hydration.",
      date: "Dec 28, 2025",
      readTime: "6 min read",
      category: "Focus"
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* SEO METADATA INJECTION */}
      <Helmet>
  <title>Ventiko Insights | Product Guides & Reviews</title>
  <meta name="description" content="Deep dives into product analysis, gear comparisons, and AI-curated shopping guides." />
  <link rel="canonical" href="https://ventiko.app/blog" />
</Helmet>
      {/* HEADER */}
      <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1>the bloG</h1>
        
        <button 
          onClick={() => navigate('/')}
          className="main-search-btn"
          style={{ marginBottom: '2rem', fontSize: '0.9rem', padding: '0.6rem 2rem' }}
        >
          ← start new search
        </button>

        <p style={{ 
          fontFamily: 'Roboto, sans-serif', 
          fontSize: '1.1rem', 
          color: '#475569'
        }}>
          Optimization strategies, clinical research, and gear analysis.
        </p>
      </section>

      {/* ARTICLE GRID */}
      <div className="grid">
        {articles.map((article) => (
          <div 
            key={article.id}
            className="card"
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between' 
            }}
            onClick={() => alert("Article Reader Coming in Phase 20!")} 
          >
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#23F0C7', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '0.5rem'
              }}>
                {article.category}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', lineHeight: '1.4', marginBottom: '1rem' }}>
                {article.title}
              </h3>
              
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                {article.excerpt}
              </p>
            </div>

            <div style={{ 
              borderTop: '1px solid #f1f5f9', 
              paddingTop: '1rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '0.8rem',
              color: '#94a3b8'
            }}>
              <span>{article.date}</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Blog