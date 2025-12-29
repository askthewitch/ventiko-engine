import { useNavigate } from 'react-router-dom';

function Archive() {
  const navigate = useNavigate();

  // Function to drive traffic back to the engine
  const runProtocol = (term) => {
    navigate('/'); 
  };

  const protocols = [
    {
      title: "sleep architecture",
      date: "v1.0 // 2025",
      summary: "Optimizing REM and Deep Wave cycles requires thermal regulation and magnesium availability. This protocol targets the 90-minute ultradian rhythm.",
      tags: ["magnesium", "circadian", "thermal"]
    },
    {
      title: "cortisol management",
      date: "v1.2 // 2025",
      summary: "Chronic cortisol elevation degrades muscle protein and cognitive function. This stack focuses on adaptogens like Ashwagandha to blunt the stress response.",
      tags: ["adaptogens", "adrenal", "recovery"]
    },
    {
      title: "cognitive drive",
      date: "v2.0 // 2025",
      summary: "Sustained focus without the caffeine crash. Utilizing L-Theanine and Lion's Mane to support acetylcholine production and neuroplasticity.",
      tags: ["nootropics", "focus", "flow"]
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <section style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1>archive</h1>
        <p style={{ fontFamily: 'Roboto', color: '#64748b' }}>
          previous optimization stacks & research
        </p>
      </section>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {protocols.map((p, i) => (
          <div key={i} style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Major Mono Display', fontSize: '1.2rem', margin: 0, color: '#2c3e50' }}>
                {p.title}
              </h2>
              <span style={{ fontFamily: 'Major Mono Display', fontSize: '0.7rem', color: '#AAA1C8' }}>
                {p.date}
              </span>
            </div>
            
            <p style={{ fontFamily: 'Roboto', lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
              {p.summary}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* TAGS */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {p.tags.map(tag => (
                  <span key={tag} style={{ 
                    fontSize: '0.75rem', 
                    background: '#f1f5f9', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    color: '#64748b',
                    fontFamily: 'Major Mono Display'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={() => runProtocol(p.tags[0])}
                style={{
                  background: 'none',
                  border: '1px solid #23F0C7',
                  color: '#2c3e50',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontFamily: 'Major Mono Display',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#23F0C7';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#2c3e50';
                }}
              >
                initiate {'->'}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Archive