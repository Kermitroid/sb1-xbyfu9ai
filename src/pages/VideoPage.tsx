import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient, { getVideoInteractions, VideoInteractionResponse } from '../../utils/api'; // Adjust path if needed
import useUserStore, { getIsAuthenticated } from '../../stores/userStore'; // For auth status
import VideoMetadata from '../../components/VideoMetadata'; // Adjust path
// import VideoPlayer from '../../components/VideoPlayer'; // Assuming you have this
// import CommentSection from '../../components/CommentSection'; // Assuming you have this

// Define a type for your main video data structure from /api/videos/:id
interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  uploaderId: string;
  uploaderName?: string; // Assuming backend might provide this or you fetch it separately
  views: number;
  likes: number;
  dislikes: number;
  duration: number;
  uploadDate: string;
  category?: string;
  tags?: string[];
  // Add any other fields your video object contains
}

export default function VideoPage() {
  const { id: videoId } = useParams<{ id: string }>();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [interactionData, setInteractionData] = useState<VideoInteractionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = getIsAuthenticated();
  // Subscribe to firebaseUser to re-trigger effect on login/logout
  const firebaseUserUid = useUserStore(state => state.firebaseUser?.uid); 

  useEffect(() => {
    if (!videoId) {
      setError('Video ID is missing.');
      setIsLoading(false);
      return;
    }

    const fetchVideoAndInteractions = async () => {
      setIsLoading(true);
      setError(null);
      setVideoData(null); // Clear previous video data
      setInteractionData(null); // Clear previous interaction data

      try {
        // Fetch main video data
        const videoResponse = await apiClient.get(`/videos/${videoId}`);
        const fetchedVideoData = videoResponse.data as VideoData;
        setVideoData(fetchedVideoData);

        // Fetch user's interaction data for this video
        // This will be called if user is logged in, or after they log in (due to firebaseUserUid dependency)
        if (isAuthenticated) {
          const interactionResponse = await getVideoInteractions(videoId);
          setInteractionData(interactionResponse.data);
        } else {
          // If not authenticated, set a default interaction state based on video data (counts only)
          // This part is important for when the user logs out while on the page.
          setInteractionData({
            likes: fetchedVideoData.likes, // Use likes from main video data
            dislikes: fetchedVideoData.dislikes, // Use dislikes from main video data
            userInteraction: 'none',
          });
        }
        
      } catch (err: any) {
        console.error('Error fetching video data:', err);
        setError(err.response?.data?.error || 'Failed to load video.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoAndInteractions();
  }, [videoId, isAuthenticated, firebaseUserUid]); // Re-fetch if videoId changes or auth state (user) changes

  if (isLoading) {
    return <div className="text-center py-10 text-white">Loading video details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  if (!videoData) {
    return <div className="text-center py-10 text-white">Video not found or still loading.</div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Placeholder for VideoPlayer component */}
      <div className="my-4 p-2 sm:p-4 bg-dark-200 rounded-lg shadow aspect-video flex items-center justify-center">
        <p className="text-center text-gray-400">Video Player for: {videoData.videoUrl}</p>
        {/* A real video player would go here: <VideoPlayer videoUrl={videoData.videoUrl} thumbnailUrl={videoData.thumbnailUrl} /> */}
      </div>

      <VideoMetadata
        videoId={videoData.id}
        title={videoData.title}
        description={videoData.description}
        uploaderName={videoData.uploaderName || videoData.uploaderId}
        views={videoData.views}
        // Use interactionData for initial values if available, otherwise fallback to videoData
        // This handles the case where interactionData might still be loading or user is logged out
        initialLikes={interactionData?.likes ?? videoData.likes}
        initialDislikes={interactionData?.dislikes ?? videoData.dislikes}
        initialUserInteraction={interactionData?.userInteraction ?? 'none'}
      />
      
      {/* Placeholder for CommentSection component */}
      <div className="my-4 p-4 bg-dark-100 rounded-lg shadow">
         <p className="text-center text-gray-300">Comment Section (Video ID: {videoData.id})</p>
         {/* <CommentSection videoId={videoData.id} /> */}
      </div>
    </div>
  );
}
