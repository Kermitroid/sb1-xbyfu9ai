import React from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid';
import useVideoStore from '../stores/videoStore';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { videos } = useVideoStore();

  // Filter videos based on search query
  const searchResults = videos.filter(video => 
    video.title?.toLowerCase().includes(query.toLowerCase()) ||
    video.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-400 mt-2">
          {searchResults.length} results found
        </p>
      </div>

      {searchResults.length > 0 ? (
        <VideoGrid videos={searchResults} />
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">
            No videos found matching your search
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;