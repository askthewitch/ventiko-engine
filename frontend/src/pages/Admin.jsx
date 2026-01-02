import { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

function Admin() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // NOTE: We send the password as a custom header 'x-admin-secret'
      const res = await axios.get('https://ventiko-engine-backend.onrender.com/admin-data', {
        headers: {
          'x-admin-secret': secret
        }
      });
      
      setData(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setError('Access Denied: Incorrect Secret Key');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <Helmet>
          <title>Ventiko Admin | Restricted Access</title>
          <meta name="robots" content="noindex" />
        </Helmet>

        <h1 style={{ fontSize: '2rem' }}>restricted</h1>
        <p style={{ fontFamily: 'Roboto', marginBottom: '2rem', color: '#64748b' }}>
          Ventiko Command Center
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="password" 
            placeholder="Enter Admin Secret..." 
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="main-search-btn"
            style={{ width: '100%' }}
          >
            {loading ? "Verifying..." : "Access Vault"}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '1rem', fontFamily: 'Roboto' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <Helmet>
        <title>Ventiko Dashboard</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 0 }}>dasHboaRd</h1>
        <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          Log Out
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid" style={{ marginBottom: '4rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#64748b', fontSize: '1rem' }}>Total Leads</h3>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#2c3e50' }}>
            {data.stats.total_leads}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#64748b', fontSize: '1rem' }}>Total Clicks</h3>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#23F0C7' }}>
            {data.stats.total_clicks}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#64748b', fontSize: '1rem' }}>Conversion Rate</h3>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#8b5cf6' }}>
            {data.stats.total_clicks > 0 
              ? ((data.stats.total_leads / data.stats.total_clicks) * 100).toFixed(1) + '%' 
              : '0%'}
          </div>
        </div>
      </div>

      {/* LEADS TABLE */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'Major Mono Display', marginBottom: '1.5rem', color: '#2c3e50' }}>
          recent leads (emails)
        </h2>
        <div style={{ overflowX: 'auto', background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Roboto', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#94a3b8' }}>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Query</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>{new Date(lead.timestamp).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{lead.email}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{lead.query}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.leads.length === 0 && <p style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>No leads yet.</p>}
        </div>
      </section>

      {/* CLICKS TABLE */}
      <section>
        <h2 style={{ fontFamily: 'Major Mono Display', marginBottom: '1.5rem', color: '#23F0C7' }}>
          click log (Money)
        </h2>
        <div style={{ overflowX: 'auto', background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Roboto', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#94a3b8' }}>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>Product</th>
                <th style={{ padding: '1rem' }}>Search Term</th>
              </tr>
            </thead>
            <tbody>
              {data.clicks.map((click) => (
                <tr key={click.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>{new Date(click.timestamp).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{click.product_title}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{click.query}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.clicks.length === 0 && <p style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>No clicks yet.</p>}
        </div>
      </section>

    </div>
  );
}

export default Admin;