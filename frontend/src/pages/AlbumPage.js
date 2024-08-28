import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTagContext } from '../TagContext';
import { formatTag, formatTags } from '../utils/tagFormatting';
import '../styles/AlbumPage.css';
import { useAlbumContext } from '../AlbumContext';

function AlbumPage() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { selectedTags, updateSelectedTags, clearAllTags } = useTagContext();
    const { updateCounts } = useAlbumContext();
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [fadeState, setFadeState] = useState('fade-in');

    const noAlbumsMessages = [
        "No albums found matching the selected criteria.",
        "선택한 기준에 맞는 앨범을 찾을 수 없습니다.",
        "選択した基準に合うアルバムが見つかりません。",
        "Aucun album trouvé correspondant aux critères sélectionnés."
    ];

    useEffect(() => {
        fetch('http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/albums')
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            const sortedAlbums = data.sort((a, b) => b['ALBUM: Code'].localeCompare(a['ALBUM: Code']));
            setAlbums(sortedAlbums);
            updateCounts(sortedAlbums);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching albums:', error);
            setError(error.message);
            setLoading(false);
          });
    }, [updateCounts]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setFadeState('fade-out');
            setTimeout(() => {
                setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % noAlbumsMessages.length);
                setFadeState('fade-in');
            }, 500); // 페이드 아웃 후 메시지 변경
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const normalizeTag = (tag) => tag.trim().toLowerCase();

    const filteredAlbums = albums.filter(album => {
        const descriptionTags = album['ALBUM: Description'].split(',').map(normalizeTag);
        const genreTags = album['TRACK: Genre'].split(',').map(normalizeTag);

        const descriptionMatch = selectedTags.description.length === 0 || 
            selectedTags.description.every(tag => descriptionTags.includes(tag));
        const genreMatch = selectedTags.genre.length === 0 || 
            selectedTags.genre.every(tag => genreTags.includes(tag));

        return descriptionMatch && genreMatch;
    });



    const handleTagClick = (tag, category) => {
        updateSelectedTags(normalizeTag(tag), category);
    };

    const renderActiveTags = () => {
        const hasSelectedTags = selectedTags.description.length > 0 || selectedTags.genre.length > 0;
        
        return (
            <div className="active-tags">
                {selectedTags.description.map(tag => (
                    <button 
                        key={`description-${tag}`}
                        className="active-tag-button description"
                        onClick={() => handleTagClick(tag, 'description')}
                    >
                        {formatTag(tag)}
                    </button>
                ))}
                {selectedTags.genre.map(tag => (
                    <button 
                        key={`genre-${tag}`}
                        className="active-tag-button genre"
                        onClick={() => handleTagClick(tag, 'genre')}
                    >
                        {formatTag(tag)}
                    </button>
                ))}
                {hasSelectedTags && (
                    <button 
                        className="reset-all-tags-button"
                        onClick={clearAllTags}
                    >
                        Clear
                    </button>
                )}
            </div>
        );
    };
    const renderAlbumTags = (description, genre, albumCode) => {
        const renderUniqueTagButtons = (tags, category) => {
            const uniqueTags = new Set();
            return tags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '')
                .filter(tag => {
                    const lowercaseTag = tag.toLowerCase();
                    if (!uniqueTags.has(lowercaseTag)) {
                        uniqueTags.add(lowercaseTag);
                        return true;
                    }
                    return false;
                })
                .map(tag => {
                    const isActive = selectedTags[category].includes(normalizeTag(tag));
                    return (
                        <button
                            key={`${albumCode}-${tag}-${category}`}
                            className={`tag-button ${category} ${isActive ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleTagClick(tag, category);
                            }}
                        >
                            {formatTag(tag)}
                        </button>
                    );
                });
        };

        return (
            <>
                {renderUniqueTagButtons(formatTags(description), 'description')}
                {renderUniqueTagButtons(formatTags(genre), 'genre')}
            </>
        );
    };

    if (loading) return <div className="loading">Loading albums...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="album-page">
            <div className="album-page-header">
                <h1>All Albums</h1>
                {renderActiveTags()}
            </div>
            {filteredAlbums.length === 0 ? (
                <div className={`no-results ${fadeState}`}>
                    {noAlbumsMessages[currentMessageIndex]}
                </div>
            ) : (
                <div className="albums-grid">
                    {filteredAlbums.map((album) => (
                        <Link to={`/album/${album['ALBUM: Code']}`} key={album['ALBUM: Code']} className="album-card">
                            <div className="album-artwork">
                                {album.has_artwork && (
                                    <img
                                        src={`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/artwork/${album['ALBUM: Code']}`}
                                        alt={`${album['ALBUM: Title']} cover`}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/path/to/placeholder-image.jpg';
                                        }}
                                    />
                                )}
                            </div>
                            <h3>{album['ALBUM: Title']}</h3>
                            <p></p>
                            <div className="tag-container">
                                {renderAlbumTags(album['ALBUM: Description'], album['TRACK: Genre'], album['ALBUM: Code'])}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AlbumPage;


