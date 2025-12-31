import { useState } from 'react'
import { useNavigate } from 'react-router-dom' // CHANGED: Added hook

function About() {
  const navigate = useNavigate(); // CHANGED: Initialize hook

  // FAQ Data Structure
  const faqs = [
    {
      question: "How are you different to Amazon or any other website?", 
      answer: "We are changing the game, we all like a little browse sometimes, but we know what we want and we want it now. We found shoppers were getting fed up with browsing, so we founded our deeply trained AI based product finder, to listen to you, and give you what you want. We do not own any products, we are an affiliate marketplace who will guide you to the best products. We basically, do the hard work for you, then we cheer and shout for you when you cross that finish line, we tell you how radiant your new skin routine looks and at Team Ventiko, we are always wanting more, so we expect you to be the same."
    },
    {
      question: "Why should i use Ventiko?", 
      answer: "Ventiko is basically your personal shopper, gone are the days searching and scrolling, we want you winning now. Ventiko partners with trusted global partners, and is trained to deliver the best products for you, right now. We don't want you to search 'running trainers' or 'electrolytes' or 'best protein for gains?' No, we want you to tell us why you are here and what you actually want 'I am training for my first half marathon in June, what trainers would be best for me?' and 'I am hitting the gym hard this year, what supplements should I take to keep me going and get stronger day after day?' You can also mix it up 'I am training for my next hyrox, I need a matching outfit, energy tablets for just before I start, and a nice moisteriser for when I finish to feel amazing!' All will work with Ventiko. We are the new way to shop."
    },
    {
      question: "what is bio-optimization?", 
      answer: "Bio-optimization is the systematic application of science, technology, and nature to improve human performance. Unlike 'bio-hacking' which often implies shortcuts, bio-optimization focuses on sustainable, long-term physiological improvements through protocols, supplements, and tools."
    },
    {
      question: "how does ventiko work?",
      answer: "We aggregate thousands of health products from trusted global suppliers. Our engine uses Vector Search (AI) to understand the 'context' of what you need (e.g., 'sleep recovery') rather than just matching keywords. We curate, you optimize."
    },
    {
      question: "are these products verified?",
      answer: "Ventiko indexes products from reputable affiliate networks. While we filter for quality brands, we always recommend consulting with a medical professional before starting any new supplement or health protocol."
    },
    {
      question: "do you offer medical advice?",
      answer: "No. Ventiko is a search engine and information aggregator. The content found here is for educational and informational purposes only."
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* SECTION 1: THE MISSION */}
      <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1>about Ventiko</h1>
        
        {/* CHANGED: ADDED NAVIGATION BUTTON */}
        <button 
          onClick={() => navigate('/')}
          className="main-search-btn"
          style={{ marginBottom: '2rem', fontSize: '0.9rem', padding: '0.6rem 2rem' }}
        >
          ← start a new search
        </button>

        <p style={{ 
          fontFamily: 'Roboto, sans-serif', 
          fontSize: '1.1rem', 
          lineHeight: '1.8', 
          color: '#475569',
          marginBottom: '2rem'
        }}>
          Ventiko is not a store. It is a product finder, that <strong>actually works for you</strong>.
          <br /><br />
          In an era of information overload, finding the specific tools for performance, sleep, 
          focus, skin care, recovery and more, is too overwhelming. We cut through the noise using 
          high-dimensional vector analysis to bring you the exact tools 
          required for you to win. (And yes we are free to use, forever).
        </p>
      </section>

      {/* SECTION 2: THE FAQ ACCORDION */}
      <section>
        <h2 style={{ 
          fontFamily: 'Major Mono Display, monospace', 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#2c3e50'
        }}>
          Ventiko f.a.q.
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              onClick={() => toggleFAQ(index)}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: openIndex === index ? '0 10px 30px rgba(35, 240, 199, 0.15)' : 'none',
                borderColor: openIndex === index ? '#23F0C7' : '#e2e8f0'
              }}
            >
              {/* Question Header */}
              <div style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontFamily: 'Major Mono Display, monospace',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                {faq.question}
                <span style={{ color: '#23F0C7', fontSize: '1.5rem' }}>
                  {openIndex === index ? '-' : '+'}
                </span>
              </div>

              {/* Answer Body */}
              {openIndex === index && (
                <div style={{ 
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  fontFamily: 'Roboto, sans-serif',
                  color: '#64748b',
                  lineHeight: '1.6',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default About