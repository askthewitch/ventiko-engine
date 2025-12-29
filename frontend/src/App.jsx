import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      // Talk to the Python Backend
      const response = await axios.get(`http://127.0.0.1:8000/search?query=${query}`);
      setResults(response.data.matches);
    } catch (error) {
      console.error("Error searching:", error);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Ventiko Engine</h1>
      
      {/* Search Bar Section */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your goal (e.g., help me sleep)..."
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#000', color: '#fff', border: 'none' }}
        >
          {loading ? "Thinking..." : "Search"}
        </button>
      </div>

      {/* Results Section */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {results.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.metadata.title}</h3>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>{item.metadata.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                {item.metadata.price} {item.metadata.currency}
              </span>
              <span style={{ fontSize: '12px', background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>
                Match Score: {(item.score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App