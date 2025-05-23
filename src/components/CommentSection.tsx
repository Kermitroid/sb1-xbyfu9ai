import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Send, 
  User,
  MoreVertical,
  Flag,
  Edit3,
  Trash2
} from 'lucide-react';
import useUserStore from '../stores/userStore';
import LoadingSpinner from './LoadingSpinner';
import { formatTimeAgo } from '../utils/formatters';
import { Comment } from '../types';

interface CommentSectionProps {
  videoId: string;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onLike, 
  onReply, 
  onEdit, 
  onDelete,
  depth = 0 
}) => {
  const { user, isAuthenticated } = useUserStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.id === comment.userId;
  const maxDepth = 3;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !onEdit) return;

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-dark-100 pl-4' : ''}`}>
      <div className="flex space-x-3 group">
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

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-white text-sm">
              {comment.user.username}
            </span>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
            
            {/* Actions Menu */}
            {isAuthenticated && (
              <div className="relative ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-6 bg-dark-200 border border-dark-100 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    {isOwner && onEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowActions(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {isOwner && onDelete && (
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowActions(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-100 w-full"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    )}
                    {!isOwner && (
                      <button
                        onClick={() => setShowActions(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-100 w-full"
                      >
                        <Flag className="h-3 w-3" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Text */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-dark-100 border border-dark-100 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none text-sm"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editContent.trim() || isSubmitting}
                  className="flex items-center space-x-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : <Edit3 className="h-3 w-3" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {comment.content}
            </p>
          )}

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-xs">
            <button
              onClick={() => onLike(comment.id)}
              disabled={!isAuthenticated}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            >
              <ThumbsUp className="h-3 w-3" />
              <span>{comment.likes}</span>
            </button>
            
            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                disabled={!isAuthenticated}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && isAuthenticated && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-dark-100 border border-dark-100 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none text-sm"
                    rows={2}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      className="flex items-center space-x-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      {isSubmitting ? <LoadingSpinner size="sm" /> : <Send className="h-3 w-3" />}
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ videoId, className = '' }) => {
  const { user, isAuthenticated } = useUserStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch from API
      // const response = await api.get(`/videos/${videoId}/comments`);
      // setComments(response.data);
      
      // Mock data for now
      setComments([]);
    } catch (error) {
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      // In a real app, you would post to API
      // await api.post(`/videos/${videoId}/comments`, { content: newComment });
      
      // Mock adding comment locally
      const comment: Comment = {
        id: Date.now().toString(),
        videoId,
        userId: user!.id,
        user: { 
          username: user!.username, 
          profilePic: user!.profilePic 
        },
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      setError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Optimistic update
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ));
    
    // In a real app, you would make API call
    // await api.post(`/comments/${commentId}/like`);
  };

  const handleReplyToComment = async (commentId: string, content: string) => {
    // In a real app, you would post reply to API
    console.log('Reply to', commentId, ':', content);
  };

  const handleEditComment = async (commentId: string, content: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, content }
        : comment
    ));
    
    // In a real app, you would make API call
    // await api.put(`/comments/${commentId}`, { content });
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    // In a real app, you would make API call
    // await api.delete(`/comments/${commentId}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-4">
        <MessageCircle className="h-6 w-6 text-white" />
        <h3 className="text-xl font-bold text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.profilePic ? (
                <img 
                  src={user.profilePic} 
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-dark-200 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                rows={3}
                disabled={isSubmitting}
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
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? (
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
          <a
            href="/login"
            className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLikeComment}
              onReply={handleReplyToComment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
