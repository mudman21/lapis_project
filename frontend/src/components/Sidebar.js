import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTagContext } from '../TagContext';
import { formatTag } from '../utils/tagFormatting';
import '../styles/Sidebar.css';
import { API_BASE_URL } from '../constants';

function Sidebar() {
    const [tags, setTags] = useState({ description: [], genre: [] });
    const { selectedTags, updateSelectedTags, clearSelectedTags } = useTagContext();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/all_tags`)
            .then(response => response.json())
            .then(data => {
                setTags({
                    description: removeDuplicates(data.description),
                    genre: removeDuplicates(data.genre)
                });
            })
            .catch(error => console.error('Error fetching tags:', error));
    }, []);

    const removeDuplicates = (tagList) => {
        const uniqueTags = new Set();
        return tagList.filter(tag => {
            const lowercaseTag = tag.toLowerCase().trim();
            if (lowercaseTag && !uniqueTags.has(lowercaseTag)) {
                uniqueTags.add(lowercaseTag);
                return true;
            }
            return false;
        });
    };

    const handleTagClick = (tag, category) => {
        updateSelectedTags(tag.toLowerCase(), category);
        navigate('/album');
    };

    const renderTags = (tags, category) => {
        return tags.map((tag, index) => {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
                const isSelected = selectedTags[category].includes(trimmedTag.toLowerCase());
                return (
                    <button 
                        key={index} 
                        className={`tag-filter-button ${category} ${isSelected ? 'active' : ''}`}
                        onClick={() => handleTagClick(trimmedTag, category)}
                    >
                        {formatTag(trimmedTag)}
                    </button>
                );
            }
            return null;
        }).filter(Boolean);
    };

    return (
        <div className="sidebar-container">
            <div className="sidebar-trigger">&gt;</div>
            <div className="sidebar">
                <div className="tag-categories">
                    <div className="tag-category description">
                        <h3>
                            Mood
                            {selectedTags.description.length > 0 && (
                                <button 
                                    className="clear-tags-button"
                                    onClick={() => clearSelectedTags('description')}
                                >
                                    Clear
                                </button>
                            )}
                        </h3>
                        <div className="tag-list">{renderTags(tags.description, 'description')}</div>
                    </div>
                    <div className="tag-category genre">
                        <h3>
                            Genre
                            {selectedTags.genre.length > 0 && (
                                <button 
                                    className="clear-tags-button"
                                    onClick={() => clearSelectedTags('genre')}
                                >
                                    Clear
                                </button>
                            )}
                        </h3>
                        <div className="tag-list">{renderTags(tags.genre, 'genre')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;