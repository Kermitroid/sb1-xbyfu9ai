import React, { useEffect } from 'react';
import useVideoStore from '../stores/videoStore';
import VideoGrid from '../components/VideoGrid';
import FeaturedSlider from '../components/FeaturedSlider'; // Assuming this component exists
// import CategoryTabs from '../components/CategoryTabs'; // Assuming this component exists

export default function HomePage() {
  const { 
    videos, 
    featuredVideos,
    isLoading, 
    error, 
    fetchVideos,
    currentPage,
    totalPages,
  } = useVideoStore();

  useEffect(() => {
    // Fetch initial videos only if the store is empty and not already loading
    // This prevents re-fetching if user navigates away and back quickly
    if (videos.length === 0 && !isLoading) {
      fetchVideos(1); // Fetch first page
    }
  }, [fetchVideos, videos.length, isLoading]);


  if (isLoading && videos.length === 0 && !error) { 
    // Show full page loading state (using VideoGrid's skeleton) only on initial load
    return (
      <div className="space-y-8 sm:space-y-12">
        {/* Optional: Could have a skeleton for FeaturedSlider too */}
        <div className="h-64 bg-dark-200 rounded-lg animate-pulse container mx-auto px-4"></div> 
        <VideoGrid 
          videos={[]} // Pass empty array for skeleton
          title="Latest Videos" 
          loading={true} 
        />
      </div>
    );
  }

  if (error && videos.length === 0) { 
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-2xl font-semibold text-red-400 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          onClick={() => fetchVideos(1)}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  const showFeaturedSlider = !isLoading && featuredVideos.length > 0 && currentPage === 1;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Optional: Category Tabs */}
      {/* <CategoryTabs /> */}

      {showFeaturedSlider && (
        <FeaturedSlider videos={featuredVideos} title="Featured Videos" />
      )}
      
      <VideoGrid 
        videos={videos} 
        title="Latest Videos" 
        // loading={isLoading && videos.length === 0} // Handled by the top-level loading state now
        emptyMessage={error ? "Could not load videos. Please try again later." : "No videos found at the moment."}
      />

      {totalPages > 0 && ( // Only show pagination if there are pages
        <div className="flex justify-center items-center space-x-2 sm:space-x-4 my-8">
          <button 
            onClick={() => fetchVideos(currentPage - 1)} 
            disabled={currentPage <= 1 || isLoading}
            className="px-3 sm:px-4 py-2 bg-dark-100 text-white rounded-md disabled:opacity-50 hover:bg-dark-200 transition-colors text-sm sm:text-base"
          >
            Previous
          </button>
          <span className="text-white text-sm sm:text-base">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => fetchVideos(currentPage + 1)} 
            disabled={currentPage >= totalPages || isLoading}
            className="px-3 sm:px-4 py-2 bg-dark-100 text-white rounded-md disabled:opacity-50 hover:bg-dark-200 transition-colors text-sm sm:text-base"
          >
            Next
          </button>
        </div>
      )}

      {/* Display error message if videos were previously loaded but a subsequent fetch (e.g. pagination) failed */}
      {error && videos.length > 0 && (
         <div className="text-center py-10 text-red-400">
           <p>Error updating videos: {error}. Displaying cached content.</p>
         </div>
      )}
    </div>
  );
}
