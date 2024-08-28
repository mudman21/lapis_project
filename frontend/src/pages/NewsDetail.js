import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NewsForm from '../components/NewsForm';
import '../styles/NewsDetail.css';
import { API_BASE_URL } from '../constants';

function NewsDetail() {
    const [news, setNews] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNewsDetail();
    }, [id]);

    const fetchNewsDetail = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/news/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch news detail');
            }
            const data = await response.json();
            setNews(data);
        } catch (error) {
            console.error('Error fetching news detail:', error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleUpdate = async (updatedNews) => {
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/news/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedNews),
            });
            if (!response.ok) {
                throw new Error('Failed to update news');
            }
            fetchNewsDetail();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating news:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this news?')) {
            try {
                const response = await fetch(`${API_BASE_URL}:5000/api/news/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error('Failed to delete news');
                }
                navigate('/news');
            } catch (error) {
                console.error('Error deleting news:', error);
            }
        }
    };

    if (!news) return <div>Loading...</div>;

    return (
        <div className="news-detail">
            {isEditing ? (
                <NewsForm news={news} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />
            ) : (
                <>
                    <h1 className="news-title">{news.title}</h1>
                    <p className="news-date">{new Date(news.created_at).toLocaleDateString()}</p>
                    {news.image_url && (
                        <img 
                            src={news.image_url.startsWith('http') ? news.image_url : `${API_BASE_URL}${news.image_url}`} 
                            alt={news.title} 
                            className="news-image" 
                        />
                    )}

                    <div className="news-content">
                    {news.content.split(/\n/).map((line, index) => (
                        <React.Fragment key={index}>
                        {line}
                        <br />
                        </React.Fragment>
                    ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default NewsDetail;