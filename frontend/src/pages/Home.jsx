import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SkeletonCard from '../components/SkeletonCard'

function Home() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // EMAIL CAPTURE STATE
  const [email, setEmail] = useState("")
  const [optIn, setOptIn] = useState(false)
  const [emailStatus, setEmailStatus] = useState("idle")

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setHasSearched(true);
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

  // --- CLICK TRACKER ---
  const handleProductClick = (productTitle, link) => {
    axios.post('http://127.0.0.1:8000/track-click', {
      product_title: productTitle,
      query: query || "unknown",
      link: link || "unknown"
    }).catch(err => console.error("Tracking error:", err));

    if (link) {
      window.open(link, '_blank');
    } else {
      console.warn("No link found for product");
    }
  }

  // --- EMAIL LOGIC ---
  const handleSaveProtocol = async () => {
    if (!email || !optIn) return;
    setEmailStatus("sending");
    
    try {
      const productData = results.map(r => ({
        title: r.metadata.title,
        link: r.metadata.link || "https://ventiko.app"
      }));

      await axios.post('http://127.0.0.1:8000/capture-email', {
        email: email,
        query: query,
        results: productData,
        opt_in: optIn
      });
      setEmailStatus("success");
    } catch (error) {
      console.error("Email Capture Failed:", error);
      setEmailStatus("error");
    }
  }

 
// --- DYNAMIC SEO TITLES ---
const getPageTitle = () => {
  if (query) return `${query} | Ventiko Product Finder`;
  return "Ventiko | Product Finder";
}

const getMetaDesc = () => {
  if (query) return `Find the best products for ${query}. AI-curated results.`;
  return "The AI-powered search engine for finding the right products you actually need.";
}

  return (
    <>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getMetaDesc()} />
      </Helmet>

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
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && results.map((item) => (
          <div 
            key={item.id} 
            className="card" 
            onClick={() => handleProductClick(item.metadata.title, item.metadata.link)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <h3>{item.metadata.title}</h3>
              <p>{item.metadata.description}</p>
            </div>
            <div className="card-footer">
              <span className="price">
                {item.metadata.price} {item.metadata.currency}
              </span>
              <span className="score" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                View Deal →
              </span>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div style={{ maxWidth: '600px', margin: '4rem auto 0 auto', textAlign: 'center', animation: 'fadeUp 1s ease'}}>
          {emailStatus === 'success' ? (
             <div style={{
               padding: '2rem', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #23F0C7', color: '#065f46'
             }}>
               <h3 style={{ fontFamily: 'Major Mono Display', margin: '0 0 0.5rem 0' }}>results sent</h3>
               <p style={{ margin: 0, fontFamily: 'Roboto' }}>check your inbox shortly.</p>
             </div>
          ) : (
             <div style={{
               padding: '2rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
             }}>
               <h3 style={{ fontFamily: 'Major Mono Display', color: '#2c3e50', marginTop: 0, fontSize: '1.1rem' }}>
                 save these results
               </h3>
               
               <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexDirection: 'column' }}>
                 <input 
                   type="email" 
                   placeholder="enter your email..."
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                 />
                 
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                    <input type="checkbox" id="optIn" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', boxShadow: 'none' }} />
                    <label htmlFor="optIn" style={{ fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                      I agree to the Terms of Service and consent to receive updates.
                    </label>
                 </div>
               </div>

               <button 
                 onClick={handleSaveProtocol}
                 disabled={!email || !optIn || emailStatus === 'sending'}
                 style={{
                    width: '100%', padding: '1rem',
                    background: emailStatus === 'sending' ? '#94a3b8' : '#2c3e50',
                    color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontFamily: 'Major Mono Display',
                    cursor: (!email || !optIn) ? 'not-allowed' : 'pointer', opacity: (!email || !optIn) ? 0.7 : 1, transition: 'all 0.2s'
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