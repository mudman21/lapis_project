import React, { useState, useEffect } from 'react';
import NewsForm from './NewsForm';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../AuthContext';
import '../styles/NewsManagement.css';

function NewsManagement({ news: initialNews, onUpdate }) {
    const [news, setNews] = useState(initialNews);
    const [editingNews, setEditingNews] = useState(null);
    const { isLoggedIn, checkAuthStatus } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            checkAuthStatus();
        }
    }, [isLoggedIn, checkAuthStatus]);

    useEffect(() => {
        setNews(initialNews);
    }, [initialNews]);

    const handleCreate = () => {
        setEditingNews({ title: '', content: '', image_url: '' });
    };

    const handleEdit = (newsItem) => {
        setEditingNews(newsItem);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this news item?')) {
            try {
                await checkAuthStatus();
                if (!isLoggedIn) {
                    throw new Error('User is not authenticated');
                }

                const response = await fetch(`${API_BASE_URL}/api/news/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (response.ok) {
                    setNews(news.filter(item => item.id !== id));
                    onUpdate();
                } else {
                    throw new Error('Failed to delete news');
                }
            } catch (error) {
                console.error('Error deleting news:', error);
                alert('Failed to delete news. Please try again.');
            }
        }
    };

    const handleSubmit = async (newsData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            await checkAuthStatus();
            
            if (!isLoggedIn) {
                throw new Error('User is not authenticated');
            }

            const url = editingNews.id
                ? `${API_BASE_URL}/api/news/${editingNews.id}`
                : `${API_BASE_URL}/api/news`;
            const method = editingNews.id ? 'PUT' : 'POST';
            
            console.log("Submitting news:", newsData);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newsData),
                credentials: 'include'
            });
            
            console.log("Response status:", response.status);

            if (response.ok) {
                const result = await response.json();
                console.log("News submitted successfully:", result);
                if (editingNews.id) {
                    setNews(news.map(item => item.id === result.id ? result : item));
                } else {
                    setNews([result, ...news]);
                }
                onUpdate();
                setEditingNews(null);
            } else {
                const errorData = await response.json();
                console.error("Error submitting news:", errorData);
                throw new Error(errorData.error || 'Failed to save news');
            }
        } catch (error) {
            console.error('Error saving news:', error);
            alert(error.message || 'Failed to save news. Please try again.');
            throw error; // Re-throw the error to be caught in NewsForm
        } finally {
            setIsSubmitting(false);
        }
    };
    const formatContent = (content) => {
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    };
    return (
        <div className="news-management">
            <h2>News Management</h2>
            <button onClick={handleCreate} className="create-news-btn">Create New News</button>
            {editingNews && (
                <NewsForm
                    news={editingNews}
                    onSubmit={handleSubmit}
                    onCancel={() => setEditingNews(null)}
                />
            )}
            <ul className="news-list">
                {news.map(item => (
                    <li key={item.id} className="news-item">
                        <h3>{item.title}</h3>
                        <p className="news-date">{new Date(item.created_at).toLocaleDateString()}</p>
                        <div className="news-content">{formatContent(item.content)}</div>
                        {item.image_url && (
                            <div className="news-image-container">
                                <img src={item.image_url} alt="News" className="news-image" />
                            </div>
                        )}                        
                        <div className="news-actions">
                            <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default NewsManagement;