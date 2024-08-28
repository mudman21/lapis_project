import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from './constants';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkAuthStatus();
        const interval = setInterval(checkAuthStatus, 300000);
        return () => clearInterval(interval);
    }, []);

    const checkAuthStatus = async () => {
        try {
            console.log("Checking auth status");
            const response = await fetch(`${API_BASE_URL}/api/check_auth`, {
                credentials: 'include'
            });
            console.log("Auth status response:", response.status);
            if (response.ok) {
                const data = await response.json();
                console.log("Auth status data:", data);
                setIsLoggedIn(data.authenticated);
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsLoggedIn(false);
        }
    };
    const login = async (username, password) => {
        try {
            console.log('Sending login request');
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            console.log('Login response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Login response data:', data);
                setIsLoggedIn(true);
                return true;
            } else {
                const errorData = await response.json();
                console.log('Login error:', errorData);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            setIsLoggedIn(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};