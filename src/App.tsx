import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import useVideoStore from './stores/videoStore';
import useUserStore from './stores/userStore';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AggregationPage = lazy(() => import('./pages/AggregationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

function App() {
  const { fetchVideos } = useVideoStore();
  const { user, isAuthenticated } = useUserStore();

  useEffect(() => {
    // Fetch initial videos when the app loads
    fetchVideos().catch(error => {
      console.error('Failed to fetch initial videos:', error);
    });
  }, [fetchVideos]);

  const PageFallback = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-dark-300 text-white flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 md:ml-64">
                <Suspense fallback={<PageFallback />}>
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
                </Suspense>
              </main>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;