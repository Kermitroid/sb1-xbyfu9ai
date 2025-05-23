import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download, 
  Flag, 
  Calendar,
  Clock,
  User,
  Tag,
  FileVideo,
  Globe,
  Heart,
  Bookmark,
  MoreVertical,
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { Video } from '../types';
import useUserStore from '../stores/userStore';
import { formatViews, formatTimeAgo, formatDuration } from '../utils/formatters';

interface VideoMetadataProps {
  video: Video;
  onLike?: () => void;
  onDislike?: () => void;
  onSubscribe?: () => void;
  className?: string;
}

const VideoMetadata: React.FC<VideoMetadataProps> = ({
  video,
  onLike,
  onDislike,
  onSubscribe,
  className = ''
}) => {
  const { user, isAuthenticated } = useUserStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isOwner = user?.id === video.userId;

  const handleLike = () => {
    if (isAuthenticated && onLike) {
      onLike();
    }
  };

  const handleDislike = () => {
    if (isAuthenticated && onDislike) {
      onDislike();
    }
  };

  const handleSubscribe = () => {
    if (isAuthenticated && onSubscribe) {
      setIsSubscribed(!isSubscribed);
      onSubscribe();
    }
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = video.title;
    const text = `Check out this video: ${title}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          // You could add a toast notification here
        } catch (error) {
          console.error('Failed to copy URL:', error);
        }
        break;
      default:
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch (error) {
            console.error('Failed to share:', error);
          }
        }
    }
    setShowShareMenu(false);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // In a real app, you would make API call to save/unsave video
  };

  const getVideoQuality = () => {
    // Mock quality detection based on video properties
    if (video.thumbnail && video.thumbnail.includes('hd')) return 'HD';
    return 'SD';
  };

  const getVideoSize = () => {
    // Mock file size calculation
    const duration = parseInt(video.duration.split(':')[0]) * 60 + parseInt(video.duration.split(':')[1] || '0');
    return `${Math.round(duration * 0.5)} MB`; // Rough estimate
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title and Basic Info */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {video.title}
        </h1>
        
        {/* Stats and Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* View Stats */}
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <span className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{formatViews(video.views)} views</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTimeAgo(video.uploadDate)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{video.duration}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Like/Dislike */}
            <div className="flex items-center bg-dark-200 rounded-lg overflow-hidden">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-dark-100 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{formatViews(video.likes)}</span>
              </button>
              <div className="w-px h-6 bg-dark-100" />
              <button
                onClick={handleDislike}
                disabled={!isAuthenticated}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-dark-100 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{formatViews(video.dislikes)}</span>
              </button>
            </div>

            {/* Share */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center space-x-2 bg-dark-200 hover:bg-dark-100 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden md:inline">Share</span>
              </button>
              
              {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 bg-dark-200 border border-dark-100 rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy link</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Share on Facebook</span>
                  </button>
                </div>
              )}
            </div>

            {/* Save */}
            {isAuthenticated && (
              <button
                onClick={handleSave}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isSaved 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-200 hover:bg-dark-100 text-white'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            )}

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="flex items-center justify-center bg-dark-200 hover:bg-dark-100 text-white p-2 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showMoreActions && (
                <div className="absolute top-full mt-2 right-0 bg-dark-200 border border-dark-100 rounded-lg shadow-lg py-2 z-10 min-w-[140px]">
                  <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full">
                    <Flag className="h-4 w-4" />
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Creator Information */}
      <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
        <div className="flex items-center space-x-4">
          <Link to={`/profile/${video.userId}`} className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              {video.user.profilePic ? (
                <img 
                  src={video.user.profilePic} 
                  alt={video.user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/profile/${video.userId}`}
              className="font-semibold text-white hover:text-primary-400 transition-colors"
            >
              {video.user.username}
            </Link>
            <p className="text-sm text-gray-400">Creator</p>
          </div>
        </div>

        {isAuthenticated && !isOwner && (
          <button
            onClick={handleSubscribe}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Description */}
      {video.description && (
        <div className="bg-dark-200 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Description</h3>
          <div className="text-gray-300 text-sm leading-relaxed">
            {showFullDescription ? (
              <p className="whitespace-pre-wrap">{video.description}</p>
            ) : (
              <p className="line-clamp-3 whitespace-pre-wrap">{video.description}</p>
            )}
            
            {video.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary-400 hover:text-primary-300 mt-2 text-sm font-medium transition-colors"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Details */}
      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-4">Video Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Category */}
          {video.category && (
            <div className="flex items-center space-x-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-gray-400">Category:</span>
                <span className="text-white ml-2">{video.category}</span>
              </div>
            </div>
          )}

          {/* Source */}
          <div className="flex items-center space-x-3">
            <FileVideo className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-gray-400">Source:</span>
              <span className="text-white ml-2 capitalize">{video.source}</span>
            </div>
          </div>

          {/* Quality */}
          <div className="flex items-center space-x-3">
            <FileVideo className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-gray-400">Quality:</span>
              <span className="text-white ml-2">{getVideoQuality()}</span>
            </div>
          </div>

          {/* File Size */}
          <div className="flex items-center space-x-3">
            <FileVideo className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-gray-400">Size:</span>
              <span className="text-white ml-2">{getVideoSize()}</span>
            </div>
          </div>

          {/* External Source */}
          {video.source === 'aggregated' && video.sourceUrl && (
            <div className="flex items-center space-x-3 md:col-span-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-gray-400">Original source:</span>
                <a
                  href={video.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 ml-2 transition-colors inline-flex items-center space-x-1"
                >
                  <span>{new URL(video.sourceUrl).hostname}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="bg-dark-200 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-dark-100 hover:bg-primary-500 text-primary-400 hover:text-white text-sm rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-4">Engagement</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatViews(video.views)}</div>
            <div className="text-sm text-gray-400">Views</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{formatViews(video.likes)}</div>
            <div className="text-sm text-gray-400">Likes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{formatViews(video.dislikes)}</div>
            <div className="text-sm text-gray-400">Dislikes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round((video.likes / (video.likes + video.dislikes)) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Liked</div>
          </div>
        </div>

        {/* Like/Dislike Bar */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-green-400" />
            <ThumbsDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="w-full bg-dark-100 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(video.likes / (video.likes + video.dislikes)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoMetadata;
