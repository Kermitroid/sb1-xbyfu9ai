import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download,
  Eye,
  Calendar,
  User,
  MessageCircle,
  Send
} from 'lucide-react';
import useVideoStore from '../stores/videoStore';
import useUserStore from '../stores/userStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatViews, formatTimeAgo } from '../utils/formatters';

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentVideo, 
    isLoading, 
    error, 
    fetchVideoById, 
    likeVideo, 
    dislikeVideo 
  } = useVideoStore();
  const { user, isAuthenticated } = useUserStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideoById(id);
      // In a real app, we would also fetch comments here
      // fetchComments(id);
    }
  }, [id, fetchVideoById]);

  const handleLike = () => {
    if (id && isAuthenticated) {
      likeVideo(id);
    }
  };

  const handleDislike = () => {
    if (id && isAuthenticated) {
      dislikeVideo(id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: currentVideo?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || !id) return;

    setIsSubmittingComment(true);
    try {
      // In a real app, you would make an API call here
      // await api.post(`/videos/${id}/comments`, { content: newComment });
      
      // For now, we'll just add it locally
      const comment = {
        id: Date.now().toString(),
        content: newComment,
        user: { username: user?.username || 'Anonymous' },
        createdAt: new Date().toISOString(),
        likes: 0
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <p className="text-lg">Error loading video</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Video not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black rounded-xl overflow-hidden mb-6 aspect-video">
            {currentVideo.videoUrl ? (
              <video
                className="w-full h-full object-contain"
                controls
                src={currentVideo.videoUrl}
                poster={currentVideo.thumbnail || undefined}
              >
                Your browser does not support the video tag.
              </video>
            ) : currentVideo.link ? (
              <div className="w-full h-full flex items-center justify-center bg-dark-100">
                <div className="text-center">
                  <Play className="h-16 w-16 text-white opacity-60 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">External video content</p>
                  <a
                    href={currentVideo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch on {new URL(currentVideo.link).hostname}
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
                <Play className="h-24 w-24 text-white opacity-60" />
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-4">
              {currentVideo.title}
            </h1>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {formatViews(currentVideo.views)}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatTimeAgo(currentVideo.uploadDate)}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={!isAuthenticated}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{currentVideo.likes}</span>
                </button>
                
                <button
                  onClick={handleDislike}
                  disabled={!isAuthenticated}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{currentVideo.dislikes}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentVideo.user.username}</h3>
                  <p className="text-sm text-gray-400">Creator</p>
                </div>
              </div>
              {isAuthenticated && user?.id !== currentVideo.userId && (
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Subscribe
                </button>
              )}
            </div>

            {/* Description */}
            {currentVideo.description && (
              <div className="mt-4 p-4 bg-dark-200 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {currentVideo.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {currentVideo.tags && currentVideo.tags.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {currentVideo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-dark-200 text-primary-400 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <MessageCircle className="h-6 w-6 text-white" />
              <h3 className="text-xl font-bold text-white">
                Comments ({comments.length})
              </h3>
            </div>

            {/* Add Comment */}
            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-dark-200 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setNewComment('')}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isSubmittingComment ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 bg-dark-200 rounded-lg">
                <p className="text-gray-400 mb-4">Sign in to leave a comment</p>
                <Link
                  to="/login"
                  className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-white">
                          {comment.user.username}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{comment.content}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{comment.likes}</span>
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-bold text-white mb-4">Related Videos</h3>
          <div className="space-y-4">
            {/* Placeholder for related videos */}
            <div className="text-center py-8 text-gray-400">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No related videos available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
