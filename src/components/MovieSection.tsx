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
    if (scrollRef.current) scrollRef.current.scrollLeft -= scrollRef.current.offsetWidth;
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollLeft += scrollRef.current.offsetWidth;
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
        </div>
        <div className="grid grid-flow-col auto-cols-[180px] sm:auto-cols-[220px] md:auto-cols-[280px] lg:auto-cols-[300px] gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-800 rounded-lg" />
              <div className="mt-3 h-4 bg-gray-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!movies.length) return null;

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/quoc-gia/${apiSlug}`}
          className="flex items-center gap-2 group"
        >
          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${colorClass} group-hover:text-yellow-400 transition`}>
            {title}
          </h2>
          <ChevronRight className={`w-5 h-5 md:w-6 md:h-6 ${colorClass} group-hover:text-yellow-400`} />
        </Link>

        {isClient && (
          <div className="hidden md:flex items-center gap-2">
            <button onClick={scrollLeft} className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition">
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button onClick={scrollRight} className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[180px] sm:auto-cols-[220px] md:auto-cols-[280px] lg:auto-cols-[300px] gap-4 md:gap-6 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
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
              {isClient && (
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
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="mt-3 text-white text-sm md:text-base font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
              {movie.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
};