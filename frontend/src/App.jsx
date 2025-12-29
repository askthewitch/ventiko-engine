import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

// Import Pages
import Home from './pages/Home'
import About from './pages/About'
import Archive from './pages/Archive'

function App() {
  return (
    <Router>
      {/* NAVIGATION BAR 
        Top right corner, sitting above the dots (zIndex 10)
      */}
      <nav style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '40px', 
        display: 'flex', 
        gap: '20px',
        zIndex: 10 
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', fontSize: '0.9rem' }}>HOME</Link>
        <Link to="/about" style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', fontSize: '0.9rem' }}>ABOUT</Link>
        <Link to="/archive" style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', fontSize: '0.9rem' }}>ARCHIVE</Link>
      </nav>

      {/* THE PAGE SWITCHER */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/archive" element={<Archive />} />
      </Routes>

    </Router>
  )
}

export default App