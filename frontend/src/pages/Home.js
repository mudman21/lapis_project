import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import RecentAlbumsSection from '../components/RecentAlbumsSection';
import AnimatedNumber from '../components/AnimatedNumber';
import '../styles/Home.css';
import { API_BASE_URL } from '../constants';
import axios from 'axios';
function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
    const [libraryStats, setLibraryStats] = useState({
        total_albums: 0,
        main_tracks: 0,
        total_tracks: 0
    });
    const [recentNews, setRecentNews] = useState([]);
    const sliderRef = useRef(null);
    const timeoutRef = useRef(null);
    const bannerTimeoutRef = useRef(null);
    const slides = [
        {
            language: "한국어",
            content: "Lapis는 한국 음악 라이브러리 회사 Modoofind의 레이블입니다. 광고, 영화, 방송 등 다양한 콘텐츠에서 사용할 수 있는 고품질 음악을 꾸준히 제작하고 있으며, 앞으로도 그 품질과 다양성을 더욱 확장해 나갈 예정입니다. Lapis의 모든 저작물은 Modoofind가 소유하고 있으며, 음악의 사용은 승인된 업체에 한정됩니다. 관리하고 있는 모든 음악은 자동 모니터링 시스템으로 사용량을 파악하여 징수하고 있습니다. 음악 사용에 관한 문의는 아래 Modoofind 링크나 이메일을 통해 문의 바랍니다."
        },
        {
            language: "English",
            content: "Lapis is a label under Modoofind, a Korean music library company. We consistently produce high-quality music that can be used in various content such as advertisements, films, and broadcasts, and we plan to further expand both the quality and diversity of our offerings. All works by Lapis are owned by Modoofind, and the use of our music is restricted to authorized companies only. Please note that all the music we manage is tracked and royalties are collected using an automatic monitoring system. For inquiries regarding the use of our music, please contact us through the Modoofind link or email below."
        },
        {
            language: "Français",
            content: "Lapis est un label de Modoofind, une société coréenne de bibliothèque musicale. Nous produisons régulièrement de la musique de haute qualité, utilisable dans divers contenus tels que les publicités, les films et les émissions, et nous prévoyons d'élargir davantage la qualité et la diversité de nos offres. Toutes les œuvres de Lapis sont la propriété de Modoofind, et l'utilisation de notre musique est réservée aux entreprises autorisées. Veuillez noter que toute la musique que nous gérons est suivie et les redevances sont perçues grâce à un système de surveillance automatique. Pour toute question concernant l'utilisation de notre musique, veuillez nous contacter via le lien Modoofind ou par email ci-dessous."
        },
        {
            language: "日本語",
            content: "Lapisは韓国の音楽ライブラリ会社Modoofindのレーベルです。広告、映画、放送など様々なコンテンツで使用できる高品質な音楽を継続的に制作しており、今後もそのクオリティと多様性をさらに拡大していく予定です。Lapisのすべての著作物はModoofindが所有しており、音楽の使用は承認された企業に限られています。管理しているすべての音楽は自動モニタリングシステムによって使用量を把握し、使用料を徴収しています。音楽の使用に関するお問い合わせは、以下のModoofindのリンクまたはメールにてお問い合わせください。"
        }
    ];
    const bannerSlides = [
        { language: "English", content: "Music For Everything" },
        { language: "English", content: "LAPIS" }

    ];

    useEffect(() => {
        fetchLibraryStats();
        fetchRecentNews();
    }, []);

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            setCurrentSlide((prevSlide) => 
                prevSlide === slides.length - 1 ? 0 : prevSlide + 1
            );
        }, 10000);

        return () => {
            resetTimeout();
        };
    }, [currentSlide, slides.length]);

    useEffect(() => {
        resetBannerTimeout();
        bannerTimeoutRef.current = setTimeout(() => {
            setCurrentBannerSlide((prevSlide) => 
                prevSlide === bannerSlides.length - 1 ? 0 : prevSlide + 1
            );
        }, 8000);

        return () => {
            resetBannerTimeout();
        };
    }, [currentBannerSlide]);
    
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentBannerSlide((prevSlide) => {
                const nextSlide = (prevSlide + 1) % bannerSlides.length;
                return nextSlide;
            });
        }, 8000); // 3초마다 슬라이드 변경
    
        return () => clearInterval(slideInterval);
    }, []);

    const fetchLibraryStats = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}:5000/api/library_stats`);
          setLibraryStats(response.data);
        } catch (error) {
          console.error('Error fetching library stats:', error);
        }
      };
    const fetchRecentNews = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}:5000/api/news?page=1&per_page=5`);
            if (!response.ok) {
                throw new Error('Failed to fetch news');
            }
            const data = await response.json();
            setRecentNews(data.news);
        } catch (error) {
            console.error('Error fetching recent news:', error);
        }
    };

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }
    const resetBannerTimeout = () => {
        if (bannerTimeoutRef.current) {
            clearTimeout(bannerTimeoutRef.current);
        }
    }
    const renderSlides = () => {
        return slides.map((slide, index) => (
            <div 
                key={index} 
                className={`slide ${index === currentSlide ? 'active' : ''}`}
            >

                <p>{slide.content}</p>
            </div>
        ));
    };
    const renderBannerSlides = () => {
        return bannerSlides.map((slide, index) => (
            <div 
                key={index} 
                className={`banner-slide ${index === currentBannerSlide ? 'active' : 'fade-out'}`}
                lang={slide.language === "日本語" ? "ja" : slide.language === "한국어" ? "ko" : "en"}
            >
                {slide.content}
            </div>
        ));
    };
    return (
        <div className="home">
            <div className="banner" style={{ backgroundImage: `url(${API_BASE_URL}/data/Banner1.jpg)` }}>
                <div className="banner-content">
                </div>
            </div>
            <div className="main-content">
                <div className="top-sections">
                    <div className="intro-section">
                        <h3 className="section-title">Introduction</h3>
                        <div className="intro-content">
                            <div className="intro-slider" ref={sliderRef}>
                                {renderSlides()}
                            </div>
                                <div className="contact-wrapper">
                                    <div className="contact-links">
                                        <a href="https://www.modoofind.com/label/label_album.html?opid=35&label_code=LPS" target="_blank" rel="noopener noreferrer" className="contact-link">Modoofind</a>
                                        <a href="mailto:international@modoofind.com" className="contact-link">E-MAIL</a>

                                    </div>
                                </div>
                            </div>
                        </div>
                    <div className="stats-section">
                        <h3 className="section-title">Library Statistics</h3>
                        <div className="stats-content">
                            <div className="stat-item">
                                <p className="stat-label">Total Albums</p>
                                <AnimatedNumber value={libraryStats.total_albums} duration={500} />
                            </div>
                            <div className="stat-item">
                                <p className="stat-label">Total Main Tracks</p>
                                <AnimatedNumber value={libraryStats.main_tracks} duration={500} />
                            </div>
                            <div className="stat-item">
                                <p className="stat-label">Total Tracks</p>
                                <AnimatedNumber value={libraryStats.total_tracks} duration={2000} />
                            </div>
                        </div>
                    </div>

                    <div className="news-section">
                        <h3 className="section-title">Recent News</h3>
                        <div className="news-content">
                            <ul>
                                {recentNews.map(item => (
                                    <li key={item.id}>
                                        <Link to={`/news/${item.id}`}>
                                            <span className="news-date">{new Date(item.created_at).toLocaleDateString()}</span>
                                            <span className="home-news-title">{item.title}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    
                </div>
                <RecentAlbumsSection />
            </div>
        </div>
    );
}

export default Home;