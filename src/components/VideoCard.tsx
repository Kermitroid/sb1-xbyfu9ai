import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Video } from '../types';
import { formatViews, formatTimeAgo } from '../utils/formatters';

interface VideoCardProps {
  video: Video;
  size?: 'small' | 'medium' | 'large';
}

const VideoCard: React.FC<VideoCardProps> = ({ video, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-full sm:w-48 md:w-64',
    medium: 'w-full sm:w-64 md:w-80',
    large: 'w-full md:w-96'
  };
  
  const imgSizeClasses = {
    small: 'h-32 sm:h-28 md:h-36',
    medium: 'h-40 sm:h-36 md:h-44',
    large: 'h-48 md:h-56'
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-xl hover:-translate-y-1`}>
      <Link to={`/video/${video.id}`} className="block">
        <div className="relative">
          <img 
            src={video.thumbnail || 'https://via.placeholder.com/640x360?text=No+Thumbnail'} 
            alt={video.title} 
            className={`${imgSizeClasses[size]} w-full object-cover`}
          />
          
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            <Clock className="inline-block w-3 h-3 mr-1" />
            {video.duration}
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="text-white font-medium line-clamp-2 mb-1">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span>{formatViews(video.views)}</span>
            </div>
            
            <div className="flex items-center">
              <ThumbsUp className="w-3 h-3 mr-1" />
              <span>{video.likes}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>{video.user.username}</span>
            <span>{formatTimeAgo(video.uploadDate)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;