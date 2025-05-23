import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Eye, 
  Clock, 
  ThumbsUp,
  Star,
  TrendingUp
} from 'lucide-react';
import { Video } from '../types';
import { formatViews, formatTimeAgo } from '../utils/formatters';

interface FeaturedSliderProps {
  videos: Video[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const FeaturedSlider: React.FC<FeaturedSliderProps> = ({
  videos,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === videos.length - 1 ? 0 : prevIndex + 1
    );
  }, [videos.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? videos.length - 1 : prevIndex - 1
    );
  }, [videos.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || videos.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide, autoPlayInterval, videos.length]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevSlide, nextSlide, isPlaying]);

  if (!videos.length) {
    return (
      <div className={`relative h-96 bg-dark-200 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No featured videos available</p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div 
      className={`relative w-full h-96 md:h-[500px] overflow-hidden rounded-xl bg-dark-200 group ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(autoPlay)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Featured Video Background */}
      <div className="absolute inset-0">
        {currentVideo.thumbnail ? (
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <Play className="h-24 w-24 text-white opacity-60" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="p-6 md:p-8 w-full max-w-4xl">
          {/* Featured Badge */}
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
              Featured
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 line-clamp-2 leading-tight">
            {currentVideo.title}
          </h2>

          {/* Description */}
          {currentVideo.description && (
            <p className="text-gray-200 text-sm md:text-base mb-4 line-clamp-2 max-w-2xl">
              {currentVideo.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center space-x-4 md:space-x-6 text-gray-300 text-sm mb-6">
            <span className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{formatViews(currentVideo.views)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{currentVideo.likes}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimeAgo(currentVideo.uploadDate)}</span>
            </span>
            <span>by {currentVideo.user.username}</span>
          </div>

          {/* Action Button */}
          <Link
            to={`/video/${currentVideo.id}`}
            className="inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Play className="h-5 w-5" />
            <span>Watch Now</span>
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && videos.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
            aria-label="Next video"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && videos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && isPlaying && videos.length > 1 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
          <div
            className="h-full bg-primary-500 transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Video Count Indicator */}
      {videos.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      )}

      {/* Play/Pause Indicator */}
      {videos.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? (
            <div className="w-4 h-4 flex space-x-1">
              <div className="w-1 h-4 bg-white rounded" />
              <div className="w-1 h-4 bg-white rounded" />
            </div>
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default FeaturedSlider;
