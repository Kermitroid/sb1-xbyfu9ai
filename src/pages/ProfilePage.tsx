import React from 'react';
import { useParams } from 'react-router-dom';
import useUserStore from '../stores/userStore';

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useUserStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-200 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 bg-dark-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p className="text-gray-400">User ID: {id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-dark-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Email</label>
              <p className="mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Member Since</label>
              <p className="mt-1">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Activity</h2>
          <div className="text-center text-gray-400 py-8">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;