import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import logoImage from '../styles/LAPIS.png'; 

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleAlbumClick = (e) => {
    e.preventDefault();
    window.location.href = '/album';
  };

  return (
    <header>
      <div className="header-content">
        <div className="logo-container">
          <Link to="/" className="logo">
            <img src={logoImage} alt="Lapis Logo" />
          </Link>
        </div>
        <nav>
          <ul>
            <li><Link to="/news">NEWS</Link></li>
            <li><a href="/album" onClick={handleAlbumClick}>ALBUM</a></li>
          </ul>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </nav>
      </div>
    </header>
  );
}

export default Header;