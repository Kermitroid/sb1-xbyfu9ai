import { create } from 'zustand';
import { Video, PaginatedResponse } from '../types';
import api from '../utils/api';

interface VideoState {
  videos: Video[];
  featuredVideos: Video[];
  currentVideo: Video | null;
  videoCache: Map<string, Video>;
  isLoading: boolean;
  error: string | null;
  totalVideos: number;
  totalPages: number;
  currentPage: number;
  lastFetchParams: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } | null;
  fetchVideos: (page?: number, limit?: number, category?: string, search?: string) => Promise<void>;
  fetchVideoById: (id: string) => Promise<void>;
  fetchAggregatedVideos: (url: string) => Promise<Video[]>;
  uploadVideo: (formData: FormData) => Promise<Video>;
  likeVideo: (id: string) => Promise<void>;
  dislikeVideo: (id: string) => Promise<void>;
  clearError: () => void;
  clearVideos: () => void;
}

const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  featuredVideos: [],
  currentVideo: null,
  videoCache: new Map(),
  isLoading: false,
  error: null,
  totalVideos: 0,
  totalPages: 0,
  currentPage: 1,
  lastFetchParams: null,
  
  fetchVideos: async (page = 1, limit = 20, category?: string, search?: string) => {
    set({ isLoading: true, error: null });
    
    const params = { page, limit, category, search };
    const cacheKey = JSON.stringify(params);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      
      const response = await api.get<PaginatedResponse<Video>>(`/videos?${queryParams.toString()}`);
      
      // Update cache with fetched videos
      const videoCache = get().videoCache;
      response.data.videos.forEach(video => {
        videoCache.set(video.id, video);
      });
      
      set({ 
        videos: response.data.videos,
        totalVideos: response.data.totalVideos,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        lastFetchParams: params,
        videoCache,
        isLoading: false 
      });
      
      // Set featured videos if we're on the first page and not filtering
      if (page === 1 && !category && !search) {
        const featured = [...response.data.videos]
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
        set({ featuredVideos: featured });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Failed to fetch videos';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
    }
  },
  
  fetchVideoById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    // Check cache first
    const videoCache = get().videoCache;
    const cachedVideo = videoCache.get(id);
    
    if (cachedVideo) {
      set({ currentVideo: cachedVideo, isLoading: false });
      return;
    }
    
    try {
      const response = await api.get<Video>(`/videos/${id}`);
      
      // Update cache
      videoCache.set(id, response.data);
      
      set({ 
        currentVideo: response.data, 
        videoCache,
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Failed to fetch video';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
    }
  },
  
  fetchAggregatedVideos: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ videos: Video[] }>(`/aggregate?url=${encodeURIComponent(url)}`);
      return response.data.videos;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Failed to aggregate videos';
      set({ 
        isLoading: false, 
        error: errorMessage
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
      
      // Add the new video to the videos array and cache
      const { videos, videoCache } = get();
      videoCache.set(response.data.id, response.data);
      
      set({ 
        videos: [response.data, ...videos], 
        videoCache,
        isLoading: false 
      });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.details?.[0]?.msg ||
                          error?.message || 
                          'Failed to upload video';
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      throw error;
    }
  },
  
  likeVideo: async (id: string) => {
    const { currentVideo, videoCache } = get();
    if (!currentVideo || currentVideo.id !== id) return;
    
    // Optimistic update
    const updatedVideo = {
      ...currentVideo,
      likes: currentVideo.likes + 1
    };
    
    // Update cache and current video
    videoCache.set(id, updatedVideo);
    set({
      currentVideo: updatedVideo,
      videoCache
    });
    
    // In a real app, we would make an API call here
    // await api.post(`/videos/${id}/like`);
  },
  
  dislikeVideo: async (id: string) => {
    const { currentVideo, videoCache } = get();
    if (!currentVideo || currentVideo.id !== id) return;
    
    // Optimistic update
    const updatedVideo = {
      ...currentVideo,
      dislikes: currentVideo.dislikes + 1
    };
    
    // Update cache and current video
    videoCache.set(id, updatedVideo);
    set({
      currentVideo: updatedVideo,
      videoCache
    });
    
    // In a real app, we would make an API call here
    // await api.post(`/videos/${id}/dislike`);
  },

  clearError: () => {
    set({ error: null });
  },

  clearVideos: () => {
    set({ 
      videos: [], 
      featuredVideos: [], 
      currentVideo: null,
      videoCache: new Map(),
      totalVideos: 0,
      totalPages: 0,
      currentPage: 1,
      lastFetchParams: null
    });
  }
}));

export default useVideoStore;