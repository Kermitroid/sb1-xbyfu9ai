import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore, { getIsAuthenticated } from '../stores/userStore';
import apiClient from '../utils/api'; // Import your API client
import { Video, PaginatedResponse } from '../types'; // Assuming Video type is defined
import VideoGrid from '../components/VideoGrid'; // Import VideoGrid

export default function ProfilePage() {
  const navigate = useNavigate();
  const { firebaseUser, isLoading: isAuthLoading } = useUserStore();
  const isAuthenticated = getIsAuthenticated();

  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [videosCurrentPage, setVideosCurrentPage] = useState(1);
  const [videosTotalPages, setVideosTotalPages] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  const fetchUserVideos = useCallback(async (page: number = 1) => {
    if (!firebaseUser) return;

    setIsLoadingVideos(true);
    setVideosError(null);
    try {
      // Use the new endpoint: /api/users/:userId/videos
      const response = await apiClient.get<PaginatedResponse<Video>>(`/users/${firebaseUser.uid}/videos`, {
        params: { page, limit: 6 } // Example limit, adjust as needed
      });
      setUserVideos(response.data.videos);
      setVideosCurrentPage(response.data.currentPage);
      setVideosTotalPages(response.data.totalPages);
    } catch (err: any) {
      console.error("Error fetching user's videos:", err);
      setVideosError(err.response?.data?.error || "Failed to load your videos.");
    } finally {
      setIsLoadingVideos(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    } else if (isAuthenticated && firebaseUser) {
      fetchUserVideos(1); 
    }
  }, [isAuthenticated, isAuthLoading, navigate, firebaseUser, fetchUserVideos]);


  if (isAuthLoading) {
    return <div className="text-center py-10 text-white">Loading profile...</div>;
  }

  if (!firebaseUser) {
    return <div className="text-center py-10 text-white">Please log in to view your profile.</div>;
  }

  const creationDate = firebaseUser.metadata.creationTime 
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString() 
    : 'N/A';
  
  const displayName = firebaseUser.displayName || firebaseUser.email;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-white">
      {/* User Info Section */}
      <div className="bg-dark-200 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
            <span className="text-4xl">{avatarLetter}</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
            <p className="text-gray-400 text-sm">UID: {firebaseUser.uid}</p>
          </div>
        </div>
      </div>

      {/* Profile Info and Uploaded Videos Grid */}
      <div className="grid grid-cols-1 gap-6"> {/* Single column layout for these sections */}
        <div className="bg-dark-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-dark-100 pb-2">Profile Information</h2>
          <div className="space-y-3">
            {firebaseUser.displayName && (
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Username</label>
                    <p className="mt-1 text-base">{firebaseUser.displayName}</p>
                </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400">Email</label>
              <p className="mt-1 text-base">{firebaseUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Member Since</label>
              <p className="mt-1 text-base">{creationDate}</p>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-400">Last Sign In</label>
              <p className="mt-1 text-base">{firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-dark-100 pb-2">My Uploaded Videos</h2>
          {videosError && !isLoadingVideos && (
            <div className="text-center text-red-400 py-8">
              <p>Could not load your videos: {videosError}</p>
              <button 
                onClick={() => fetchUserVideos(1)} // Retry fetching first page
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Try Again
              </button>
            </div>
          )}
          {!videosError && (
            <VideoGrid
              videos={userVideos}
              loading={isLoadingVideos}
              emptyMessage="You haven't uploaded any videos yet."
              size="small" // Using 'small' size for the profile page video grid
            />
          )}
          {!isLoadingVideos && !videosError && videosTotalPages > 0 && (
            <div className="flex justify-center items-center space-x-2 sm:space-x-4 mt-6 py-4">
              <button 
                onClick={() => fetchUserVideos(videosCurrentPage - 1)} 
                disabled={videosCurrentPage <= 1 || isLoadingVideos}
                className="px-3 sm:px-4 py-2 bg-dark-100 text-white rounded-md disabled:opacity-50 hover:bg-dark-200 transition-colors text-sm sm:text-base"
              >
                Previous
              </button>
              <span className="text-white text-sm sm:text-base">Page {videosCurrentPage} of {videosTotalPages}</span>
              <button 
                onClick={() => fetchUserVideos(videosCurrentPage + 1)} 
                disabled={videosCurrentPage >= videosTotalPages || isLoadingVideos}
                className="px-3 sm:px-4 py-2 bg-dark-100 text-white rounded-md disabled:opacity-50 hover:bg-dark-200 transition-colors text-sm sm:text-base"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
       
      <div className="mt-6 bg-dark-200 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-dark-100 pb-2">Account Settings</h2>
        <div className="text-center text-gray-400 py-8">
          <p>Account management options (e.g., update profile, change password) coming soon!</p>
        </div>
      </div>
    </div>
  );
}
