import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAlbumDetails, fetchAdjacentAlbumCodes } from '../services/api';
import { useTagContext } from '../TagContext';
import '../styles/AlbumDetail.css';
import { formatTag, formatTags } from '../utils/tagFormatting';
import LeftArrow from '../styles/Left.svg';
import RightArrow from '../styles/Right.svg';
import ListIcon from '../styles/List.svg'; 

function AlbumDetail() {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainTracks, setMainTracks] = useState([]);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [prevAlbumCode, setPrevAlbumCode] = useState(null);
  const [nextAlbumCode, setNextAlbumCode] = useState(null);
  const { albumCode } = useParams();
  const navigate = useNavigate();
  const { updateSelectedTags } = useTagContext();

  
  useEffect(() => {
    const loadAlbumDetails = async () => {
      try {
        const [albumData, adjacentCodes] = await Promise.all([
          fetchAlbumDetails(albumCode),
          fetchAdjacentAlbumCodes(albumCode)
        ]);

        setAlbum(albumData);
        setMainTracks(albumData.tracks.filter(track => track['TRACK: Is Main'] === 'Y'));
        setPrevAlbumCode(adjacentCodes.prevAlbumCode);
        setNextAlbumCode(adjacentCodes.nextAlbumCode);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load album details:', err);
        setError('Failed to load album details. Please try again later.');
        setLoading(false);
      }
    };

    loadAlbumDetails();
  }, [albumCode]);

  const handleTagClick = (tag, category) => {
    updateSelectedTags(tag.toLowerCase(), category);
    navigate('/album');
  };

  const handleNavigation = (targetAlbumCode) => {
    // 현재 재생 중인 오디오를 중지
    if (playingTrack) {
      setPlayingTrack(null);
    }
    // 페이지 새로고침과 함께 새 앨범 페이지로 이동
    window.location.href = `/album/${targetAlbumCode}`;
  };




  const renderUniqueTagButtons = (tags, category) => {
    const uniqueTags = new Set();
    return tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
      .filter(tag => {
        const lowercaseTag = tag.toLowerCase();
        if (!uniqueTags.has(lowercaseTag)) {
          uniqueTags.add(lowercaseTag);
          return true;
        }
        return false;
      })
      .map((tag, index) => (
        <button 
          key={index} 
          className={`album-tag-button ${category}`}
          onClick={() => handleTagClick(tag, category)}
        >
          {formatTag(tag)}
        </button>
      ));
  };

  const handlePlay = useCallback((track, isSubTrack = false) => {
    console.log(`Playing ${isSubTrack ? 'sub' : 'main'} track:`, track);
    if (playingTrack && playingTrack.id !== getTrackId(track)) {
      // Stop the currently playing track
      setPlayingTrack(prevTrack => ({ ...prevTrack, isPlaying: false }));
    }
    setPlayingTrack({ ...track, isSubTrack, isPlaying: true, id: getTrackId(track) });
  }, [playingTrack]);

  const handlePause = useCallback(() => {
    console.log('Pausing track:', playingTrack);
    setPlayingTrack(prevTrack => prevTrack ? { ...prevTrack, isPlaying: false } : null);
  }, [playingTrack]);

  const handleTrackEnd = useCallback(() => {
    console.log('Track ended:', playingTrack);
    if (playingTrack && !playingTrack.isSubTrack) {
      const currentIndex = mainTracks.findIndex(track => getTrackId(track) === playingTrack.id);
      if (currentIndex < mainTracks.length - 1) {
        const nextTrack = mainTracks[currentIndex + 1];
        console.log('Playing next track:', nextTrack);
        setPlayingTrack({ ...nextTrack, isSubTrack: false, isPlaying: true, id: getTrackId(nextTrack) });
      } else {
        console.log('Reached end of playlist');
        setPlayingTrack(null);
      }
    } else {
      console.log('Sub track ended or no track playing');
      setPlayingTrack(null);
    }
  }, [mainTracks, playingTrack]);

  const getTrackId = (track) => {
    return `${track['TRACK: Number']}-${track['TRACK: Version']}`;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!album) return <div className="not-found">Album not found</div>;

  return (
    <div className="album-detail">
      <div className="album-navigation">
        {prevAlbumCode && (
           <button onClick={() => handleNavigation(prevAlbumCode)} className="nav-button prev-button">
           <img src={LeftArrow} alt="Previous Album" />
           </button>
        )}
        {nextAlbumCode && (
           <button onClick={() => handleNavigation(nextAlbumCode)} className="nav-button next-button">
           <img src={RightArrow} alt="Next Album" />
           </button>
        )}
      </div> 
      <div className="album-info">
        {album.has_artwork && (
          <img 
            src={`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/artwork/${album['ALBUM: Code']}`} 
            alt={`${album['ALBUM: Title']} cover`} 
            className="album-cover"
          />
        )}
        
        <div className="album-text">
        <Link to="/album" className="back-to-list" />
          <h1>{album['ALBUM: Title']}</h1>
          <p className="album-release-date">Release Date: {album['ALBUM: Release Date']}</p>
          <div className="album-tags">{renderUniqueTagButtons(formatTags(album['ALBUM: Description']), 'description')}{renderUniqueTagButtons(formatTags(album['TRACK: Genre']), 'genre')}
          </div>            
        </div>


      </div>
      {/*album['ALBUM: Introduction'] && album['ALBUM: Introduction'] !== '아직 소개글이 작성되지 않았습니다.' && (
        <div className="album-introduction">
          <h2>Album Introduction</h2>
          <p>{album['ALBUM: Introduction']}</p>
        </div>
      )*/}

      <div className="track-list">
        <h2>Tracks</h2>
        {mainTracks.map((track, index) => (
          <MainTrackItem 
            key={index} 
            mainTrack={track} 
            subTracks={album.tracks.filter(t => t['TRACK: Is Main'] === 'N' && t['TRACK: Main Track Number'] === track['TRACK: Number'])} 
            albumCode={album['ALBUM: Code']}
            playingTrack={playingTrack}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleTrackEnd}
            getTrackId={getTrackId}
          />
        ))}
      </div>
    </div>
  );
}

