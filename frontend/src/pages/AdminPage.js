import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import LoginForm from '../components/LoginForm';
import NewsManagement from '../components/NewsManagement';
import Modal from '../components/Modal';
import { API_BASE_URL } from '../constants';
import '../styles/AdminPage.css';

function AdminPage({ isOpen, onClose }) {
    const { isLoggedIn, login, logout } = useAuth();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNews();
        }
    }, [isLoggedIn]);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}:5000/api/news`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch news');
            }
            const data = await response.json();
            setNews(data.news);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (username, password) => {
        console.log('Login attempt:', username);
        const success = await login(username, password);
        if (success) {
            console.log('Login successful');
            fetchNews();
        } else {
            console.log('Login failed');
            alert('Login failed. Please try again.');
        }
    };
    const handleReloadData = async () => {
        setIsReloading(true);
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/reload_data`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to reload data');
            }
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error('Error reloading data:', error);
            alert('Failed to reload data. Please try again.');
        } finally {
            setIsReloading(false);
        }
    };
    const handleLogout = () => {
        logout();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={isLoggedIn ? 'large' : 'small'}>
            <div className="admin-page">
                <h1>{isLoggedIn ? 'Admin Panel' : 'Login'}</h1>
                {!isLoggedIn ? (
                    <LoginForm onLogin={handleLogin} />
                ) : loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <NewsManagement news={news} onUpdate={fetchNews} />
                        <div className="admin-buttons">
                            <button 
                                className="reload-data-button" 
                                onClick={handleReloadData}
                                disabled={isReloading}
                            >
                                {isReloading ? 'Reloading...' : 'Reload Data'}
                            </button>
                            <button className="logout-button" onClick={handleLogout}>Logout</button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default AdminPage;