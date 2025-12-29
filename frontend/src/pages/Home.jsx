import { useState } from 'react'
import axios from 'axios'

function Home() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/search?query=${query}`);
      setResults(response.data.matches);
    } catch (error) {
      console.error("Error searching:", error);
      alert("System Busy. Please try again in a moment.");
    }
    setLoading(false);
  }

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  }

  return (
    <>
      <h1>Ventiko</h1>
      
      <div className="search-container">
        <div className="input-wrapper">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What can we find for you today?"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {query.length > 0 && (
            <button className="clear-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>

        <button className="main-search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? "scanning..." : "search"}
        </button>
      </div>

      <div className="grid">
        {results.map((item) => (
          <div key={item.id} className="card">
            <div>
              <h3>{item.metadata.title}</h3>
              <p>{item.metadata.description}</p>
            </div>
            <div className="card-footer">
              <span className="price">
                {item.metadata.price} {item.metadata.currency}
              </span>
              <span className="score">
                Match: {(item.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasSearched && results.length === 0 && !loading && (
        <p style={{textAlign: 'center', color: '#AAA1C8', fontFamily: 'Major Mono Display'}}>
          no matches found
        </p>
      )}
    </>
  )
}

export default Home