function MainTrackItem({ mainTrack, subTracks, albumCode, playingTrack, onPlay, onPause, onEnded, getTrackId }) {
  const [showSubTracks, setShowSubTracks] = useState(false);
  const isCurrentlyPlaying = playingTrack && playingTrack.id === getTrackId(mainTrack) && playingTrack.isPlaying;

  return (
    <div className="main-track-container">
      <div className="track-item main-track">
        <div className="track-info">
          <span className="track-number">{mainTrack['TRACK: Number']}</span>
          <span className="track-title">{mainTrack['TRACK: Title']}</span>
          <span className="track-composer">{mainTrack['TRACK: Composer(s)']}</span>
          <CustomAudioPlayer 
            albumCode={albumCode}
            track={mainTrack}
            isSubTrack={false}
            isCurrentlyPlaying={isCurrentlyPlaying}
            onPlay={() => onPlay(mainTrack)}
            onPause={onPause}
            onEnded={onEnded}
            getTrackId={getTrackId}
          />
          {subTracks.length > 0 && (
            <button onClick={() => setShowSubTracks(!showSubTracks)} className="toggle-button">
              {showSubTracks ? 'Hide Sub ver.' : 'Show Sub ver.'}
            </button>
          )}
        </div>
      </div>
      {showSubTracks && subTracks.map((subTrack, index) => (
        <SubTrackItem 
          key={index} 
          subTrack={subTrack} 
          albumCode={albumCode} 
          playingTrack={playingTrack}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          getTrackId={getTrackId}
        />
      ))}
    </div>
  );
}

function SubTrackItem({ subTrack, albumCode, playingTrack, onPlay, onPause, onEnded, getTrackId }) {
  console.log('Rendering SubTrackItem:', subTrack);
  const isCurrentlyPlaying = playingTrack && playingTrack.id === getTrackId(subTrack) && playingTrack.isPlaying;

  return (
    <div className="track-item sub-track">
      <div className="track-info">
        <span className="track-number">{subTrack['TRACK: Number']}</span>
        <span className="track-version">{subTrack['TRACK: Version']}</span>
        <CustomAudioPlayer 
          albumCode={albumCode}
          track={subTrack}
          isSubTrack={true}
          isCurrentlyPlaying={isCurrentlyPlaying}
          onPlay={() => {
            console.log('Sub track play clicked:', subTrack);
            onPlay(subTrack, true);
          }}
          onPause={() => {
            console.log('Sub track pause clicked:', subTrack);
            onPause();
          }}
          onEnded={() => {
            console.log('Sub track ended:', subTrack);
            onEnded();
          }}
          getTrackId={getTrackId}
        />
      </div>
    </div>
  );
}

