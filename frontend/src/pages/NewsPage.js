import React, { useState, useEffect } from 'react';
import NewsItem from '../components/NewsItem';
import NewsForm from '../components/NewsForm';
import '../styles/NewsPage.css';
import { API_BASE_URL } from '../constants';

function NewsPage() {
    const [news, setNews] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchNews(currentPage);
    }, [currentPage]);

    const fetchNews = async (page) => {
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/news?page=${page}&per_page=9`);
            if (!response.ok) {
                throw new Error('Failed to fetch news');
            }
            const data = await response.json();
            setNews(data.news);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    };

    const handleNewNews = () => {
        setIsFormVisible(true);
    };

    const handleNewsSubmit = async (newsData) => {
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/news`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newsData),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to submit news');
            }
            fetchNews(currentPage);
            setIsFormVisible(false);
        } catch (error) {
            console.error('Error submitting news:', error);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="news-page">
            <div className="news-page-header">
                <h1 className="news-page-title">News</h1>

            </div>
            
            {isFormVisible && (
                <NewsForm onSubmit={handleNewsSubmit} onCancel={() => setIsFormVisible(false)} />
            )}

            <div className="news-grid">
                {news.map(item => (
                    <NewsItem key={item.id} item={item} />
                ))}
            </div>

            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? 'active' : ''}
                    >
                        {page}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default NewsPage;