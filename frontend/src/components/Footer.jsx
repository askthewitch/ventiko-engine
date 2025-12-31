import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';

const Footer = () => {
  const [modalType, setModalType] = useState(null);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  // Helper style for legal text to keep it readable
  const legalTextStyle = {
    fontSize: '0.9rem',
    color: '#475569',
    marginBottom: '1rem',
    lineHeight: '1.6'
  };

  const legalHeadingStyle = {
    fontFamily: 'Major Mono Display',
    color: '#2c3e50',
    marginTop: '1.5rem',
    marginBottom: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold'
  };

  return (
    <>
      <footer className="site-footer">
        
        {/* GROUP 1: MAIN NAVIGATION (Real Pages) */}
        <div className="footer-group">
          <Link to="/" className="footer-link">HoMe</Link>
          <Link to="/about" className="footer-link">About</Link>
          <Link to="/blog" className="footer-link">bloG</Link> {/* CHANGED: Added Blog */}
          <Link to="/archive" className="footer-link">ARcHiVe</Link>
        </div>

        {/* Divider */}
        <div className="footer-divider">|</div>

        {/* GROUP 2: UTILITIES (Modals) */}
        <div className="footer-group">
          <button onClick={() => openModal('privacy')} className="footer-link-btn">pRiVAcy</button>
          <button onClick={() => openModal('terms')} className="footer-link-btn">teRMs</button>
          <button onClick={() => openModal('contact')} className="footer-link-btn">contAct</button>
        </div>

      </footer>

      {/* --- PRIVACY POLICY MODAL --- */}
      <Modal isOpen={modalType === 'privacy'} onClose={closeModal} title="privacy policy">
        <p style={legalTextStyle}><strong>Last Updated: December 2025</strong></p>
        
        <p style={legalTextStyle}>
          At Ventiko, we respect your privacy. This policy outlines how we handle your data when you use our Product Finder.
        </p>

        <h3 style={legalHeadingStyle}>1. data collection</h3>
        <p style={legalTextStyle}>
          <strong>Search Data:</strong> We store search queries anonymously to improve our AI engine and aggregated trends (the "Archive").<br/>
          <strong>Email Addresses:</strong> If you opt-in to receive results via email, we store your email address securely. We do not sell your email to third parties.
        </p>

        <h3 style={legalHeadingStyle}>2. affiliate tracking</h3>
        <p style={legalTextStyle}>
          When you click a link to a product, a tracking cookie may be placed on your device by the merchant (e.g., Awin, Amazon) to attribute the sale to Ventiko. This does not store personal information about you on our servers.
        </p>

        <h3 style={legalHeadingStyle}>3. your rights</h3>
        <p style={legalTextStyle}>
          You may request the deletion of your email data at any time by contacting support.
        </p>
      </Modal>

      {/* --- TERMS OF SERVICE MODAL --- */}
      <Modal isOpen={modalType === 'terms'} onClose={closeModal} title="terms of service">
        <p style={legalTextStyle}>
          By using Ventiko, you agree to the following terms.
        </p>

        <h3 style={legalHeadingStyle}>1. affiliate disclosure</h3>
        <p style={legalTextStyle}>
          Ventiko is a product discovery engine. We participate in various affiliate marketing programs, which means we may get paid commissions on editorially chosen products purchased through our links to retailer sites. This comes at no extra cost to you.
        </p>

        <h3 style={legalHeadingStyle}>2. not medical advice</h3>
        <p style={legalTextStyle}>
          The content provided by Ventiko is for informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>

        <h3 style={legalHeadingStyle}>3. no warranties</h3>
        <p style={legalTextStyle}>
          Our AI engine strives for accuracy, but product prices, stock, and ingredients change rapidly. Ventiko provides results on an "as is" basis without warranties of any kind.
        </p>
      </Modal>

      {/* --- CONTACT MODAL --- */}
      <Modal isOpen={modalType === 'contact'} onClose={closeModal} title="contact us">
        <p style={legalTextStyle}>
          Have a question, a partnership proposal, or a product you want listed?
        </p>
        
        <h3 style={legalHeadingStyle}>general enquiries</h3>
        <p style={legalTextStyle}>
          <a href="mailto:support@ventiko.app" style={{ color: '#23F0C7', textDecoration: 'none', fontWeight: 'bold' }}>
            support@ventiko.app
          </a>
        </p>

        <h3 style={legalHeadingStyle}>location</h3>
        <p style={legalTextStyle}>
          Ventiko Engine HQ<br/>
          Isle of Man, United Kingdom.
        </p>
      </Modal>
    </>
  );
};

export default Footer;