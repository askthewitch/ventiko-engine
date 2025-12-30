import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Archive() {
  const navigate = useNavigate();
  const [archiveData, setArchiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the history when page loads
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/archive');
        setArchiveData(res.data);
      } catch (error) {
        console.error("Failed to load archive", error);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  // Allow clicking a past query to search it again
  const runSearch = (term) => {
    // Navigate to home with the search term. 
    // We will need to update Home.jsx next to handle this "?query=" parameter.
    navigate(`/?query=${encodeURIComponent(term)}`); 
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <section style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1>live archive</h1>
        <p style={{ fontFamily: 'Roboto', color: '#64748b' }}>
          real-time optimization requests from the community
        </p>
      </section>

      {loading ? (
        <p style={{ textAlign: 'center', fontFamily: 'Major Mono Display' }}>loading feed...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {archiveData.length === 0 && (
            <p style={{ textAlign: 'center', color: '#AAA1C8' }}>NO DATA YET. BE THE FIRST.</p>
          )}

          {archiveData.map((log) => (
            <div 
              key={log.id} 
              onClick={() => runSearch(log.query)}
              style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#23F0C7'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {/* THE QUERY (What they searched) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontFamily: 'Major Mono Display', 
                  fontSize: '1.1rem', 
                  color: '#2c3e50',
                  fontWeight: 'bold'
                }}>
                  "{log.query.toLowerCase()}"
                </span>
                
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </div>

              {/* THE RESULTS (What we found) */}
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#64748b', 
                fontFamily: 'Roboto',
                background: '#f8fafc',
                padding: '10px',
                borderRadius: '8px'
              }}>
                <strong style={{ color: '#23F0C7' }}>results:</strong> {log.results_summary.toLowerCase()}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Archive