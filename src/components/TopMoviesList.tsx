"use client"

import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getImageUrl, switchToBackupDomain, DEFAULT_PLACEHOLDER, preloadImage, preloadPriorityImages } from "../utils/image";
import { handleImageError } from "../utils/errorHandlers";

type Movie = {
  _id: string;
  name: string;
  quality: string;
  thumb_url?: string;
  poster_url?: string;
  slug: string;
  episode_current?: string;
};

interface Props {
  movies: Movie[];
}

export const TopMoviesList: React.FC<Props> = ({ movies }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleMoviesCount = 10;

  const scrollToLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollLeft -= scrollRef.current.offsetWidth;
  };
  
  const scrollToRight = () => {
    if (scrollRef.current) scrollRef.current.scrollLeft += scrollRef.current.offsetWidth;
  };

  // Tải trước tất cả ảnh khi component được mount
  useEffect(() => {
    // Preload ảnh ưu tiên (3 ảnh đầu tiên)
    const priorityUrls = movies
      .slice(0, 5)
      .map(movie => movie.thumb_url)
      .filter((url): url is string => url !== undefined);
    preloadPriorityImages(priorityUrls);
    
    // Preload các ảnh còn lại
    movies.slice(3, visibleMoviesCount).forEach(movie => {
      if (movie.thumb_url) {
        preloadImage(movie.thumb_url, 'small');
      }
      if (movie.poster_url) {
        preloadImage(movie.poster_url, 'small');
      }
    });

    // Thiết lập theo dõi hiển thị
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    // Lưu tham chiếu để tránh vấn đề cleanup
    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      observer.observe(currentScrollRef);
    }

    return () => observer.disconnect();
  }, [movies, visibleMoviesCount]);

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/danh-sach/phim-le" className="flex items-center gap-2 group relative">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-red-400 group-hover:text-yellow-400 transition">
            Phim Lẻ Mới
          </h2>
          <div className="relative">
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-red-400 group-hover:opacity-0 transition" />
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 whitespace-nowrap text-yellow-400 text-sm md:text-base font-medium transition">
              Xem thêm
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={scrollToLeft} className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button onClick={scrollToRight} className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition">
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[180px] sm:auto-cols-[220px] md:auto-cols-[280px] lg:auto-cols-[300px] gap-4 md:gap-6 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {movies.slice(0, visibleMoviesCount).map((movie, index) => (
          <Link
            to={`/phim/${movie.slug}`}
            key={movie._id}
            className="group"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
              <img 
                src={getImageUrl(movie.thumb_url || DEFAULT_PLACEHOLDER)} 
                alt={movie.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                loading={index < 5 ? "eager" : "lazy"}
                data-poster={movie.poster_url}
                {...(index < 3 ? { 'data-priority': 'high' } : {})}
                onError={(e) => {
                  handleImageError(e, movie.poster_url ? getImageUrl(movie.poster_url) : DEFAULT_PLACEHOLDER);
                  // Nếu nhiều ảnh lỗi, chuyển domain
                  switchToBackupDomain();
                }}
              />
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                {movie.episode_current && (
                  <span className="px-2 py-1 bg-pink-500 text-white text-xs md:text-sm rounded">
                    {movie.episode_current}
                  </span>
                )}
                {movie.quality && (
                  <span className="px-2 py-1 bg-yellow-500 text-black text-xs md:text-sm font-medium rounded">
                    {movie.quality}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3 space-y-1">
              <h3 className="text-white text-sm md:text-base font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
                {movie.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};