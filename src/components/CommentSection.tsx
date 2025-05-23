import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/api'; // Adjust path if needed
import useUserStore, { getIsAuthenticated } from '../../stores/userStore';
import { UserCircle, Send } from 'lucide-react'; // Assuming lucide-react
import { Link } from 'react-router-dom'; // Added for login prompt

const MAX_COMMENT_LENGTH = 2000;

// Define types for Comment and User (subset for display)
interface CommentUser {
  username?: string;
  profilePic?: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string; // ISO string
  user: CommentUser; // Denormalized user info from backend
  commenterId: string; // UID of the commenter
}

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For fetching comments
  const [isPostingComment, setIsPostingComment] = useState(false); // For submitting new comment
  const [error, setError] = useState<string | null>(null); // General error for fetching
  const [postError, setPostError] = useState<string | null>(null); // Specific error for posting

  const isAuthenticated = getIsAuthenticated();
  const { firebaseUser } = useUserStore();

  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Comment[]>(`/videos/${videoId}/comments`);
      setComments(response.data);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.error || 'Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null); // Clear previous errors at the start

    const trimmedComment = newComment.trim();

    if (!trimmedComment) { 
      setPostError('Comment cannot be empty.');
      return;
    }

    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      setPostError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters. You have ${trimmedComment.length} characters.`);
      return;
    }

    if (!isAuthenticated || !firebaseUser) {
      setPostError('Please log in to post a comment.');
      return;
    }

    setIsPostingComment(true);
    // setPostError(null); // Already cleared
    try {
      const response = await apiClient.post<Comment>(`/videos/${videoId}/comments`, {
        content: trimmedComment, // Send the trimmed comment
      });
      setComments(prevComments => [response.data, ...prevComments]); 
      setNewComment(''); 
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setPostError(err.response?.data?.error || 'Failed to post comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <div className="py-6 text-white">
      <h3 className="text-xl font-semibold mb-4 border-b border-dark-100 pb-3">
        {isLoading ? 'Loading comments...' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
              <span className="text-lg">
                {(firebaseUser?.displayName || firebaseUser?.email)?.charAt(0).toUpperCase() || <UserCircle size={24} />}
              </span>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (postError) setPostError(null); // Clear error on typing
              }}
              placeholder="Add a public comment..."
              className="flex-grow p-3 bg-dark-100 border border-dark-50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm resize-none"
              rows={3}
              disabled={isPostingComment}
            />
          </div>
          {postError && <p className="text-red-400 text-xs mt-1 ml-12">{postError}</p>}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isPostingComment || !newComment.trim()}
              className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center text-sm"
            >
              <Send size={16} className="mr-2" />
              {isPostingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-dark-100 rounded-lg text-center text-gray-400 text-sm">
          Please <Link to="/login" className="text-primary-400 hover:underline">log in</Link> to post a comment.
        </div>
      )}

      {isLoading && comments.length === 0 && <div className="text-center py-4">Loading comments...</div>}
      {error && comments.length === 0 && (
        <div className="text-center py-4 text-red-400">
          <p>{error}</p>
          <button onClick={fetchComments} className="mt-2 px-3 py-1 bg-primary-500 rounded hover:bg-primary-600 text-xs">Try Again</button>
        </div>
      )}
      
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3 p-3 bg-dark-100 rounded-lg">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0">
              {comment.user?.username?.charAt(0).toUpperCase() || <UserCircle size={20} />}
            </div>
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm text-primary-300">{comment.user?.username || 'User'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          </div>
        ))}
        {!isLoading && comments.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">Be the first to comment!</div>
        )}
      </div>
    </div>
  );
}
