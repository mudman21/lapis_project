import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export async function fetchAlbumDetails(albumCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/albums/${albumCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching album details:', error);
    throw error;
  }
}

export async function fetchAdjacentAlbumCodes(albumCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/albums/adjacent/${albumCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching adjacent album codes:', error);
    return { prevAlbumCode: null, nextAlbumCode: null };
  }
}