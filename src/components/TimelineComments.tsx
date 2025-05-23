import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageCircle, 
  Clock, 
  User, 
  ThumbsUp, 
  Pin, 
  Play,
  Send,
  Edit3,
  Trash2,
  MoreVertical
} from 'lucide-react';
import useUserStore from '../stores/userStore';
import LoadingSpinner from './LoadingSpinner';
import { formatTimeAgo, formatDuration } from '../utils/formatters';

interface TimelineComment {
  id: string;
  videoId: string;
  userId: string;
  user: {
    username: string;
    profilePic?: string | null;
  };
  content: string;
  timestamp: number; // in seconds
  createdAt: string;
  likes: number;
  isPinned?: boolean;
}

interface TimelineCommentsProps {
  videoId: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

const TimelineComments: React.FC<TimelineCommentsProps> = ({
  videoId,
  currentTime,
  duration,
  onSeek,
  className = ''
}) => {
  const { user, isAuthenticated } = useUserStore();
  const [comments, setComments] = useState<TimelineComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);

  // Load comments on component mount
  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch from API
      // const response = await api.get(`/videos/${videoId}/timeline-comments`);
      // setComments(response.data);
      
      // Mock data for demonstration
      const mockComments: TimelineComment[] = [
        {
          id: '1',
          videoId,
          userId: 'user1',
          user: { username: 'VideoFan123' },
          content: 'Great explanation of the concept here!',
          timestamp: 45,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 12,
          isPinned: true
        },
        {
          id: '2',
          videoId,
          userId: 'user2',
          user: { username: 'TechGuru' },
          content: 'This part is confusing, could you elaborate?',
          timestamp: 128,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          likes: 5
        },
        {
          id: '3',
          videoId,
          userId: 'user3',
          user: { username: 'StudentLife' },
          content: 'Perfect timing for this example!',
          timestamp: 245,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          likes: 8
        }
      ];
      
      setComments(mockComments);
    } catch (error) {
      setError('Failed to load timeline comments');
    } finally {
      setIsLoading(false);
    }
  };

  // Get comments near current time (within 5 seconds)
  const activeComments = useMemo(() => {
    return comments.filter(comment => 
      Math.abs(comment.timestamp - currentTime) <= 5
    ).sort((a, b) => a.timestamp - b.timestamp);
  }, [comments, currentTime]);

  // Sort comments by timestamp for timeline view
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => a.timestamp - b.timestamp);
  }, [comments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      // In a real app, you would post to API
      // await api.post(`/videos/${videoId}/timeline-comments`, { 
      //   content: newComment,
      //   timestamp: Math.round(currentTime)
      // });
      
      // Mock adding comment locally
      const comment: TimelineComment = {
        id: Date.now().toString(),
        videoId,
        userId: user!.id,
        user: { 
          username: user!.username, 
          profilePic: user!.profilePic 
        },
        content: newComment.trim(),
        timestamp: Math.round(currentTime),
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setShowCommentForm(false);
    } catch (error) {
      setError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ));
    
    // In a real app, you would make API call
    // await api.post(`/timeline-comments/${commentId}/like`);
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    // In a real app, you would make API call
    // await api.delete(`/timeline-comments/${commentId}`);
  };

  const handleSeekToComment = (timestamp: number) => {
    onSeek(timestamp);
    setActiveComment(comments.find(c => c.timestamp === timestamp)?.id || null);
  };

  const getTimelinePosition = (timestamp: number) => {
    return duration > 0 ? (timestamp / duration) * 100 : 0;
  };

  const TimelineBar = () => (
    <div className="relative w-full h-2 bg-dark-100 rounded-full mb-4">
      {/* Progress bar */}
      <div 
        className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-150"
        style={{ width: `${getTimelinePosition(currentTime)}%` }}
      />
      
      {/* Comment markers */}
      {sortedComments.map((comment) => (
        <button
          key={comment.id}
          onClick={() => handleSeekToComment(comment.timestamp)}
          onMouseEnter={() => setHoveredTimestamp(comment.timestamp)}
          onMouseLeave={() => setHoveredTimestamp(null)}
          className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-all duration-200 hover:scale-125 ${
            comment.isPinned ? 'bg-yellow-400' : 'bg-blue-400'
          } ${activeComment === comment.id ? 'scale-125 ring-2 ring-white' : ''}`}
          style={{ left: `${getTimelinePosition(comment.timestamp)}%` }}
          title={`${formatDuration(comment.timestamp)}: ${comment.content.slice(0, 50)}...`}
        />
      ))}
      
      {/* Hover tooltip */}
      {hoveredTimestamp !== null && (
        <div 
          className="absolute bottom-full mb-2 bg-dark-200 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
          style={{ left: `${getTimelinePosition(hoveredTimestamp)}%`, transform: 'translateX(-50%)' }}
        >
          {formatDuration(hoveredTimestamp)}
        </div>
      )}
    </div>
  );

  const CommentItem = ({ comment }: { comment: TimelineComment }) => {
    const [showActions, setShowActions] = useState(false);
    const isOwner = user?.id === comment.userId;

    return (
      <div className={`flex space-x-3 p-3 rounded-lg transition-all duration-200 ${
        activeComment === comment.id ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-dark-100'
      }`}>
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
          {comment.user.profilePic ? (
            <img 
              src={comment.user.profilePic} 
              alt={comment.user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-white text-sm">
              {comment.user.username}
            </span>
            <button
              onClick={() => handleSeekToComment(comment.timestamp)}
              className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 text-xs transition-colors"
            >
              <Clock className="h-3 w-3" />
              <span>{formatDuration(comment.timestamp)}</span>
            </button>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-yellow-400" />
            )}
            
            {/* Actions */}
            {isAuthenticated && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-6 bg-dark-200 border border-dark-100 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                    {isOwner && (
                      <button
                        onClick={() => {
                          handleDeleteComment(comment.id);
                          setShowActions(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-100 w-full"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-gray-300 text-sm mb-2 leading-relaxed">
            {comment.content}
          </p>

          <div className="flex items-center space-x-4 text-xs">
            <button
              onClick={() => handleLikeComment(comment.id)}
              disabled={!isAuthenticated}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            >
              <ThumbsUp className="h-3 w-3" />
              <span>{comment.likes}</span>
            </button>
            
            <button
              onClick={() => handleSeekToComment(comment.timestamp)}
              className="flex items-center space-x-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Play className="h-3 w-3" />
              <span>Go to time</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">
            Timeline Comments ({comments.length})
          </h3>
        </div>
        
        {isAuthenticated && (
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment at {formatDuration(currentTime)}</span>
          </button>
        )}
      </div>

      {/* Timeline Bar */}
      <TimelineBar />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      {showCommentForm && isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="bg-dark-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Comment at {formatDuration(currentTime)}</span>
          </div>
          
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.profilePic ? (
                <img 
                  src={user.profilePic} 
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment at this timestamp..."
                className="w-full bg-dark-100 border border-dark-100 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none text-sm"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowCommentForm(false);
                setNewComment('');
              }}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span>Comment</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Comments (near current time) */}
      {activeComments.length > 0 && (
        <div className="bg-dark-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Comments near current time
          </h4>
          <div className="space-y-3">
            {activeComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}

      {/* All Comments */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-gray-400 mb-3">All Timeline Comments</h4>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedComments.length > 0 ? (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {sortedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No timeline comments yet</p>
            <p className="text-sm">Be the first to comment at a specific timestamp!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineComments;
