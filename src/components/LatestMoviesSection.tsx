"use client"

import { useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { preloadPriorityImages, preloadImage, getOptimizedImageUrl } from '../utils/image';

export const LatestMoviesSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['latestMovies'],
    queryFn: () => api.getLatestMovies(1),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Sử dụng useMemo để tránh tạo mảng mới mỗi lần render
  const movies = useMemo(() => data?.items || [], [data?.items]);

  // Fetch movie details for each movie
  const movieQueries = useQueries({
    queries: movies.map((movie) => ({
      queryKey: ['movie', movie.slug],
      queryFn: () => api.getMovieDetail(movie.slug),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })),
  });

  // Preload ảnh ưu tiên khi component được mount
  useEffect(() => {
    if (movies.length) {
      // Preload các ảnh ưu tiên (5 ảnh đầu tiên)
      const priorityUrls = movies.slice(0, 5)
        .map(movie => movie.poster_url)
        .filter(Boolean);
      
      preloadPriorityImages(priorityUrls);
      
      // Preload các ảnh còn lại với độ ưu tiên thấp hơn
      movies.slice(5).forEach((movie, index) => {
        // Trì hoãn preload để không ảnh hưởng đến các ảnh quan trọng
        setTimeout(() => {
          if (movie.poster_url) {
            preloadImage(movie.poster_url, 'small');
          }
        }, index * 200); // Mỗi ảnh cách nhau 200ms
      });
    }
  }, [movies]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -scrollRef.current.offsetWidth : scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-400">
              Phim Mới Cập Nhật
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !movies.length) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-400">
              Phim Mới Cập Nhật
            </h2>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-10 text-center">
          <p className="text-gray-400">Đang tải dữ liệu phim. Vui lòng thử lại sau.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Tải lại trang
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/danh-sach/phim-moi-cap-nhat" 
          className="flex items-center gap-2 group"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-400 group-hover:text-yellow-400 transition">
            Phim Mới Cập Nhật
          </h2>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 group-hover:text-yellow-400" />
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleScroll('left')}
            className="p-1.5 sm:p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button 
            onClick={() => handleScroll('right')}
            className="p-1.5 sm:p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[140px] sm:auto-cols-[160px] md:auto-cols-[180px] lg:auto-cols-[200px] gap-4 md:gap-6 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {movies.map((movie, index) => {
          const movieDetail = movieQueries[index]?.data?.movie;
          
          return (
            <Link
              key={movie._id}
              href={`/phim/${movie.slug}`}
              className="group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900">
                <img 
                  src={index < 5 ? getOptimizedImageUrl(movie.poster_url, 'medium') : getOptimizedImageUrl(movie.poster_url, 'small')} 
                  alt={movie.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300 movie-poster"
                  loading={index < 5 ? "eager" : "lazy"}
                  {...(index < 5 ? { 'data-priority': 'high' } : {})}
                  onLoad={(e) => e.currentTarget.classList.add('loaded')}
                />
                {/* Episode badge - left side */}
                {movieDetail?.episode_current && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-pink-500 text-white text-xs md:text-sm rounded w-fit">
                      {movieDetail.type === 'series' ? movieDetail.episode_current : 'Full'}
                    </span>
                  </div>
                )}
                {/* Quality badge - right side */}
                {movieDetail?.quality && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-yellow-500 text-black text-xs md:text-sm font-medium rounded w-fit">
                      {movieDetail.quality}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-white text-sm md:text-base font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
                {movie.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
};