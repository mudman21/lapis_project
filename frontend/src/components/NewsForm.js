import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import '../styles/NewsForm.css';

function NewsForm({ news, onSubmit, onCancel }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (news) {
            setTitle(news.title);
            setContent(news.content);
        }
    }, [news]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        let imageUrl = null;

        if (image) {
            const formData = new FormData();
            formData.append('image', image);
            try {
                console.log("Uploading image");
                const response = await fetch(`${API_BASE_URL}/api/upload-news-image`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                if (response.ok) {
                    const result = await response.json();
                    imageUrl = result.imageUrl;
                    console.log("Image uploaded successfully:", imageUrl);
                } else {
                    console.error("Image upload failed:", await response.text());
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        const newsData = {
            title,
            content,
            image_url: imageUrl
        };

        try {
            await onSubmit(newsData);
            setTitle('');
            setContent('');
            setImage(null);
        } catch (error) {
            console.error('Error submitting news:', error);
            alert(error.message || 'Failed to submit news. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="news-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
            />
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
                required
            />
            <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
            />
            <div className="form-buttons">
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : (news ? 'Update' : 'Create') + ' News'}
                </button>
                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}

export default NewsForm;