import React from 'react';
import { Link, useNavigate }
from 'react-router-dom';
import { LogOut, UserCircle, Film } from 'lucide-react'; // Assuming you use lucide-react for icons
import { auth } from '../../firebase'; // Adjust path if your firebase.ts is elsewhere
import useUserStore, { getIsAuthenticated } from '../../stores/userStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore(); // Get the firebaseUser to display email/name
  const isAuthenticated = getIsAuthenticated(); // Check if user is authenticated

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // onAuthStateChanged in App.tsx will handle clearing userStore
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout Error:', error);
      // Handle logout error, maybe display a notification
    }
  };

  return (
    <nav className="bg-dark-200 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center text-white">
              <Film className="h-8 w-8 text-primary-500 mr-2" />
              <span className="font-semibold text-xl">VideoPlatform</span>
            </Link>
          </div>
          <div className="flex items-center">
            {isAuthenticated && firebaseUser ? (
              <>
                <span className="text-gray-300 text-sm mr-4 hidden sm:block">
                  {firebaseUser.displayName || firebaseUser.email}
                </span>
                <Link 
                  to={`/profile/${firebaseUser.uid}`} // Or a generic /profile if not user-specific ID in URL
                  className="text-gray-300 hover:bg-dark-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium mr-2 flex items-center"
                >
                  <UserCircle className="h-5 w-5 mr-1" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-300 hover:bg-primary-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:bg-dark-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-4 text-white bg-primary-500 hover:bg-primary-600 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2 text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
