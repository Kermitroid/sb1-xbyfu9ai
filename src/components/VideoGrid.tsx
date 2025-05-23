import React from 'react';
import VideoCard from './VideoCard';
import { Video } from '../types';

interface VideoGridProps {
  videos: Video[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  size?: 'small' | 'medium' | 'large';
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  title, 
  loading = false, 
  emptyMessage = "No videos found", 
  size = 'medium' 
}) => {
  const gridSizeClasses = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };
  
  if (loading) {
    return (
      <div className="w-full">
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        <div className="animate-pulse grid gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="h-40 bg-gray-600"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="w-full text-center py-10">
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
      <div className={`grid ${gridSizeClasses[size]} gap-4 md:gap-6`}>
        {videos.map(video => (
          <VideoCard key={video.id} video={video} size={size} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;