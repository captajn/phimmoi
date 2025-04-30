"use client"

import { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';

interface Movie {
  _id: string;
  name: string;
  slug: string;
  poster_url?: string;
  episode_current?: string;
  quality?: string;
}

export const VietnameseMoviesSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['vietnameseMovies'],
    queryFn: () => api.getVietnameseMovies(1, 12),
    staleTime: 5 * 60 * 1000,
  });

  const movies = data?.data?.items || [];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -scrollRef.current.offsetWidth : scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('/') ? `https://phimimg.com${url}` : `https://phimimg.com/${url}`;
  };

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/quoc-gia/viet-nam" className="flex items-center gap-2 group">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-red-500 group-hover:text-yellow-400 transition">
            Phim Việt Nam
          </h2>
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-red-500 group-hover:text-yellow-400" />
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={() => handleScroll('left')}
            className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button 
            onClick={() => handleScroll('right')}
            className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[140px] sm:auto-cols-[160px] md:auto-cols-[180px] lg:auto-cols-[200px] gap-4 md:gap-6 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {movies.map((movie: Movie) => (
          <Link
            key={movie._id}
            href={`/phim/${movie.slug}`}
            className="group"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900">
              <img 
                src={getImageUrl(movie.poster_url)} 
                alt={movie.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 w-full p-3">
                  <div className="flex flex-wrap gap-1">
                    {movie.episode_current && (
                      <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded">
                        {movie.episode_current}
                      </span>
                    )}
                    {movie.quality && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded">
                        {movie.quality}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-2 text-white text-sm md:text-base font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
              {movie.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
};