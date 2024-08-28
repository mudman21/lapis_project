import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AlbumDetail from './pages/AlbumDetail';
import AlbumPage from './pages/AlbumPage';
import RequestPage from './pages/RequestPage';
import NewsPage from './pages/NewsPage';
import NewsDetail from './pages/NewsDetail';
import AdminPage from './pages/AdminPage';
import SearchResults from './pages/SearchResults';
import { AlbumProvider } from './AlbumContext';
import { TagProvider } from './TagContext';
import { AuthProvider } from './AuthContext';
import './App.css';
import './fontawesome';

function App() {
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const openAdminModal = () => setIsAdminModalOpen(true);
    const closeAdminModal = () => setIsAdminModalOpen(false);
    return (
        <Router>
            <AuthProvider>
                <AlbumProvider>        
                    <TagProvider>
                        <div className="App">
                            <Header />
                            <div className="content-wrapper">
                                <Sidebar />
                                <main>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/album" element={<AlbumPage />} />
                                        <Route path="/album/:albumCode" element={<AlbumDetail />} />
                                        <Route path="/request" element={<RequestPage />} />
                                        <Route path="/news" element={<NewsPage />} />
                                        <Route path="/news/:id" element={<NewsDetail />} />
                                        <Route path="/admin" element={<AdminPage />} />
                                        <Route path="/search" element={<SearchResults />} />
                                    </Routes>
                                </main>
                            </div>
                            <Footer onAdminClick={openAdminModal} />
                            {isAdminModalOpen && (
                                <AdminPage isOpen={isAdminModalOpen} onClose={closeAdminModal} />
                            )}    
                        </div>
                    </TagProvider>
                </AlbumProvider>    
            </AuthProvider>
        </Router>
    );
}

export default App;