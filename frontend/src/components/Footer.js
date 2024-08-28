import React from 'react';
import '../styles/Footer.css';

function Footer({ onAdminClick }) {
  return (
    <footer>
      <div className="footer-content">
        <p className="legal-notice">
          All Lapis works on Modoofind  |  international@modoofind.com  |  7F 63, World Cup buk-ro, Mapo-gu, Seoul, Republic of Korea  |  This website is optimized for desktop viewing 
        </p>
      </div>
      <button onClick={onAdminClick} className="admin-icon">
        <i className="material-icons">settings</i>
      </button>
    </footer>
  );
}

export default Footer;