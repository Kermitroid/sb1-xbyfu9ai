import axios from 'axios';
import useUserStore from '../stores/userStore'; // Import the Zustand store

// Consider making baseURL configurable for different environments
// e.g., VITE_API_BASE_URL from .env file, defaulting to /api for production
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the Firebase ID token
apiClient.interceptors.request.use(
  (config) => {
    // Get the idToken from the Zustand store
    const idToken = useUserStore.getState().idToken;

    if (idToken) {
      // Only add the Authorization header if the token exists
      // And ensure it's for requests to our API (which baseURL should handle)
      // or not an absolute URL to a different domain.
      if (!config.url?.startsWith('http') || config.url.startsWith(apiClient.defaults.baseURL as string)) {
         config.headers.Authorization = `Bearer ${idToken}`;
      }
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default apiClient;

// Define types for the expected API responses for better type safety
export interface VideoInteractionResponse {
  likes: number;
  dislikes: number;
  userInteraction: 'liked' | 'disliked' | 'none';
}

// API functions for video interactions (likes/dislikes)
export const getVideoInteractions = (videoId: string): Promise<{ data: VideoInteractionResponse }> => {
  return apiClient.get(`/videos/${videoId}/interactions`);
};

export const likeVideo = (videoId: string): Promise<{ data: VideoInteractionResponse }> => {
  return apiClient.post(`/videos/${videoId}/like`);
};

export const unlikeVideo = (videoId: string): Promise<{ data: VideoInteractionResponse }> => {
  return apiClient.post(`/videos/${videoId}/unlike`);
};

export const dislikeVideo = (videoId: string): Promise<{ data: VideoInteractionResponse }> => {
  return apiClient.post(`/videos/${videoId}/dislike`);
};

export const undislikeVideo = (videoId: string): Promise<{ data: VideoInteractionResponse }> => {
  return apiClient.post(`/videos/${videoId}/undislike`);
};
