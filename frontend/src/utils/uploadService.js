// src/utils/uploadService.js
import axios from 'axios';
import { API } from '../App'; 

export const uploadFile = async (file, isPrivate = false) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('yuno_token');
  
  // Determine endpoint based on privacy
  const endpoint = isPrivate 
    ? `${API}/upload-private-file` 
    : `${API}/upload-public-file`;

  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });

    // Normalize the response logic
    if (isPrivate) {
      // Private returns: { key, presigned_url, expires_in }
      return {
        key: response.data.key,           // Save this to DB
        url: response.data.presigned_url, // Use this for <img> src preview
        isPrivate: true
      };
    } else {
      // Public returns: { key, url }
      return {
        key: response.data.key,
        url: response.data.url,           // Save this to DB (or key, depending on pref)
        isPrivate: false
      };
    }

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};