"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axios from 'axios';
import { MdChevronRight, MdPlayArrow } from 'react-icons/md';
import { Movie } from '../types/movie';

interface MovieDetail {
  movie: Movie;
}

export const AnimeSection: React.FC = () => {
  const [activeMovie, setActiveMovie] = useState<number>(0);
  const [movieDetails, setMovieDetails] = useState<Record<string, MovieDetail>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent | TouchEvent) => {
    isDraggingRef.current = true;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grabbing';
      startXRef.current = 'touches' in e ? e.touches[0].pageX : e.pageX;
      scrollLeftRef.current = scrollRef.current.scrollLeft;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    if (scrollRef.current) {
      const x = 'touches' in e ? e.touches[0].pageX : e.pageX;
      const walk = (x - startXRef.current) * 2;
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  }, []);

  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    slider.style.cursor = 'grab';

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mousemove', handleMouseMove);

    slider.addEventListener('touchstart', handleMouseDown);
    slider.addEventListener('touchend', handleMouseUp);
    slider.addEventListener('touchmove', handleMouseMove);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);

      slider.removeEventListener('touchstart', handleMouseDown);
      slider.removeEventListener('touchend', handleMouseUp);
      slider.removeEventListener('touchmove', handleMouseMove);
    };
  }, [handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove]);

  const { data } = useQuery({
    queryKey: ['animeList'],
    queryFn: async () => {
      const response = await axios.get('https://phimapi.com/v1/api/danh-sach/hoat-hinh', {
        params: {
          page: 1,
          sort_field: 'modified.time',
          sort_type: 'desc',
          limit: 12
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const movies = data?.data?.items || [];
  const mainMovie = movies[activeMovie];
  const otherMovies = movies.slice(0, 12);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      if (mainMovie?.slug && !movieDetails[mainMovie.slug]) {
        try {
          const response = await axios.get(`https://phimapi.com/phim/${mainMovie.slug}`);
          setMovieDetails(prev => ({
            ...prev,
            [mainMovie.slug]: response.data
          }));
        } catch (error) {
          console.error('Lỗi khi tải thông tin phim:', error);
        }
      }
    };

    fetchMovieDetail();
  }, [mainMovie?.slug, movieDetails]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMovie(current => (current + 1) % (movies.length || 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies.length) return null;

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('/') ? `https://phimimg.com${url}` : `https://phimimg.com/${url}`;
  };

  const currentMovieDetail = movieDetails[mainMovie?.slug]?.movie;

  return (
    <section className="px-4 py-4 sm:py-6 md:py-8">
      <Link href="/danh-sach/hoat-hinh" className="inline-flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6 group relative">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-yellow-400 transition">
          Hôm nay xem Hoạt Hình gì?
        </h2>
        <div className="relative">
          <MdChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:opacity-0 transition" />
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 whitespace-nowrap text-yellow-400 text-xs sm:text-sm md:text-base font-medium transition">
            Xem thêm
          </span>
        </div>
      </Link>

      <div className="relative">
        <div className="rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[450px]">
          <div className="absolute inset-0">
            <img 
              src={getImageUrl(mainMovie.thumb_url)} 
              alt={mainMovie.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-0 p-3 sm:p-4 md:p-6 w-full md:w-2/3">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 text-white line-clamp-1 sm:line-clamp-2">
              {mainMovie.name}
            </h3>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {mainMovie.episode_current && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-pink-500 text-white text-xs sm:text-sm rounded-full">
                  Tập {mainMovie.episode_current.replace('Tập ', '')}
                </span>
              )}
              {mainMovie.quality && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-yellow-500 text-black text-xs sm:text-sm font-medium rounded-full">
                  {mainMovie.quality}
                </span>
              )}
              {mainMovie.lang && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/20 text-white text-xs sm:text-sm rounded-full">
                  {mainMovie.lang}
                </span>
              )}
            </div>

            <p className="text-white/80 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-2 md:line-clamp-3">
              {currentMovieDetail?.content || mainMovie.content}
            </p>

            <Link 
              href={`/phim/${mainMovie.slug}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full transition-colors"
            >
              <MdPlayArrow className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="text-xs sm:text-sm md:text-base">Xem phim</span>
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-3 sm:-bottom-4 md:-bottom-5 left-0 right-0 flex justify-center">
          <div 
            ref={scrollRef}
            className="flex gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto pb-2 px-2 max-w-full [&::-webkit-scrollbar]:hidden scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {otherMovies.map((movie: Movie, index: number) => (
              <button
                key={movie._id}
                onClick={() => setActiveMovie(index)}
                className={`relative w-[36px] sm:w-[45px] md:w-[55px] flex-shrink-0 aspect-[3/4] rounded-md overflow-hidden border-2 transition-all ${
                  index === activeMovie ? 'border-yellow-400 scale-110 z-10' : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={getImageUrl(movie.poster_url)}
                  alt={movie.name}
                  className="w-full h-full object-cover"
                  loading={index < 6 ? "eager" : "lazy"}
                />
                <div className={`absolute inset-0 bg-black/50 transition-opacity ${
                  index === activeMovie ? 'opacity-0' : 'opacity-40'
                }`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};