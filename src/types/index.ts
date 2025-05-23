export interface User {
  id: string;
  username: string;
  email?: string;
  profilePic?: string | null;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string | null;
  videoUrl?: string;
  link?: string | null;
  source: 'user' | 'aggregated';
  sourceUrl?: string;
  duration: string;
  views: number;
  likes: number;
  dislikes: number;
  uploadDate: string;
  category?: string;
  tags?: string[];
  userId?: string;
  user: {
    username: string;
    profilePic?: string | null;
  };
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  user: {
    username: string;
    profilePic?: string | null;
  };
  content: string;
  createdAt: string;
  likes: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  videos: T[];
  totalVideos: number;
  totalPages: number;
  currentPage: number;
}