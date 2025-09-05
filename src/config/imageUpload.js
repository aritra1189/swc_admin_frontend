// utils/imageUpload.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const uploadImage = async (file, courseId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // Backend expects 'file' field name
    
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    };
    
    let url;
    if (courseId) {
      // Use PUT method for updating thumbnail (as per your backend)
      url = `${API_BASE_URL}/course/thumbnail/${courseId}`;
      const response = await axios.put(url, formData, config);
      
      // Return the full image URL (backend returns the updated course object)
      const imageUrl = response.data.imageUrl;
      if (!imageUrl) {
        throw new Error('Image URL not returned from server');
      }
      return imageUrl;
    } else {
      // For new courses, upload image first
      url = `${API_BASE_URL}/upload/image`;
      const response = await axios.post(url, formData, config);
      return response.data.imageUrl || response.data.url || response.data;
    }
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};