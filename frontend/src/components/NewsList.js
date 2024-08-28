import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NewsList.css';

function NewsList({ news, currentPage, totalPages, onPageChange, onNewsSelect }) {
    if (!news || news.length === 0) {
        return <div className="no-news">No news available.</div>;
    }

    return (
        <div className="news-list">
            <div className="news-item header">
                <span className="title">Title</span>
                <span className="date">Date</span>
            </div>
            {news.map(item => (
                <Link to={`/news/${item.id}`} key={item.id} className="news-item" onClick={() => onNewsSelect(item)}>
                    <span className="title">{item.title}</span>
                    <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                </Link>
            ))}

            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={currentPage === page ? 'active' : ''}
                    >
                        {page}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default NewsList;