import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatTag, formatTags } from '../utils/tagFormatting';
import '../styles/SearchResults.css';

const CustomAudioPlayer = memo(function CustomAudioPlayer({ 
  albumCode, trackNumber, songName, version, audioState, onPlay, onAudioLoaded, onEnded
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pendingSeek, setPendingSeek] = useState(null);
  const audioRef = React.useRef(null);
  const progressBarRef = React.useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        console.log('Audio metadata loaded');
        setDuration(audio.duration);
        if (pendingSeek !== null) {
          audio.currentTime = pendingSeek;
          setPendingSeek(null);
          if (audioState.isPlaying) {
            audio.play().catch(e => console.error("Error playing audio:", e));
          }
        }
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [pendingSeek, audioState.isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioState.audioSrc) {
      audio.load(); // 새 오디오 소스 로드
      if (audioState.isPlaying) {
        console.log('Playing audio:', audioState.audioSrc);
        audio.play().catch(e => console.error("Error playing audio:", e));
      } else {
        console.log('Pausing audio');
        audio.pause();
      }
    }
  }, [audioState.audioSrc, audioState.isPlaying]);

  const togglePlay = () => {
    console.log('Toggle play called');
    onPlay();
  };

  const updateProgress = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const setProgress = (e) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.clientWidth;
    const seekTime = (clickX / width) * duration;

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seekTime;
      if (!audioState.isPlaying) {
        onPlay();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="search-custom-audio-player">
      <button onClick={togglePlay} className="search-play-pause-button">
        {audioState.isLoading ? '...' : (audioState.isPlaying ? '❚❚' : '▶')}
      </button>
      <div className="search-progress-container" ref={progressBarRef} onClick={setProgress}>
        <div className="search-progress-bar" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
      </div>
      <div className="search-time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <audio
        ref={audioRef}
        src={audioState.audioSrc}
        onEnded={() => {
          console.log('Audio ended');
          onEnded();
        }}
      />
    </div>
  );
});

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="search-pagination">
      {currentPage > 1 && (
        <button onClick={() => onPageChange(currentPage - 1)}>&lt;</button>
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
          className={currentPage === number ? 'search-active' : ''}
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
        <button onClick={() => onPageChange(currentPage + 1)}>&gt;</button>
      )}
    </div>
  );
};

