import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';

const Footer = () => {
  const [modalType, setModalType] = useState(null);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <>
      <footer className="site-footer">
        
        {/* GROUP 1: MAIN NAVIGATION (Real Pages) */}
        <div className="footer-group">
          <Link to="/" className="footer-link">HoMe</Link>
          <Link to="/about" className="footer-link">About</Link>
          <Link to="/archive" className="footer-link">ARcHiVe</Link>
        </div>

        {/* Divider for visual separation (optional, but looks cool) */}
        <div className="footer-divider">|</div>

        {/* GROUP 2: UTILITIES (Modals) */}
        <div className="footer-group">
          <button onClick={() => openModal('privacy')} className="footer-link-btn">pRiVAcy</button>
          <button onClick={() => openModal('terms')} className="footer-link-btn">teRMs</button>
          <button onClick={() => openModal('contact')} className="footer-link-btn">contAct</button>
        </div>

      </footer>

      {/* --- MODALS REMAIN THE SAME --- */}
      <Modal isOpen={modalType === 'privacy'} onClose={closeModal} title="privacy policy">
        <p><strong>Last Updated: December 2025</strong></p>
        <p>At Ventiko, we value your privacy. We do not store your personal search data. Our database consists of bio-optimization protocols aggregated from public sources.</p>
        <p>We use local storage for your preferences and standard analytics to improve the engine.</p>
      </Modal>

      <Modal isOpen={modalType === 'terms'} onClose={closeModal} title="terms of service">
        <p><strong>1. Disclaimer</strong></p>
        <p>Ventiko is a search engine for educational purposes. We are not doctors. All protocols found here should be discussed with a medical professional.</p>
        <p><strong>2. Affiliate Links</strong></p>
        <p>Some results may contain affiliate links. This supports our server costs at no extra cost to you.</p>
      </Modal>

      <Modal isOpen={modalType === 'contact'} onClose={closeModal} title="contact us">
        <p>Have a question or a new protocol to suggest?</p>
        <p><strong>Email:</strong> support@ventiko.com</p>
        <p><strong>Location:</strong> London, UK</p>
      </Modal>
    </>
  );
};

export default Footer;