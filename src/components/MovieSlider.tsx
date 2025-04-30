'use client'

import React, { useEffect, useState, useRef, memo, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Swiper as SwiperType } from 'swiper';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/effect-fade';

import { getOptimizedImageUrl, getImagePlaceholder } from '../utils/image';
import { api } from '../services/api';
import type { Movie } from '../types/movie';

interface MovieDetail {
  name: string;
  content: string;
  year: number;
  slug: string;
  lang: string;
  quality: string;
  episode_current: string;
  category: { name: string }[];
  imdb: string | { rating: string };
  time: string;
  status: string;
  origin_name?: string;
}

interface MovieSliderProps {
  movies: Movie[];
}

export const MovieSlider = memo(({ movies }: MovieSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const swiperRef = useRef<SwiperType>();

  const visibleMovies = useMemo(() => 
    movies && movies.length > 0 ? movies.slice(0, 6) : []
  , [movies]);

  const movieQueries = useQuery({
    queryKey: ['sliderMovieDetails', visibleMovies.map(m => m.slug)],
    queryFn: async () => {
      console.log('[MovieSlider] Fetching movie details');
      if (visibleMovies.length === 0) return {};

      const startTime = performance.now();
      const slugs = visibleMovies.map((m) => m.slug);
      const cacheKey = 'slider_movie_details';
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            console.log('[MovieSlider] Sử dụng cache cho chi tiết phim');
            return parsed.data;
          }
        }
      } catch (e) {
        console.warn('[MovieSlider] Lỗi đọc cache:', e);
      }

      const prioritySlug = slugs[activeIndex];
      const otherSlugs = slugs.filter(s => s !== prioritySlug);
      const allSlugs = [prioritySlug, ...otherSlugs].filter(Boolean);
      const detailMap: Record<string, MovieDetail> = {};

      const timeoutPromise = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        let timeoutId: NodeJS.Timeout;
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Timeout after ${ms}ms`));
            }, ms);
          })
        ]).finally(() => {
          clearTimeout(timeoutId);
        });
      };

      if (prioritySlug) {
        try {
          const firstResult = await timeoutPromise(api.getMovieDetail(prioritySlug), 5000)
            .catch(error => {
              console.warn(`[MovieSlider] Không thể tải thông tin phim ${prioritySlug}:`, error);
              return null;
            });
          if (firstResult?.movie) {
            detailMap[prioritySlug] = firstResult.movie;
            setIsLoaded(true);
          }
        } catch (error) {
          console.warn('[MovieSlider] Lỗi tải phim đầu tiên:', error);
        }
      }

      const remainingSlugs = allSlugs.filter(slug => !detailMap[slug]);
      if (remainingSlugs.length > 0) {
        const batchSize = 2;
        for (let i = 0; i < remainingSlugs.length; i += batchSize) {
          const batch = remainingSlugs.slice(i, i + batchSize);
          const promises = batch.map(slug =>
            timeoutPromise(api.getMovieDetail(slug), 8000)
              .catch(error => {
                console.warn(`[MovieSlider] Không thể tải thông tin phim ${slug}:`, error);
                return null;
              })
          );
          try {
            const results = await Promise.all(promises);
            results.forEach((result, index) => {
              if (result?.movie) {
                const slug = batch[index];
                detailMap[slug] = result.movie;
              }
            });
          } catch (error) {
            console.warn(`[MovieSlider] Lỗi tải batch ${i}:`, error);
          }
          if (i + batchSize < remainingSlugs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: detailMap
        }));
      } catch (e) {
        console.warn('[MovieSlider] Lỗi lưu cache:', e);
      }

      const endTime = performance.now();
      console.log(`[MovieSlider] Chi tiết phim tải xong sau ${Math.round(endTime - startTime)}ms`);
      return detailMap;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 2000,
    enabled: visibleMovies.length > 0
  });

  const details = useMemo(() => movieQueries.data || {}, [movieQueries.data]);

  useEffect(() => {
    if (Object.keys(details).length > 0) {
      console.log('[MovieSlider] Prefetching images for movie details');
      if (visibleMovies[activeIndex] && details[visibleMovies[activeIndex].slug]) {
        const currentSlide = visibleMovies[activeIndex];
        const imgUrl = getOptimizedImageUrl(currentSlide.poster_url || currentSlide.thumb_url, 'large');
        const img = new window.Image();
        img.src = imgUrl;
      }
    }
  }, [details, activeIndex, visibleMovies]);

  useEffect(() => {
    if (visibleMovies.length > 0) {
      setIsLoaded(true);
    }
  }, [visibleMovies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setIsLoaded(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getImdbRating = useCallback((imdb: string | { rating: string }) => {
    if (typeof imdb === 'string') return imdb;
    return imdb?.rating || '';
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  const handleSlideClick = useCallback((index: number) => {
    setActiveIndex(index);
    swiperRef.current?.slideTo(index);
  }, []);

  if (!isMounted || visibleMovies.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <style jsx global>{`
        .shadow-text {
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
        }
        .movie-title {
          text-shadow: 0 4px 8px rgba(0,0,0,1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .slider-overlay {
          background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%);
        }
        .slider-side-overlay {
          background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0) 75%);
        }
        @media (min-width: 1024px) {
          .slider-overlay {
            background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%);
          }
          .slider-side-overlay {
            background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0) 85%);
          }
        }
        .category-item {
          display: inline-block;
        }
        @media (max-width: 767px) {
          .category-item:nth-child(n+4) {
            display: none;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .category-item:nth-child(n+5) {
            display: none;
          }
        }
        .thumbnail-container {
          position: absolute;
          z-index: 10;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          padding: 0.375rem 0.5rem;
          border-radius: 9999px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          left: 50%;
          transform: translateX(-50%);
        }
        @media (max-width: 640px) {
          .thumbnail-container {
            bottom: 35%;
          }
        }
        @media (min-width: 641px) and (max-width: 768px) {
          .thumbnail-container {
            bottom: 32%;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .thumbnail-container {
            bottom: 30%;
          }
        }
        @media (min-width: 1025px) and (max-width: 1280px) {
          .thumbnail-container {
            bottom: 28%;
          }
        }
        @media (min-width: 1281px) {
          .thumbnail-container {
            bottom: 28%;
          }
        }
      `}</style>
      <Swiper
        modules={[Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={handleSlideChange}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        className="w-full h-[50vh] sm:h-[60vh] md:h-[65vh] lg:h-[80vh] xl:h-[90vh]"
        fadeEffect={{ crossFade: true }}
      >
        {visibleMovies.map((movie, idx) => {
          const info = details[movie.slug];
          return (
            <SwiperSlide key={movie._id}>
              <div className="relative h-full w-full">
                <div className="absolute inset-0">
                  <Image
                    src={getOptimizedImageUrl(movie.thumb_url, 'large')}
                    alt={movie.name}
                    className="object-cover"
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    quality={idx === 0 ? 100 : 75}
                    placeholder="blur"
                    blurDataURL={getImagePlaceholder('backdrop')}
                  />
                </div>
                <div className="absolute inset-0 slider-overlay z-[1]" />
                <div className="absolute inset-0 slider-side-overlay z-[1]" />
                <div className="absolute bottom-0 left-0 w-full z-[5]">
                  <div className="container mx-auto px-4 pb-10 sm:pb-14 md:pb-16 lg:pb-20 xl:pb-24">
                    <div className="max-w-3xl text-white">
                      <div className="w-full overflow-hidden">
                        <h1 className="font-bold mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white movie-title">
                          {info?.name || movie.name}
                        </h1>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-3 text-[10px] sm:text-xs md:text-sm">
                        {info && getImdbRating(info.imdb) !== '' && (
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-yellow-500 rounded text-black font-bold">
                            IMDb {getImdbRating(info.imdb)}
                          </span>
                        )}
                        {(info?.time || movie.time) && (
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                            {info?.time || movie.time}
                          </span>
                        )}
                        {(info?.quality || movie.quality) && (
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                            {info?.quality || movie.quality || 'HD'}
                          </span>
                        )}
                        {(info?.episode_current || movie.episode_current) && (
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-red-500/90 backdrop-blur-sm rounded font-medium text-white">
                            {info?.episode_current || movie.episode_current}
                          </span>
                        )}
                        <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                          {info?.lang || movie.lang || 'Vietsub'}
                        </span>
                        <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                          {info?.year || movie.year || '2025'}
                        </span>
                      </div>
                      {info && info.category && info.category.length > 0 ? (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 text-white text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3">
                          {info.category.map((cat: { name: string }, i: number) => (
                            <span key={i} className="category-item px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">{cat.name}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 text-white text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3">
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">Phim Hay</span>
                          <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">Mới Cập Nhật</span>
                        </div>
                      )}
                      <p className="text-white text-[10px] xs:text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-2 md:line-clamp-3 mb-2 sm:mb-3 md:mb-4 shadow-text font-medium">
                        {info?.content || movie.content || "Đang tải thông tin phim..."}
                      </p>
                      <Link href={`/phim/${movie.slug}`}>
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm md:text-base transition-all shadow-lg">
                          <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          <span className="font-bold">Xem Phim</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <div className="thumbnail-container">
        {visibleMovies.map((movie, i) => (
          <button
            key={movie._id}
            className={`group relative w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-2 ${
              activeIndex === i ? 'border-yellow-500 scale-110 z-10' : 'border-transparent'
            } rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:border-white hover:scale-105 focus:outline-none`}
            onClick={() => handleSlideClick(i)}
          >
            <div className="relative w-full h-full">
              <Image 
                src={getOptimizedImageUrl(movie.thumb_url, 'small')} 
                alt={movie.name} 
                className="object-cover"
                fill
                sizes="(max-width: 640px) 20px, (max-width: 768px) 32px, (max-width: 1024px) 40px, (max-width: 1280px) 48px, 48px"
                quality={60}
                placeholder="blur"
                blurDataURL={getImagePlaceholder('poster')}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

MovieSlider.displayName = 'MovieSlider';