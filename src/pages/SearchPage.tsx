import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import useVideoStore from '../stores/videoStore';
import LoadingSpinner from '../components/LoadingSpinner';
import VideoGrid from '../components/VideoGrid';
import { useDebounce } from '../hooks/useDebounce';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    videos, 
    isLoading, 
    error, 
    fetchVideos,
    clearError 
  } = useVideoStore();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const debouncedQuery = useDebounce(query, 500);

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

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Upload Date' },
    { value: 'views', label: 'View Count' },
    { value: 'likes', label: 'Likes' },
    { value: 'title', label: 'Title A-Z' }
  ];

  useEffect(() => {
    if (debouncedQuery) {
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      if (category && category !== 'All') {
        params.set('category', category);
      }
      if (sortBy !== 'relevance') {
        params.set('sort', sortBy);
      }
      setSearchParams(params);
    }
  }, [debouncedQuery, category, sortBy, setSearchParams]);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, category, sortBy]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const performSearch = () => {
    // Filter videos based on search query
    let filtered = videos.filter(video => {
      const matchesQuery = video.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                           video.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                           video.tags?.some(tag => tag.toLowerCase().includes(debouncedQuery.toLowerCase()));
      
      const matchesCategory = !category || category === 'All' || video.category === category;
      
      return matchesQuery && matchesCategory;
    });

    // Sort results
    switch (sortBy) {
      case 'date':
        filtered = filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        break;
      case 'views':
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'title':
        filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Relevance - keep original order or implement relevance scoring
        break;
    }

    setSearchResults(filtered);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory === 'All' ? '' : newCategory);
  };

  const clearSearch = () => {
    setQuery('');
    setCategory('');
    setSortBy('relevance');
    setSearchResults([]);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-dark-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-3 bg-dark-100 border border-dark-100 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={category || 'All'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            {sortBy === 'title' ? <SortAsc className="h-5 w-5 text-gray-400" /> : <SortDesc className="h-5 w-5 text-gray-400" />}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          {(query || category || sortBy !== 'relevance') && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search Results */}
      <div>
        {query ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">
                Search Results for "{query}"
              </h1>
              <p className="text-gray-400">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <VideoGrid videos={searchResults} />
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl text-gray-400 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">
                  Try different keywords or adjust your filters
                </p>
                <button
                  onClick={clearSearch}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl text-gray-400 mb-2">Search for videos</h3>
            <p className="text-gray-500">
              Enter keywords to find videos you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
