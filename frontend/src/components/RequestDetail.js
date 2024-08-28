import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import RequestForm from './RequestForm';
import '../styles/RequestDetail.css';

function RequestDetail({ request: initialRequest, onUpdate, onDelete, onBack }) {
    const [request, setRequest] = useState(initialRequest);
    const [isEditing, setIsEditing] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (request && request.id) {
            fetchComments();
        }
    }, [request.id]);

    const fetchComments = async () => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com/api/requests/${request.id}/comments`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com/api/requests/${request.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newComment }),
                credentials: 'include'
            });
            if (response.ok) {
                const newCommentData = await response.json();
                setComments([...comments, newCommentData]);
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com/api/requests/${request.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            setRequest({...request, status: newStatus});
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async (updatedData) => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com/api/requests/${request.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to update request');
            }
            const updatedRequest = await response.json();
            setRequest(updatedRequest);
            setIsEditing(false);
            onUpdate(updatedRequest);
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('정말로 이 요청을 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com/api/requests/${request.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Failed to delete request');
                }
                onDelete(request.id);
            } catch (error) {
                console.error('Error deleting request:', error);
            }
        }
    };

    if (!request) {
        return <div>Loading...</div>;
    }

    return (
        <div className="request-detail">
            <button onClick={onBack} className="back-btn">← 목록으로 돌아가기</button>
            {isEditing ? (
                <RequestForm
                    initialData={request}
                    onSubmit={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <div className="request-view">
                    <h2>{request.title}</h2>
                    {request.content && <p>{request.content}</p>}
                    {request.email && <p className="email">이메일: {request.email}</p>}
                    <p className="visibility">공개 여부: {request.is_public ? '공개' : '비공개'}</p>
                    <p className="status">상태: {request.status}</p>
                    <p className="created-at">작성일: {new Date(request.created_at).toLocaleString()}</p>

                    {isLoggedIn && (
                        <>
                            <select value={request.status} onChange={handleStatusChange} className="status-dropdown">
                                <option value="확인 전">확인 전</option>
                                <option value="확인 중">확인 중</option>
                                <option value="답변 완료">답변 완료</option>
                            </select>
                            <div className="button-group">
                                <button onClick={handleEdit} className="edit-btn">수정</button>
                                <button onClick={handleDelete} className="delete-btn">삭제</button>
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="comments-section">
                <h3>댓글</h3>
                {comments.map(comment => (
                    <div key={comment.id} className="comment">
                        <p>{comment.content}</p>
                        <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                ))}
                {isLoggedIn && (
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="댓글을 작성하세요..."
                            required
                        />
                        <button type="submit">댓글 작성</button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default RequestDetail;