const CustomAudioPlayer = memo(function CustomAudioPlayer({ 
  albumCode, track, isSubTrack, isCurrentlyPlaying, onPlay, onPause, onEnded, getTrackId
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const [pendingSeek, setPendingSeek] = useState(null);

  const fetchAudioToken = useCallback(async () => {
    try {
      const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/get_audio_token/${encodeURIComponent(albumCode)}/${encodeURIComponent(track['TRACK: Number'])}/${encodeURIComponent(track['TRACK: Title'])}/${encodeURIComponent(track['TRACK: Version'])}`);
      const data = await response.json();
      return `http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/audio/${data.token}`;
    } catch (error) {
      console.error('Error fetching audio token:', error);
      return null;
    }
  }, [albumCode, track]);

  const loadAndPlayAudio = useCallback(async () => {
    if (!audioSrc) {
      setIsLoading(true);
      const src = await fetchAudioToken();
      if (src) {
        console.log(`Audio source fetched for ${isSubTrack ? 'sub' : 'main'} track:`, track['TRACK: Title']);
        setAudioSrc(src);
        setIsLoading(false);
        if (isCurrentlyPlaying) {
          audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
      } else {
        console.error('Failed to fetch audio source');
        setIsLoading(false);
      }
    }
  }, [audioSrc, fetchAudioToken, isCurrentlyPlaying, isSubTrack, track]);
  
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log(`Duration set for ${isSubTrack ? 'sub' : 'main'} track:`, track['TRACK: Title'], audio.duration);
      if (pendingSeek !== null) {
        audio.currentTime = pendingSeek;
        setPendingSeek(null);
        if (isCurrentlyPlaying) {
          audio.play().catch(e => console.error("Error playing audio:", e));
        }
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', updateProgress);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [isSubTrack, track, pendingSeek, isCurrentlyPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isCurrentlyPlaying) {
      if (audioSrc) {
        audio.play().catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Error playing audio:", e);
          }
        });
      } else {
        loadAndPlayAudio();
      }
    } else {
      audio.pause();
    }
  }, [isCurrentlyPlaying, audioSrc, loadAndPlayAudio]);

  const togglePlay = async () => {
    console.log(`Toggle play for ${isSubTrack ? 'sub' : 'main'} track:`, track['TRACK: Title']);
    if (isCurrentlyPlaying) {
      onPause();
    } else {
      if (!audioSrc) {
        await loadAndPlayAudio();
      }
      onPlay();
    }
  };

  const updateProgress = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const setProgress = (e) => {
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    if (!progressBar || !audio) return;

    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.clientWidth;
    const seekTime = (clickX / width) * duration;

    console.log('Click position:', clickX, 'Width:', width, 'Duration:', duration, 'Calculated seek time:', seekTime);

    if (!isFinite(seekTime) || seekTime < 0) {
      console.error('Invalid seek time calculated:', seekTime);
      return;
    }

    if (audio.readyState === 0) {
      console.log('Audio not loaded yet, setting pending seek');
      setPendingSeek(seekTime);
      if (!audioSrc) {
        console.log('No audio source, calling onPlay');
        onPlay();
      }
    } else {
      console.log('Setting current time to:', seekTime);
      audio.currentTime = seekTime;
      if (!isCurrentlyPlaying) {
        console.log('Audio not playing, calling onPlay');
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
    <div className="custom-audio-player">
      <button onClick={togglePlay} className="play-pause-button" disabled={isLoading}>
        {isLoading ? '...' : (isCurrentlyPlaying ? '❚❚' : '▶')}
      </button>
      <div className="progress-container" ref={progressBarRef} onClick={setProgress}>
        <div className="progress-bar" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
      </div>
      <div className="time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={onEnded}
      />
    </div>
  );
});

export default AlbumDetail;