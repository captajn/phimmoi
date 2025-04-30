"use client"

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../services/api';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getOptimizedImageUrl, switchToBackupDomain, preloadImage, preloadPriorityImages, DEFAULT_PLACEHOLDER } from '../utils/image';
import { handleImageError } from '../utils/errorHandlers';

interface MovieItem {
  _id: string;
  name: string;
  thumb_url: string;
  poster_url?: string;
  slug: string;
  quality?: string;
  episode_current?: string;
}

interface MovieSectionProps {
  title: string;
  apiSlug: string;
  colorClass?: string;
}

export const MovieSection: React.FC<MovieSectionProps> = ({ title, apiSlug, colorClass = 'text-white' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollLeft -= scrollRef.current.offsetWidth * 0.75;
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollLeft += scrollRef.current.offsetWidth * 0.75;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['moviesByCountry', apiSlug],
    queryFn: () =>
      api.getMoviesByCountry(apiSlug, 1, {
        limit: '12',
        sort_field: 'modified.time',
        sort_type: 'desc'
      }),
    staleTime: 5 * 60 * 1000,
  });

  const movies = useMemo(() => {
    return data?.items || data?.data?.items || [];
  }, [data]);

  useEffect(() => {
    if (!isClient || !movies.length) return;

    const priorityUrls = movies.slice(0, 3).map((movie: MovieItem) => movie.thumb_url);
    preloadPriorityImages(priorityUrls);
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          movies.slice(3).forEach((movie: MovieItem, index: number) => {
            setTimeout(() => {
              preloadImage(movie.thumb_url);
            }, index * 150);
          });
          observer.disconnect();
        }
      }, { rootMargin: '200px' });
      
      if (scrollRef.current) {
        observer.observe(scrollRef.current);
      }
      
      return () => observer.disconnect();
    }
  }, [movies, isClient]);

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-800 w-48 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[200px] md:auto-cols-[240px] lg:auto-cols-[280px] gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-800 rounded-lg" />
              <div className="mt-2 h-4 bg-gray-800 rounded w-3/4" />
              <div className="mt-1 h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!movies.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/quoc-gia/${apiSlug}`}
          className="flex items-center gap-1.5 sm:gap-2 group"
        >
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${colorClass} group-hover:text-yellow-400 transition`}>
            {title}
          </h2>
          <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${colorClass} group-hover:text-yellow-400`} />
        </Link>

        <div className="flex items-center gap-2" style={{ opacity: isClient ? 1 : 0 }}>
          <button 
            onClick={scrollLeft} 
            className="p-2 sm:p-2.5 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            aria-label="Scroll left"
            disabled={!isClient}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button 
            onClick={scrollRight} 
            className="p-2 sm:p-2.5 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            aria-label="Scroll right"
            disabled={!isClient}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[200px] md:auto-cols-[240px] lg:auto-cols-[280px] gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden pb-2"
      >
        {movies.map((movie: MovieItem, index: number) => (
          <Link
            key={movie._id}
            href={`/phim/${movie.slug}`}
            className="group"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
              <img 
                src={getOptimizedImageUrl(movie.thumb_url, index < 3 ? 'medium' : 'small')} 
                alt={movie.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                loading={index < 3 ? "eager" : "lazy"}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_PLACEHOLDER;
                  target.onerror = null;
                }}
              />
              <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex justify-between items-start">
                {movie.episode_current && (
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-pink-500 text-white text-[10px] sm:text-xs md:text-sm rounded">
                    {movie.episode_current}
                  </span>
                )}
                {movie.quality && (
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-500 text-black text-[10px] sm:text-xs md:text-sm font-medium rounded">
                    {movie.quality}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="mt-2 text-white text-xs sm:text-sm md:text-base font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
              {movie.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
};