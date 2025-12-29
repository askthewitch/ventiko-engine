import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Import Pages
import Home from './pages/Home'
import About from './pages/About'
import Archive from './pages/Archive'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      {/* NO TOP NAV! 
         It is cleaner this way. Focus is 100% on the Search.
      */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/archive" element={<Archive />} />
      </Routes>

      <Footer /> 

    </Router>
  )
}

export default App