"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { getImageUrl, DEFAULT_PLACEHOLDER } from '../utils/image';

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  slug: string;
  category: string[];
  country: string[];
  status: string;
  quality: string;
  episode_current: string;
  episode_total: string;
}

interface ApiMovie {
  _id: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  slug: string;
  category: ApiCategory[];
  country: ApiCategory[];
  quality: string;
  episode_current: string;
  episode_total?: string;
  modified?: {
    time: string;
  };
  type?: string;
}

interface ApiPagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

interface PhimBoSectionProps {
  title?: string;
  typeList?: string;
  sortField?: string;
  sortType?: string;
  sortLang?: string;
  category?: string;
  country?: string;
  year?: number;
  limit?: number;
}

export const PhimBoSection: React.FC<PhimBoSectionProps> = ({
  title = "Phim Bộ Mới",
  typeList = "phim-bo",
  sortField = "modified.time",
  sortType = "desc",
  sortLang = "",
  category = "",
  country = "",
  year,
  limit = 12
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['phimList', typeList, sortField, sortType, sortLang, category, country, year, limit],
    queryFn: async () => {
      try {
        const response = await api.getMoviesByType(typeList, 1, {
          sort_field: sortField,
          sort_type: sortType,
          sort_lang: sortLang,
          category,
          country,
          year: year?.toString(),
          limit: limit.toString()
        });
        
        return {
          items: response.data.items.map((movie: ApiMovie) => ({
            _id: movie._id || '',
            name: movie.name || '',
            origin_name: movie.origin_name || '',
            thumb_url: movie.thumb_url || '',
            poster_url: movie.poster_url || '',
            year: movie.year || 0,
            slug: movie.slug || '',
            category: movie.category?.map((c: ApiCategory) => c.name) || [],
            country: movie.country?.map((c: ApiCategory) => c.name) || [],
            status: '',
            quality: movie.quality || '',
            episode_current: movie.episode_current || '',
            episode_total: movie.episode_total || ''
          })),
          pagination: response.data.pagination || {}
        };
      } catch (err) {
        console.error(`Lỗi khi xử lý API ${typeList}:`, err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const { data: movieDetail } = useQuery({
    queryKey: ['movieDetail', data?.items?.[currentIndex]?.slug],
    queryFn: () => api.getMovieDetail(data?.items?.[currentIndex]?.slug),
    enabled: !!data?.items?.[currentIndex]?.slug,
    staleTime: 5 * 60 * 1000,
  });

  const movies = data?.items || [];
  const movie = movies[currentIndex];
  const detail = movieDetail?.movie;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 bg-gray-800 w-48 rounded animate-pulse" />
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
        </div>
        <div className="min-h-[400px] rounded-3xl overflow-hidden bg-gray-800 animate-pulse" />
      </section>
    );
  }

  if (error || !movies.length) {
    return (
      <section className="container mx-auto px-4 py-6">
        <Link href={`/danh-sach/${typeList}`} className="flex items-center gap-2 mb-6 group">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400 group-hover:text-yellow-400 transition">
            {title}
          </h2>
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-purple-400 group-hover:text-yellow-400" />
        </Link>
        <div className="min-h-[250px] sm:min-h-[300px] md:min-h-[400px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center">
          <p className="text-gray-400">Không tìm thấy dữ liệu phim</p>
        </div>
      </section>
    );
  }

  if (!movie) return null;

  const firstServer = detail?.episodes?.[0];
  const serverType = firstServer?.server_name.toLowerCase().includes('vietsub') ? 'vietsub' : 'thuyet-minh';
  const firstEpisode = firstServer?.server_data?.[0]?.slug;
  const currentEpisode = detail?.episode_current?.replace('Tập ', '') || '0';
  const totalEpisodes = detail?.episode_total || '0';
  const status = `${currentEpisode}/${totalEpisodes} tập`;

  return (
    <section className="container mx-auto px-4 py-6">
      <Link href={`/danh-sach/${typeList}`} className="flex items-center gap-2 mb-6 group">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400 group-hover:text-yellow-400 transition">
          {title}
        </h2>
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-purple-400 group-hover:text-yellow-400" />
      </Link>

      <div className="relative min-h-[300px] sm:min-h-[350px] md:min-h-[400px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden bg-gray-900">
        {/* Nút điều hướng */}
        <div className="absolute top-1/2 left-2 right-2 sm:left-4 sm:right-4 -translate-y-1/2 z-10 flex justify-between pointer-events-none" style={{ opacity: isClient ? 1 : 0 }}>
          <button
            onClick={handlePrevious}
            className="p-1.5 sm:p-2 md:p-3 lg:p-4 rounded-full bg-black/60 hover:bg-black/70 text-white backdrop-blur-sm transition pointer-events-auto"
            disabled={!isClient}
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 sm:p-2 md:p-3 lg:p-4 rounded-full bg-black/60 hover:bg-black/70 text-white backdrop-blur-sm transition pointer-events-auto"
            disabled={!isClient}
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="absolute inset-0">
          <img 
            src={getImageUrl(movie.thumb_url || movie.poster_url)} 
            alt={movie.name}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_PLACEHOLDER;
              target.onerror = null;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-3xl">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1.5 sm:mb-2 md:mb-3 text-white line-clamp-2">
              {movie.name}
            </h3>
            <p className="text-white/80 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-5 line-clamp-2 sm:line-clamp-3">
              {detail?.content}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <Link 
                href={`/phim/${movie.slug}`}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 font-medium transition flex items-center justify-center gap-1.5 text-xs sm:text-sm md:text-base"
              >
                Chi Tiết
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>

              <div className="flex-1 bg-white/10 rounded-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-white font-medium text-center text-xs sm:text-sm md:text-base">
                {status}
              </div>

              <Link 
                href={firstEpisode ? `/xem/${movie.slug}/${serverType}/${firstEpisode}` : `/phim/${movie.slug}`}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 font-semibold transition flex items-center justify-center gap-1.5 text-xs sm:text-sm md:text-base"
              >
                Xem Phim
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-3 sm:mt-4" style={{ opacity: isClient && movies.length > 1 ? 1 : 0 }}>
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 sm:gap-2">
            {movies.map((m: Movie, idx: number) => (
              <div
                key={m.slug || idx}
                className={`shrink-0 cursor-pointer transition ${
                  currentIndex === idx
                    ? 'border-2 border-yellow-500 scale-110 z-10'
                    : 'border border-transparent hover:border-white/50'
                }`}
                onClick={() => isClient ? setCurrentIndex(idx) : null}
              >
                <img 
                  src={getImageUrl(m.thumb_url || m.poster_url)} 
                  alt={m.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_PLACEHOLDER;
                    target.onerror = null;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};