import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SkeletonCard from '../components/SkeletonCard'
import TypewriterInput from '../components/TypewriterInput'

function Home() {
  const { searchTerm } = useParams(); 
  const navigate = useNavigate();     
  
  const [query, setQuery] = useState(searchTerm || "") 
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  
  // EMAIL CAPTURE STATE
  const [email, setEmail] = useState("")
  const [optIn, setOptIn] = useState(false)
  const [emailStatus, setEmailStatus] = useState("idle")

  // --- PLACEHOLDERS ---
  const placeholders = [
    "We find what you need...",
    "I need a new pair of running trainers suitable for a half marathon",
    "What is the best protein powder for a vegan looking to get stronger",
    "I want a natural face cleanser that will help me glow"
  ];

  // --- 1. SEARCH LOGIC ---
  const performSearch = async (term) => {
    if (!term) return;
    setLoading(true);
    setEmailStatus("idle");
    setEmail("");
    setOptIn(false);

    try {
      const response = await axios.get(`http://127.0.0.1:8000/search?query=${term}`);
      setResults(response.data.matches);
    } catch (error) {
      console.error("Error searching:", error);
    }
    setLoading(false);
  }

  // --- 2. URL HANDLER ---
  useEffect(() => {
    if (searchTerm) {
      setQuery(searchTerm); 
      performSearch(searchTerm);
    } else {
      setResults([]);
      setQuery("");
    }
  }, [searchTerm]);

  // --- 3. INPUT HANDLER ---
  const handleSearchClick = () => {
    if (!query.trim()) return;
    navigate(`/s/${encodeURIComponent(query)}`);
  };

  const clearSearch = () => {
    setQuery("");
    navigate("/"); 
  };

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
  
  // --- SEO HELPERS ---
  const getPageTitle = () => {
    if (searchTerm) {
      const cleanTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
      return `Best ${cleanTerm} Products (2025) | Ventiko Finder`;
    }
    return "Ventiko | The AI Product Discovery Engine";
  }

  const getMetaDesc = () => {
    if (searchTerm) return `Don't just search. Find the best ${searchTerm} with Ventiko's AI analysis. Compare top-rated products, prices, and availability instantly.`;
    return "Ventiko is the AI-powered search engine for health & performance. We curate the best products so you don't have to.";
  }

  // --- SCHEMA GENERATION ---
  const getSchemaJSON = () => {
    if (!searchTerm || results.length === 0) return null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Best results for ${searchTerm}`,
      "itemListElement": results.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": item.metadata.title,
          "description": item.metadata.description,
          "image": item.metadata.large_image || "", 
          "offers": {
            "@type": "Offer",
            "price": item.metadata.price,
            "priceCurrency": item.metadata.currency,
            "availability": "https://schema.org/InStock",
            "url": item.metadata.link
          }
        }
      }))
    };
    
    console.log("SCHEMA GENERATED FOR GOOGLE:", schema); 
    return JSON.stringify(schema);
  };

  const schemaString = getSchemaJSON();

  return (
    <>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getMetaDesc()} />
        <link rel="canonical" href={searchTerm ? `https://ventiko.app/s/${searchTerm}` : `https://ventiko.app`} />
        {/* NOTE: Script tag moved out of Helmet to body below */}
      </Helmet>

      <h1>Ventiko</h1>
      
      <div className="search-container">
        <div className="input-wrapper">
          <TypewriterInput 
            placeholders={placeholders}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
{/* GEO CONTEXT WRAPPER: Helps AI understand the intent of the list */}
{!loading && searchTerm && results.length > 0 && (
        <div style={{ 
          maxWidth: '800px', margin: '0 auto 2rem auto', 
          fontFamily: 'Roboto', color: '#64748b', fontSize: '0.95rem',
          borderLeft: '3px solid #23F0C7', paddingLeft: '1rem'
        }}>
          Protocol generated for <strong style={{color: '#2c3e50'}}>{searchTerm}</strong>. 
          Analyzing {results.length} bio-optimized matches based on clinical efficacy and user reviews.
        </div>
      )}

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

      {searchTerm && results.length === 0 && !loading && (
        <div style={{textAlign: 'center', marginTop: '3rem', animation: 'fadeUp 0.5s ease'}}>
           <p style={{ color: '#AAA1C8', fontFamily: 'Major Mono Display', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
             no matches found
           </p>
           <p style={{ fontFamily: 'Roboto', color: '#64748b', fontSize: '0.9rem' }}>
             Try a broader search (e.g. "sleep" instead of "lavender spray").
           </p>
        </div>
      )}

      {/* --- SEO SCRIPT INJECTION (BODY LOCATION) --- */}
      {/* This will render at the bottom of the DOM, bypassing Helmet sanitization */}
      {schemaString && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: schemaString }} 
        />
      )}
    </>
  )
}

export default Home