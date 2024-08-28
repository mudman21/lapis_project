import React from 'react';
import '../styles/RequestList.css';
import { useAuth } from '../AuthContext';

function RequestList({ requests, currentPage, totalPages, onPageChange, onRequestSelect, isLoggedIn }) {
    const renderRequestContent = (request) => {
        if (isLoggedIn || request.is_public) {
            return request.content ? request.content.substring(0, 100) + (request.content.length > 100 ? '...' : '') : '내용 없음';
        } else {
            return '비공개 게시물입니다.';
        }
    };
    
    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage, endPage;

        if (totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= Math.floor(maxVisiblePages / 2) + 1) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (currentPage + Math.floor(maxVisiblePages / 2) >= totalPages) {
                startPage = totalPages - maxVisiblePages + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - Math.floor(maxVisiblePages / 2);
                endPage = currentPage + Math.floor(maxVisiblePages / 2);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="pagination">
                {currentPage > 1 && (
                    <button onClick={() => onPageChange(currentPage - 1)}>Previous</button>
                )}
                {startPage > 1 && (
                    <>
                        <button onClick={() => onPageChange(1)}>1</button>
                        {startPage > 2 && <span>...</span>}
                    </>
                )}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={currentPage === number ? 'active' : ''}
                    >
                        {number}
                    </button>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span>...</span>}
                        <button onClick={() => onPageChange(totalPages)}>{totalPages}</button>
                    </>
                )}
                {currentPage < totalPages && (
                    <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
                )}
            </div>
        );
    };

    return (
        <div className="request-list-container">
            <div className="request-list">
                {requests.map(request => (
                    <div 
                        key={request.id} 
                        className={`request-card ${request.status.replace(' ', '')}`} 
                        onClick={() => onRequestSelect(request)}                        
                    >
                        <h3>{request.title}</h3>
                        <p>{renderRequestContent(request)}</p>
                        <div className="request-meta">
                            <span className="request-date">{new Date(request.created_at).toLocaleDateString()}</span>
                            <span className={`request-status ${request.status.replace(' ', '')}`}>
                                {request.status}
                            </span>
                            <span className="request-visibility">
                                {request.is_public ? 'Public' : 'Private'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {renderPagination()}
        </div>
    );
}

export default RequestList;