import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import useUserStore, { getIsAuthenticated } from '../../stores/userStore';
import { 
  likeVideo, 
  unlikeVideo, 
  dislikeVideo, 
  undislikeVideo,
  VideoInteractionResponse 
} from '../../utils/api'; // Assuming api.ts is in src/utils

interface VideoMetadataProps {
  videoId: string;
  title: string;
  description: string;
  uploaderName: string; // Or uploader object
  views: number;
  initialLikes: number;
  initialDislikes: number;
  initialUserInteraction: 'liked' | 'disliked' | 'none';
  // Add other relevant metadata like uploadDate, category etc. as needed
}

export default function VideoMetadata({
  videoId,
  title,
  description,
  uploaderName,
  views,
  initialLikes,
  initialDislikes,
  initialUserInteraction,
}: VideoMetadataProps) {
  const isAuthenticated = getIsAuthenticated();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userInteraction, setUserInteraction] = useState(initialUserInteraction);
  const [isLoadingInteraction, setIsLoadingInteraction] = useState(false);

  // Update state if initial props change (e.g., due to parent re-fetching)
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setUserInteraction(initialUserInteraction);
  }, [initialLikes, initialDislikes, initialUserInteraction, videoId]); // Added videoId dependency

  const handleInteractionUpdate = (response: { data: VideoInteractionResponse }) => {
    setLikes(response.data.likes);
    setDislikes(response.data.dislikes);
    setUserInteraction(response.data.userInteraction);
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like videos.'); // Consider a more integrated modal/redirect
      return;
    }
    if (isLoadingInteraction) return;
    setIsLoadingInteraction(true);
    try {
      const response = userInteraction === 'liked' 
        ? await unlikeVideo(videoId) 
        : await likeVideo(videoId);
      handleInteractionUpdate(response);
    } catch (error) {
      console.error('Failed to update like status:', error);
      // Optionally, show an error message to the user via a toast/notification
    } finally {
      setIsLoadingInteraction(false);
    }
  };

  const handleDislikeClick = async () => {
    if (!isAuthenticated) {
      alert('Please log in to dislike videos.'); // Consider a more integrated modal/redirect
      return;
    }
    if (isLoadingInteraction) return;
    setIsLoadingInteraction(true);
    try {
      const response = userInteraction === 'disliked'
        ? await undislikeVideo(videoId)
        : await dislikeVideo(videoId);
      handleInteractionUpdate(response);
    } catch (error) {
      console.error('Failed to update dislike status:', error);
      // Optionally, show an error message to the user via a toast/notification
    } finally {
      setIsLoadingInteraction(false);
    }
  };

  return (
    <div className="py-4 text-white">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">{title}</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-400 mb-3">
        <span className="mb-2 sm:mb-0">{views?.toLocaleString() || '0'} views</span>
        {/* Add upload date here if available */}
        {/* Like/Dislike Buttons - Moved here for better mobile layout */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLikeClick}
            disabled={isLoadingInteraction || !isAuthenticated}
            className={`flex items-center space-x-1.5 p-2 rounded-lg hover:bg-dark-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
              userInteraction === 'liked' ? 'text-primary-500 bg-dark-100' : 'text-gray-400'
            }`}
            aria-label="Like video"
          >
            <ThumbsUp size={20} />
            <span>{likes?.toLocaleString() || '0'}</span>
          </button>
          <button
            onClick={handleDislikeClick}
            disabled={isLoadingInteraction || !isAuthenticated}
            className={`flex items-center space-x-1.5 p-2 rounded-lg hover:bg-dark-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
              userInteraction === 'disliked' ? 'text-blue-500 bg-dark-100' : 'text-gray-400' 
            }`}
            aria-label="Dislike video"
          >
            <ThumbsDown size={20} />
            <span>{dislikes?.toLocaleString() || '0'}</span>
          </button>
        </div>
      </div>
      <div className="border-t border-dark-100 py-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-lg flex-shrink-0">
            {uploaderName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white font-semibold text-base">{uploaderName || 'Unknown Uploader'}</div>
            {/* Add subscriber count here if available */}
          </div>
          {/* Subscribe button can go here */}
        </div>
        <div className="mt-2 text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
          <p>{description || "No description available."}</p>
        </div>
      </div>
      {/* Consider adding tags, category display here */}
    </div>
  );
}
