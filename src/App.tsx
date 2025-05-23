import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import AggregationPage from './pages/AggregationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import useVideoStore from './stores/videoStore';
import useUserStore from './stores/userStore'; // Original import
import { ThemeProvider } from './context/ThemeContext';

// Firebase imports for auth listener
import { auth } from './firebase'; // Assuming src/firebase.ts
import firebase from 'firebase/compat/app'; // For firebase.Unsubscribe type

function App() {
  const { fetchVideos } = useVideoStore();
  // Get actions and relevant state from useUserStore
  const { setUserAndToken, setLoading } = useUserStore();

  useEffect(() => {
    // Fetch initial videos when the app loads
    fetchVideos();
  }, [fetchVideos]);

  // Setup Firebase onAuthStateChanged listener
  useEffect(() => {
    setLoading(true); // Start in loading state
    const unsubscribe: firebase.Unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        try {
          const idToken = await user.getIdToken();
          setUserAndToken(user, idToken);
        } catch (error) {
          console.error("Error getting ID token:", error);
          // Handle error, maybe sign out user or set error state in store
          setUserAndToken(null, null); // Clear user if token fetch fails
        }
      } else {
        // User is signed out
        setUserAndToken(null, null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setUserAndToken, setLoading]); // Add dependencies

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-dark-300 text-white flex flex-col">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/video/:id" element={<VideoPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/profile/:id" element={<ProfilePage />} /> {/* Consider changing to /profile or /profile/:userId */}
                <Route path="/search" element={<SearchPage />} />
                <Route path="/aggregate" element={<AggregationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;