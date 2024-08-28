import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTagContext } from '../TagContext';
import '../styles/RecentAlbumsSection.css';

function RecentAlbumsSection() {
  const [albums, setAlbums] = useState([]);
  const { updateSelectedTags } = useTagContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/albums?limit=5')
      .then(response => response.json())
      .then(data => setAlbums(data))
      .catch(error => console.error('Error fetching albums:', error));
  }, []);

  const handleTagClick = (tag, category) => {
    updateSelectedTags(tag.toLowerCase(), category);
    navigate('/album');
  };

  const renderUniqueTagButtons = (tags, category, albumCode) => {
    const uniqueTags = new Set();
    return tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')  // 빈 문자열 제거
      .filter(tag => {
        const lowercaseTag = tag.toLowerCase();
        if (!uniqueTags.has(lowercaseTag)) {
          uniqueTags.add(lowercaseTag);
          return true;
        }
        return false;
      })
      .map(tag => (
        <button
          key={`${albumCode}-${tag}-${category}`}
          className={`recent-tag-button${category === 'genre' ? '-genre' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            handleTagClick(tag, category);
          }}
        >
          {tag}
        </button>
      ));
  };

  return (
    <div className="recent-albums-section">
      <h2>New Release</h2>
      <div className="recent-albums-container">
        {albums.map((album) => (
          <Link to={`/album/${album['ALBUM: Code']}`} key={album['ALBUM: Code']} className="recent-album-card">
            <div className="recent-album-artwork">
              {album.has_artwork && (
                <img
                  src={`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/artwork/${album['ALBUM: Code']}`}
                  alt={`${album['ALBUM: Title']} cover`}
                />
              )}
            </div>
            <h3>{album['ALBUM: Title']}</h3>
            <p></p>
            <div className="recent-tag-container">
              {renderUniqueTagButtons(album['ALBUM: Description'], 'description', album['ALBUM: Code'])}
              {renderUniqueTagButtons(album['TRACK: Genre'], 'genre', album['ALBUM: Code'])}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecentAlbumsSection;