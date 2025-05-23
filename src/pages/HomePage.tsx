import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, ThumbsUp, Clock, TrendingUp, Upload } from 'lucide-react';
import useVideoStore from '../stores/videoStore';
import useUserStore from '../stores/userStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatViews, formatTimeAgo } from '../utils/formatters';

const HomePage = () => {
  const { 
    videos, 
    featuredVideos, 
    isLoading, 
    error, 
    fetchVideos,
    clearError 
  } = useVideoStore();
  const { isAuthenticated } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const categories = [
    'All',
    'Gaming',
    'Music', 
    'Technology',
    'Education',
    'Sports',
    'Entertainment',
    'News'
  ];

  const handleCategoryChange = (category: string) => {
    const cat = category === 'All' ? '' : category;
    setSelectedCategory(cat);
    fetchVideos(1, 20, cat);
  };

  const VideoCard = ({ video }: { video: any }) => (
    <Link
      to={`/video/${video.id}`}
      className="group bg-dark-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-dark-100">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
            <Play className="h-12 w-12 text-white opacity-60" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Play className="h-16 w-16 text-white opacity-0 group-hover:opacity-80 transition-all duration-300" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
          {video.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {formatViews(video.views)}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {video.likes}
          </span>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeAgo(video.uploadDate)}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          by {video.user.username}
        </div>
      </div>
    </Link>
  );

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to VideoTube
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          Discover amazing videos from creators around the world
        </p>
        {!isAuthenticated && (
          <Link
            to="/register"
            className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Join and Start Creating
          </Link>
        )}
      </div>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <section>
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-primary-500 mr-2" />
            <h2 className="text-2xl font-bold text-white">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              (category === 'All' && !selectedCategory) || selectedCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-dark-200 text-gray-300 hover:bg-dark-100 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* All Videos */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">
          {selectedCategory ? `${selectedCategory} Videos` : 'All Videos'}
        </h2>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos found</p>
              <p className="text-sm">Be the first to upload a video!</p>
            </div>
            {isAuthenticated && (
              <Link
                to="/upload"
                className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Link>
            )}
          </div>
        )}
      </section>

      {isLoading && videos.length > 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default HomePage;
