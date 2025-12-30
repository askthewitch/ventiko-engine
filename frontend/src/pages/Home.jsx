import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
// We no longer need the Modal import

function Home() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // EMAIL CAPTURE STATE
  const [email, setEmail] = useState("")
  const [optIn, setOptIn] = useState(false)
  const [emailStatus, setEmailStatus] = useState("idle") // idle, sending, success, error

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setHasSearched(true);
    // Reset email state on new search
    setEmailStatus("idle");
    setEmail("");
    setOptIn(false);

    try {
      const response = await axios.get(`http://127.0.0.1:8000/search?query=${searchTerm}`);
      setResults(response.data.matches);
    } catch (error) {
      console.error("Error searching:", error);
      alert("System Busy. Please try again in a moment.");
    }
    setLoading(false);
  }

  useEffect(() => {
    const urlQuery = searchParams.get('query');
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams]);

  const handleSearchClick = () => {
    performSearch(query);
  }

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setEmailStatus("idle");
  }

  // --- DIRECT EMAIL LOGIC ---
  const handleSaveProtocol = async () => {
    if (!email || !optIn) {
      return; // Button is disabled anyway, but safety check
    }
    
    setEmailStatus("sending");
    
    try {
      const productTitles = results.map(r => r.metadata.title);

      await axios.post('http://127.0.0.1:8000/capture-email', {
        email: email,
        query: query,
        results: productTitles,
        opt_in: optIn
      });

      setEmailStatus("success");
      // We keep the success message visible so they know it worked
      setTimeout(() => {
         // Optional: Reset after 5 seconds if you want
      }, 5000);

    } catch (error) {
      console.error("Email Capture Failed:", error);
      setEmailStatus("error");
    }
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
            placeholder="We find what you need..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
          />
          {query.length > 0 && (
            <button className="clear-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>

        <button className="main-search-btn" onClick={handleSearchClick} disabled={loading}>
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

      {/* --- IN-LINE EMAIL CAPTURE ZONE --- */}
      {results.length > 0 && (
        <div style={{ 
          maxWidth: '600px', 
          margin: '4rem auto 0 auto', 
          textAlign: 'center',
          animation: 'fadeUp 1s ease'
        }}>
          
          {emailStatus === 'success' ? (
             // SUCCESS STATE
             <div style={{
               padding: '2rem',
               background: '#ecfdf5',
               borderRadius: '16px',
               border: '1px solid #23F0C7',
               color: '#065f46'
             }}>
               <h3 style={{ fontFamily: 'Major Mono Display', margin: '0 0 0.5rem 0' }}>results sent</h3>
               <p style={{ margin: 0, fontFamily: 'Roboto' }}>check your inbox shortly.</p>
             </div>
          ) : (
             // CAPTURE FORM
             <div style={{
               padding: '2rem',
               background: 'white',
               borderRadius: '20px',
               border: '1px solid #e2e8f0',
               boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
             }}>
               <h3 style={{ 
                 fontFamily: 'Major Mono Display', 
                 color: '#2c3e50', 
                 marginTop: 0,
                 fontSize: '1.1rem'
               }}>
                 save your results
               </h3>
               
               <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexDirection: 'column' }}>
                 <input 
                   type="email" 
                   placeholder="enter your email..."
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   style={{ 
                     width: '100%', 
                     padding: '1rem', 
                     borderRadius: '8px',
                     border: '1px solid #cbd5e1',
                     fontSize: '1rem',
                     boxSizing: 'border-box'
                   }}
                 />
                 
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                    <input 
                      type="checkbox" 
                      id="optIn" 
                      checked={optIn} 
                      onChange={(e) => setOptIn(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', boxShadow: 'none' }}
                    />
                    <label htmlFor="optIn" style={{ fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                    I agree to the Terms of Service and consent to receive updates and marketing from Ventiko and partners.
                    </label>
                 </div>
               </div>

               <button 
                 onClick={handleSaveProtocol}
                 disabled={!email || !optIn || emailStatus === 'sending'}
                 style={{
                    width: '100%',
                    padding: '1rem',
                    background: emailStatus === 'sending' ? '#94a3b8' : '#2c3e50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    fontFamily: 'Major Mono Display',
                    cursor: (!email || !optIn) ? 'not-allowed' : 'pointer',
                    opacity: (!email || !optIn) ? 0.7 : 1,
                    transition: 'all 0.2s'
                 }}
               >
                 {emailStatus === 'sending' ? 'sending...' : 'send'}
               </button>
             </div>
          )}
        </div>
      )}

      {hasSearched && results.length === 0 && !loading && (
        <p style={{textAlign: 'center', color: '#AAA1C8', fontFamily: 'Major Mono Display'}}>
          no matches found
        </p>
      )}
    </>
  )
}

export default Home