import React from 'react';
import { Video } from '../../types'; // Adjust path as per your project structure
import VideoCard from '../VideoCard'; // Adjust path

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// import 'swiper/css/scrollbar'; // Optional

// import required modules from 'swiper/modules' for Swiper v7+
import { Navigation, Pagination, A11y } from 'swiper/modules'; 

interface FeaturedSliderProps {
  videos: Video[];
  title?: string;
  loading?: boolean; // To show skeleton loaders
}

const FeaturedSlider: React.FC<FeaturedSliderProps> = ({ videos, title, loading = false }) => {
  if (loading) {
    // Skeleton Loader for the slider
    return (
      <div className="w-full container mx-auto px-4 py-6">
        {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
        {/* Adjusted skeleton to better represent cards in a row */}
        <div className="grid grid-flow-col auto-cols-max sm:auto-cols-min gap-4 md:gap-6 overflow-x-hidden animate-pulse">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-dark-100 rounded-lg overflow-hidden shadow-lg w-60 sm:w-64 md:w-72"> {/* Fixed width for skeleton items */}
                <div className="h-32 sm:h-36 md:h-40 bg-gray-700"></div> {/* Aspect ratio for video thumbnail area */}
                <div className="p-3 sm:p-4">
                  <div className="h-5 bg-gray-600 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null; // Don't render anything if no videos and not loading
  }

  return (
    <div className="w-full container mx-auto px-4 py-6">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={20}
        slidesPerView={1.5} 
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2.5, spaceBetween: 20 },
          768: { slidesPerView: 3.2, spaceBetween: 25 }, // Slightly adjusted for better fit
          1024: { slidesPerView: 4.2, spaceBetween: 30 },// Slightly adjusted
          1280: { slidesPerView: 5, spaceBetween: 30 },
        }}
        className="mySwiper pb-10" // Added pb-10 for pagination dots if they overlap
      >
        {videos.map(video => (
          <SwiperSlide key={video.id} style={{ height: 'auto' }}> {/* Ensure slides accommodate card height */}
            <div className="h-full"> {/* Wrapper to ensure card stretches slide */}
              <VideoCard video={video} size="medium" /> {/* Use your existing VideoCard */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default FeaturedSlider;
