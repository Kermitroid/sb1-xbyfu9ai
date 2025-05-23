import { create } from 'zustand';
import { Video, PaginatedResponse } from '../types';
import api from '../utils/api';

interface VideoState {
  videos: Video[];
  featuredVideos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  totalVideos: number;
  totalPages: number;
  currentPage: number;
  fetchVideos: (page?: number, limit?: number, category?: string, search?: string) => Promise<void>;
  fetchVideoById: (id: string) => Promise<void>;
  fetchAggregatedVideos: (url: string) => Promise<Video[]>;
  uploadVideo: (formData: FormData) => Promise<Video>;
  likeVideo: (id: string) => Promise<void>;
  dislikeVideo: (id: string) => Promise<void>;
}

const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  featuredVideos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  totalVideos: 0,
  totalPages: 0,
  currentPage: 1,
  
  fetchVideos: async (page = 1, limit = 20, category?: string, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      
      const response = await api.get<PaginatedResponse<Video>>(`/videos?${queryParams.toString()}`);
      
      set({ 
        videos: response.data.videos,
        totalVideos: response.data.totalVideos,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        isLoading: false 
      });
      
      // Set featured videos if we're on the first page and not filtering
      if (page === 1 && !category && !search) {
        const featured = [...response.data.videos]
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
        set({ featuredVideos: featured });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch videos' 
      });
    }
  },
  
  fetchVideoById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Video>(`/videos/${id}`);
      set({ currentVideo: response.data, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch video' 
      });
    }
  },
  
  fetchAggregatedVideos: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ videos: Video[] }>(`/aggregate?url=${encodeURIComponent(url)}`);
      return response.data.videos;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to aggregate videos' 
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  uploadVideo: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Video>('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add the new video to the videos array
      const videos = get().videos;
      set({ videos: [response.data, ...videos], isLoading: false });
      
      return response.data;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to upload video' 
      });
      throw error;
    }
  },
  
  likeVideo: async (id: string) => {
    const currentVideo = get().currentVideo;
    if (!currentVideo || currentVideo.id !== id) return;
    
    // Optimistic update
    set({
      currentVideo: {
        ...currentVideo,
        likes: currentVideo.likes + 1
      }
    });
    
    // In a real app, we would make an API call here
    // await api.post(`/videos/${id}/like`);
  },
  
  dislikeVideo: async (id: string) => {
    const currentVideo = get().currentVideo;
    if (!currentVideo || currentVideo.id !== id) return;
    
    // Optimistic update
    set({
      currentVideo: {
        ...currentVideo,
        dislikes: currentVideo.dislikes + 1
      }
    });
    
    // In a real app, we would make an API call here
    // await api.post(`/videos/${id}/dislike`);
  }
}));

export default useVideoStore;