import React, { useState } from 'react';
import { Globe, Download, Search, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import useVideoStore from '../stores/videoStore';
import LoadingSpinner from '../components/LoadingSpinner';
import VideoGrid from '../components/VideoGrid';

const AggregationPage = () => {
  const { fetchAggregatedVideos, isLoading } = useVideoStore();
  const [url, setUrl] = useState('');
  const [aggregatedVideos, setAggregatedVideos] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supportedSites = [
    'Video sharing platforms',
    'Content aggregation sites',
    'Educational platforms',
    'News websites with video content'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      const videos = await fetchAggregatedVideos(url);
      setAggregatedVideos(videos);
      setSuccess(true);
      
      if (videos.length === 0) {
        setError('No videos found on this page. The site might not be supported or may not contain video content.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to aggregate videos from this URL');
    }
  };

  const clearResults = () => {
    setUrl('');
    setAggregatedVideos([]);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Aggregation</h1>
        <p className="text-gray-400 text-lg">
          Discover and import videos from external websites
        </p>
      </div>

      {/* Aggregation Form */}
      <div className="bg-dark-200 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Globe className="h-6 w-6 text-primary-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Import Videos</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
              Website URL
            </label>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/videos"
                  className="w-full bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Aggregate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && aggregatedVideos.length > 0 && (
            <div className="flex items-start space-x-3 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm">Found {aggregatedVideos.length} videos from the provided URL.</p>
              </div>
            </div>
          )}
        </form>

        {/* Clear Results */}
        {(aggregatedVideos.length > 0 || error) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearResults}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>

      {/* Supported Sites Info */}
      <div className="bg-dark-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Supported Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportedSites.map((site, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-300">{site}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-400">
              <p className="font-medium text-sm">Note</p>
              <p className="text-sm">
                Video aggregation respects website terms of service and only displays publicly available content.
                Some sites may block automated access or require special permissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated Videos Results */}
      {aggregatedVideos.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Aggregated Videos</h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">From: {new URL(url).hostname}</span>
            </div>
          </div>
          
          <VideoGrid 
            videos={aggregatedVideos} 
            emptyMessage="No videos found on this page"
          />
        </div>
      )}

      {/* Help Section */}
      <div className="bg-dark-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How it Works</h3>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong>1. Enter URL:</strong> Paste the URL of a website containing videos you'd like to discover.
          </p>
          <p>
            <strong>2. Scan Content:</strong> Our system analyzes the page structure to identify video content.
          </p>
          <p>
            <strong>3. Browse Results:</strong> View all discovered videos in an organized grid layout.
          </p>
          <p>
            <strong>4. External Links:</strong> Click on videos to view them on their original platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AggregationPage;
