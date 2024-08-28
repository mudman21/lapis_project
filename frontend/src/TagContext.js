import React, { createContext, useState, useContext } from 'react';

const TagContext = createContext();

export const useTagContext = () => useContext(TagContext);

export const TagProvider = ({ children }) => {
    const [selectedTags, setSelectedTags] = useState({ description: [], genre: [] });

    const normalizeTag = (tag) => tag.trim().toLowerCase();

    const updateSelectedTags = (tag, category) => {
        const normalizedTag = normalizeTag(tag);
        setSelectedTags(prev => {
            const updatedTags = [...prev[category]];
            const tagIndex = updatedTags.indexOf(normalizedTag);
            if (tagIndex > -1) {
                updatedTags.splice(tagIndex, 1);
            } else {
                updatedTags.push(normalizedTag);
            }
            return { ...prev, [category]: updatedTags };
        });
    };

    const clearSelectedTags = (category) => {
        setSelectedTags(prev => ({ ...prev, [category]: [] }));
    };

    const clearAllTags = () => {
        setSelectedTags({ description: [], genre: [] });
    };

    return (
        <TagContext.Provider value={{ selectedTags, updateSelectedTags, clearSelectedTags, clearAllTags }}>
            {children}
        </TagContext.Provider>
    );
};