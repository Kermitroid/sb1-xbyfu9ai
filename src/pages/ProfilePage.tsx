import React, { useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import useUserStore, { getIsAuthenticated } from '../stores/userStore';

// This page will now primarily display the currently logged-in user's profile.
// The route in App.tsx might need to be changed from /profile/:id to /profile

export default function ProfilePage() {
  const navigate = useNavigate();
  const { firebaseUser, isLoading: isAuthLoading } = useUserStore();
  const isAuthenticated = getIsAuthenticated();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return <div className="text-center py-10 text-white">Loading profile...</div>;
  }

  if (!firebaseUser) {
    // This case is mostly handled by the redirect, but good for robustness
    return (
      <div className="text-center py-10 text-white">
        Please log in to view your profile.
      </div>
    );
  }

  const creationDate = firebaseUser.metadata.creationTime 
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString() 
    : 'N/A';
  
  const displayName = firebaseUser.displayName || firebaseUser.email;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-white">
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

      <div className="grid md:grid-cols-2 gap-6">
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
              {/* Could add email verification status if desired: firebaseUser.emailVerified */}
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
          <div className="text-center text-gray-400 py-8">
            <p>Feature to display user's videos coming soon!</p>
            {/* This would require a backend endpoint like GET /api/users/me/videos or GET /api/videos?uploaderId=firebaseUser.uid */}
          </div>
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
