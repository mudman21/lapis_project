// src/AlbumContext.js
import React, { createContext, useState, useContext } from 'react';

const AlbumContext = createContext();

export const useAlbumContext = () => useContext(AlbumContext);

export const AlbumProvider = ({ children }) => {
  const [albumCount, setAlbumCount] = useState(0);
  const [mainTrackCount, setMainTrackCount] = useState(0);

  const updateCounts = (albums) => {
    setAlbumCount(albums.length);
    const totalMainTracks = albums.reduce((sum, album) => {
      const mainTracks = album.tracks ? album.tracks.filter(track => track['TRACK: Is Main'] === 'Y').length : 0;
      return sum + mainTracks;
    }, 0);
    setMainTrackCount(totalMainTracks);
  };

  return (
    <AlbumContext.Provider value={{ albumCount, mainTrackCount, updateCounts }}>
      {children}
    </AlbumContext.Provider>
  );
};