function SearchResults() {
  const [searchResults, setSearchResults] = useState({ tracks: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [trackPage, setTrackPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioStates, setAudioStates] = useState({});
  const location = useLocation();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [expandedTracks, setExpandedTracks] = useState({});
  const navigate = useNavigate();
  
  const fetchAudioToken = useCallback(async (albumCode, trackNumber, songName, version) => {
    try {
      if (!albumCode) {
        console.error('Album code is undefined:', albumCode);
        return null;
      }
      console.log('Fetching audio token for:', { albumCode, trackNumber, songName, version });
      const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/get_audio_token/${encodeURIComponent(albumCode)}/${encodeURIComponent(trackNumber)}/${encodeURIComponent(songName)}/${encodeURIComponent(version)}`);
      const data = await response.json();
      console.log('Audio token received:', data);
      return `http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/audio/${data.token}`;
    } catch (error) {
      console.error('Error fetching audio token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('q');
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);
    }
  }, [location.search, trackPage, albumPage]);

  const fetchSearchResults = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/search?q=${encodeURIComponent(query)}&track_page=${trackPage}&album_page=${albumPage}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      console.log("Received search results:", data);
      console.log("Tracks with sub tracks:", data.tracks.filter(track => track.sub_tracks && track.sub_tracks.length > 0).length);
            
      setSearchResults(data);
      setTotalTracks(data.total_tracks);
      setTotalAlbums(data.total_albums);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPageChange = (newPage) => {
    setTrackPage(newPage);
  };

  const handleAlbumPageChange = (newPage) => {
    setAlbumPage(newPage);
  };

  const handlePlay = useCallback(async (trackId, index, isSubTrack) => {
    console.log('handlePlay called with:', { trackId, index, isSubTrack });
    
    let track;
    if (isSubTrack) {
      const [mainIndex, subIndex] = index.split('-').map(Number);
      track = searchResults.tracks[mainIndex].sub_tracks[subIndex];
      track['ALBUM: Code'] = searchResults.tracks[mainIndex]['ALBUM: Code'];
    } else {
      track = searchResults.tracks[index];
      setCurrentTrackIndex(index);
    }
    
    setAudioStates(prevStates => {
      const newStates = {...prevStates};
      Object.keys(newStates).forEach(key => {
        if (key !== trackId) {
          newStates[key] = {...newStates[key], isPlaying: false};
        }
      });
      
      if (!newStates[trackId]?.audioSrc) {
        fetchAudioToken(track['ALBUM: Code'], track['TRACK: Number'], track['TRACK: Title'], track['TRACK: Version'])
          .then(audioSrc => {
            if (audioSrc) {
              setAudioStates(prev => ({
                ...prev,
                [trackId]: {
                  ...prev[trackId],
                  audioSrc,
                  isPlaying: true,
                  isLoading: false
                }
              }));
            }
          });
        
        return {
          ...newStates,
          [trackId]: {
            ...newStates[trackId],
            isPlaying: true,
            isLoading: true
          }
        };
      }
      
      newStates[trackId] = {
        ...newStates[trackId],
        isPlaying: !newStates[trackId]?.isPlaying,
      };
      
      console.log('New audio states:', newStates);
      return newStates;
    });
  }, [searchResults.tracks, fetchAudioToken]);




const handleTrackEnd = useCallback(() => {
    console.log('Track ended, current index:', currentTrackIndex);

    // 현재 트랙의 상태를 재생 중이 아님으로 설정
    const currentTrack = searchResults.tracks[currentTrackIndex];
    const currentTrackId = `${currentTrack['ALBUM: Code']}-${currentTrack['TRACK: Number']}`;
    
    setAudioStates(prevStates => ({
        ...prevStates,
        [currentTrackId]: {
            ...prevStates[currentTrackId],
            isPlaying: false,  // 재생 중 아님으로 설정
        }
    }));

    // 다음 트랙을 재생
    if (currentTrackIndex < searchResults.tracks.length - 1) {
        const nextTrack = searchResults.tracks[currentTrackIndex + 1];
        const nextTrackId = `${nextTrack['ALBUM: Code']}-${nextTrack['TRACK: Number']}`;
        console.log('Playing next track:', nextTrackId);

        setAudioStates(prevStates => ({
            ...prevStates,
            [nextTrackId]: {
                ...prevStates[nextTrackId],
                isPlaying: true,
                isLoading: true
            }
        }));

        fetchAudioToken(nextTrack['ALBUM: Code'], nextTrack['TRACK: Number'], nextTrack['TRACK: Title'], nextTrack['TRACK: Version'])
            .then(audioSrc => {
                if (audioSrc) {
                    setAudioStates(prevStates => ({
                        ...prevStates,
                        [nextTrackId]: {
                            ...prevStates[nextTrackId],
                            audioSrc,
                            isLoading: false
                        }
                    }));
                }
            });

        setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
        console.log('Reached end of playlist');
    }
  }, [currentTrackIndex, searchResults.tracks, fetchAudioToken]);

  const handleTagClick = (tag) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };
  const handleComposerClick = (composer) => {
    navigate(`/search?q=${encodeURIComponent(composer)}`);
  };

  const renderTrack = useCallback((track, index, isSubTrack = false) => {
    const trackId = `${track['ALBUM: Code']}-${track['TRACK: Number']}`;
    const isExpanded = expandedTracks[trackId] || false;
  
    const toggleSubTracks = () => {
      setExpandedTracks(prev => ({
        ...prev,
        [trackId]: !prev[trackId]
      }));
    };
  
    if (isSubTrack) {
      return (
        <div className="search-sub-track-item">
          <div className="search-sub-track-version">{track['TRACK: Version']}</div>
          <div className="search-sub-track-player">
            <CustomAudioPlayer 
              albumCode={track['ALBUM: Code']}
              trackNumber={track['TRACK: Number']}
              songName={track['TRACK: Title']}
              version={track['TRACK: Version']}
              audioState={audioStates[trackId] || {}}
              onPlay={() => handlePlay(trackId, `${index}`, true)}
              onEnded={() => handleTrackEnd()}
            />
          </div>
        </div>
      );
    }
  
    return (
      <div className="search-track-item" key={trackId}>
        <div className="search-track-album-cover" onClick={() => navigate(`/album/${track['ALBUM: Code']}`)}>
          <img src={`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/artwork/${track['ALBUM: Code']}`} alt={`${track['TRACK: Title']} album cover`} />
        </div>
        <div className="search-track-album-title">{track['ALBUM: Title']}</div>
        <div className="search-track-title">{track['TRACK: Title']}</div>
        <div className="search-track-composer">
          {track['TRACK: Composer(s)'].split(',').map((composer, idx) => (
            <button
              key={idx}
              className="search-composer-button"
              onClick={() => handleComposerClick(composer.trim())}
            >
              {composer.trim()}
            </button>
          ))}
        </div>
        <div className="search-track-player">
          <CustomAudioPlayer 
            albumCode={track['ALBUM: Code']}
            trackNumber={track['TRACK: Number']}
            songName={track['TRACK: Title']}
            version={track['TRACK: Version']}
            audioState={audioStates[trackId] || {}}
            onPlay={() => handlePlay(trackId, index, false)}
            onEnded={() => handleTrackEnd()}
          />
        </div>
        <div className="search-track-tags">
          {track['TRACK: Mood'] && formatTags(track['TRACK: Mood']).split(', ').map((tag, idx) => (
            <button key={idx} className="search-mood-tag" onClick={() => handleTagClick(tag)}>
              {tag}
            </button>
          ))}
          {track['TRACK: Genre'] && formatTags(track['TRACK: Genre']).split(', ').map((tag, idx) => (
            <button key={idx} className="search-genre-tag" onClick={() => handleTagClick(tag)}>
              {tag}
            </button>
          ))}
        </div>
        {track.sub_tracks && track.sub_tracks.length > 0 && (
          <button onClick={toggleSubTracks} className="search-toggle-sub-tracks">
            Sub Tracks
          </button>
        )}
        {isExpanded && track.sub_tracks && (
          <div className="search-sub-tracks">
            {track.sub_tracks.map((subTrack, subIndex) => renderTrack({
              ...subTrack,
              'ALBUM: Code': track['ALBUM: Code']
            }, `${index}-${subIndex}`, true))}
          </div>
        )}
      </div>
    );
  }, [audioStates, handlePlay, handleTrackEnd, expandedTracks, navigate]);

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h1>Search Results<span>"{searchQuery}"</span></h1>
      </div>
      
      <section className="search-tracks-section">
        <h2>Tracks ({totalTracks})</h2>
        {searchResults.tracks.length === 0 ? (
          <p>No tracks found</p>
        ) : (
          <>
            {searchResults.tracks.map((track, index) => (
              <React.Fragment key={`${track['ALBUM: Code']}-${track['TRACK: Number']}`}>
                {renderTrack(track, index)}
              </React.Fragment>
            ))}            
            <Pagination
              currentPage={trackPage}
              totalItems={totalTracks}
              itemsPerPage={10}
              onPageChange={handleTrackPageChange}
            />
          </>
        )}
      </section>

      <section className="search-albums-section">
        <h2>Albums ({totalAlbums})</h2>
        {searchResults.albums.length === 0 ? (
          <p>No albums found</p>
        ) : (
          <>  
            <div className="search-albums-grid">
              {searchResults.albums.map((album) => (
                <div key={album['ALBUM: Code']} className="search-album-card">
                  <div 
                    className="search-album-artwork" 
                    onClick={() => navigate(`/album/${album['ALBUM: Code']}`)}
                  >
                    {album.has_artwork && (
                      <img
                        src={`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/artwork/${album['ALBUM: Code']}`}
                        alt={`${album['ALBUM: Title']} cover`}
                      />
                    )}
                  </div>
                  <div className="search-album-info">
                    <h3 
                      className="search-album-title" 
                      onClick={() => navigate(`/album/${album['ALBUM: Code']}`)}
                    >
                      {album['ALBUM: Title']}
                    </h3>
                    {/* <p className="search-album-introduction">{album['ALBUM: Introduction']}</p> */}
                    <div className="search-album-tags">
                      {Array.from(new Set((album['ALBUM: Description'] || '').split(','))).map((tag, index) => (
                        <button 
                          key={index} 
                          className="search-album-tag" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(tag.trim());
                          }}
                        >
                          {formatTag(tag.trim())}
                        </button>
                      ))}
                    </div>
                    <div className="search-album-tags">
                      {Array.from(new Set((album['TRACK: Genre'] || '').split(','))).map((genre, index) => (
                        <button 
                          key={index} 
                          className="search-album-genre-tag" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(genre.trim());
                          }}
                        >
                          {formatTag(genre.trim())}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={albumPage}
              totalItems={totalAlbums}
              itemsPerPage={5}
              onPageChange={handleAlbumPageChange}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default SearchResults;