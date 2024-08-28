import React, { useState, useEffect } from 'react';
import '../styles/CommentSection.css';

function CommentSection({ newsId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchComments();
    }, [newsId]);

    const fetchComments = async () => {
        try {
            const response = await fetch(`http://192.168.2.46:5000/api/news/${newsId}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://192.168.2.46:5000/api/news/${newsId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newComment }),
            });
            if (!response.ok) {
                throw new Error('Failed to post comment');
            }
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    return (
        <div className="comment-section">
            <h3>Comments</h3>
            <ul className="comment-list">
                {comments.map(comment => (
                    <li key={comment.id} className="comment">
                        <p>{comment.content}</p>
                        <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </li>
                ))}
            </ul>
            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    required
                />
                <button type="submit">Post Comment</button>
            </form>
        </div>
    );
}

export default CommentSection;