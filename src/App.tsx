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
import useUserStore from './stores/userStore';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const { fetchVideos } = useVideoStore();
  const { user, isAuthenticated } = useUserStore();

  useEffect(() => {
    // Fetch initial videos when the app loads
    fetchVideos();
  }, [fetchVideos]);

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
                <Route path="/profile/:id" element={<ProfilePage />} />
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