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
    <section className="container mx-auto px-4 py-6">
      <Link href="/danh-sach/hoat-hinh" className="inline-flex items-center gap-2 mb-4 group relative">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white group-hover:text-yellow-400 transition">
          Hôm nay xem Hoạt Hình gì?
        </h2>
        <div className="relative">
          <MdChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:opacity-0 transition" />
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 whitespace-nowrap text-yellow-400 text-sm md:text-base font-medium transition">
            Xem thêm
          </span>
        </div>
      </Link>

      <div className="relative">
        <div className="rounded-xl overflow-hidden relative h-[400px] md:h-[500px] lg:h-[600px]">
          <div className="absolute inset-0">
            <img 
              src={getImageUrl(mainMovie.thumb_url)} 
              alt={mainMovie.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          <div className="absolute bottom-12 left-0 p-6 md:p-8 w-full md:w-2/3">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-white">
              {mainMovie.name}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {mainMovie.episode_current && (
                <span className="px-3 py-1 bg-pink-500 text-white text-sm md:text-base rounded-full">
                  Tập {mainMovie.episode_current.replace('Tập ', '')}
                </span>
              )}
              {mainMovie.quality && (
                <span className="px-3 py-1 bg-yellow-500 text-black text-sm md:text-base font-medium rounded-full">
                  {mainMovie.quality}
                </span>
              )}
              {mainMovie.lang && (
                <span className="px-3 py-1 bg-white/20 text-white text-sm md:text-base rounded-full">
                  {mainMovie.lang}
                </span>
              )}
            </div>

            <p className="text-white/80 text-sm md:text-base mb-4 line-clamp-3">
              {currentMovieDetail?.content || mainMovie.content}
            </p>

            <Link 
              href={`/phim/${mainMovie.slug}`}
              className="inline-flex items-center gap-2 px-6 py-2 md:px-8 md:py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full transition-colors"
            >
              <MdPlayArrow className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-base">Xem phim</span>
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <div 
            ref={scrollRef}
            className="flex gap-2 md:gap-3 overflow-x-auto pb-2 px-4 max-w-full [&::-webkit-scrollbar]:hidden"
          >
            {otherMovies.map((movie: Movie, index: number) => (
              <button
                key={movie._id}
                onClick={() => setActiveMovie(index)}
                className={`relative w-[50px] md:w-[60px] lg:w-[70px] flex-shrink-0 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                  index === activeMovie ? 'border-yellow-400 scale-110 z-10' : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={getImageUrl(movie.poster_url)}
                  alt={movie.name}
                  className="w-full h-full object-cover"
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