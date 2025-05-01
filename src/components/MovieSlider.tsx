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
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
  }
  .movie-title {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 1);
    font-size: 2.5rem;
    line-height: 1.2;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .movie-origin-title {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1rem;
  }
  .slider-overlay {
    background: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.75) 0%,
      rgba(0, 0, 0, 0.5) 30%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0.1) 100%
    );
  }
  .slider-side-overlay {
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(0, 0, 0, 0.4) 25%,
      rgba(0, 0, 0, 0) 75%
    );
  }
  @media (min-width: 1024px) {
    .slider-overlay {
      background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.7) 0%,
        rgba(0, 0, 0, 0.4) 35%,
        rgba(0, 0, 0, 0.2) 70%,
        rgba(0, 0, 0, 0.05) 100%
      );
    }
    .slider-side-overlay {
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.6) 0%,
        rgba(0, 0, 0, 0.4) 30%,
        rgba(0, 0, 0, 0.1) 60%,
        rgba(0, 0, 0, 0) 100%
      );
    }
  }
  .category-item {
    display: inline-block;
  }
  @media (max-width: 767px) {
    .category-item:nth-child(n + 4) {
      display: none;
    }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .category-item:nth-child(n + 5) {
      display: none;
    }
  }
  /* Container chứa thông tin phim */
  .movie-info-container {
    position: relative;
    z-index: 15;
    width: 100%;
    max-width: 800px;
  }
  
  @media (max-width: 640px) {
    .movie-info-container {
      padding-bottom: 1rem;
    }
    .movie-title {
      font-size: 1.75rem;
      line-height: 1.1;
      margin-bottom: 0.5rem;
    }
    .movie-origin-title {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .movie-description {
      max-height: 3rem;
      overflow: hidden;
      font-size: 0.875rem !important;
      line-height: 1.3 !important;
      margin-bottom: 1rem !important;
    }
    .movie-tag {
      font-size: 0.65rem !important;
      padding: 0.15rem 0.5rem !important;
      margin-right: 0.35rem !important;
      margin-bottom: 0.35rem !important;
    }
    .movie-genres {
      margin: 0.5rem 0 !important;
    }
  }
  
  @media (min-width: 641px) {
    .movie-info-container {
      padding-bottom: 1.5rem;
    }
  }
  
  /* Thumbnail container */
  .thumbnail-container {
    position: absolute;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: fit-content;
    margin-top: auto;
    margin-bottom: auto;
    top: 50%;
    transform: translateY(-50%);
    right: 1rem;
  }
  
  .thumbnail-button {
    position: relative;
    width: 1.25rem !important;
    height: 1.25rem !important;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background-color: rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .thumbnail-button.active {
    border-color: #fff;
    transform: scale(1.2);
  }
  
  .thumbnail-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 767px) {
    .thumbnail-container {
      right: 0.5rem;
    }
    
    .thumbnail-button {
      width: 2.5rem !important;
      height: 2.5rem !important;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }
  }
  
  @media (min-width: 768px) {
    .thumbnail-container {
      flex-direction: row;
      right: auto;
      left: 50%;
      transform: translateX(-50%);
      bottom: 1.5rem;
      top: auto;
    }
    
    .thumbnail-button {
      width: 2rem !important;
      height: 2rem !important;
      margin-right: 0.35rem;
      margin-bottom: 0;
    }
  }
  
  @media (min-width: 1024px) {
    .thumbnail-container {
      bottom: 2rem;
    }
    
    .thumbnail-button {
      width: 2.5rem !important;
      height: 2.5rem !important;
      margin-right: 0.5rem;
    }
  }
  
  @media (min-width: 1280px) {
    .thumbnail-container {
      bottom: 3rem;
    }
  }
  
  /* Button Xem Phim */
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .watch-movie-button {
    position: relative;
    z-index: 16;
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background-color: #ff9f0a;
    color: #000;
    font-weight: 700;
    border-radius: 9999px;
    transition: all 0.2s ease;
  }
  
  .watch-movie-button:hover {
    background-color: #e89000;
  }
  
  .add-list-button {
    position: relative;
    z-index: 16;
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 600;
    border-radius: 9999px;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }
  
  .add-list-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 767px) {
    .add-list-button {
      display: none;
    }
    
    .watch-movie-button {
      width: 100%;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
    
    .action-buttons {
      margin-top: 1rem;
    }
  }
  
  /* Button icon */
  .button-icon {
    margin-right: 0.5rem;
  }
  
  /* Điều chỉnh chiều cao slider cho các kích thước màn hình */
  .movie-slider {
    width: 100%;
    height: 85vh;
  }
  
  @media (max-width: 479px) {
    .movie-slider {
      height: 75vh;
    }
    .thumbnail-container {
      bottom: 1rem;
      gap: 0.35rem;
    }
  }
  
  @media (min-width: 480px) and (max-width: 767px) {
    .movie-slider {
      height: 75vh;
    }
    .thumbnail-container {
      bottom: 1.25rem;
    }
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    .movie-slider {
      height: 80vh;
    }
    .thumbnail-container {
      bottom: 1.5rem;
    }
  }
  
  @media (min-width: 1024px) {
    .movie-slider {
      height: 85vh;
    }
  }
  
  /* Movie tags style */
  .movie-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #fff;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .movie-tag.imdb {
    background-color: #f5c518;
    color: #000;
  }
  
  .movie-tag.episode {
    background-color: rgba(255, 69, 58, 0.85);
  }
  
  /* Movie genres row */
  .movie-genres {
    display: flex;
    flex-wrap: wrap;
    margin: 1rem 0;
  }
  
  /* Movie description */
  .movie-description {
    max-width: 650px;
    margin-bottom: 1.5rem;
    font-size: 1rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
  }
  
  /* Mobile adjustments for portrait mode */
  @media (max-width: 767px) and (orientation: portrait) {
    .movie-slider {
      height: 65vh;
    }
    
    .movie-info-container {
      max-width: 100%;
      padding-bottom: 0.5rem;
    }
    
    .movie-description {
      max-height: 2.6rem;
      margin-bottom: 0.75rem;
    }

    .movie-title {
      font-size: 1.5rem;
    }

    .movie-origin-title {
      font-size: 0.8rem;
      margin-bottom: 0.35rem;
    }

    .action-buttons {
      margin-top: 0.75rem;
    }

    .thumbnail-container {
      bottom: 0.75rem;
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
        className="movie-slider"
        fadeEffect={{ crossFade: true }}
      >
        {visibleMovies.map((movie, idx) => {
          const info = details[movie.slug];
          return (
            <SwiperSlide key={movie._id}>
              <div className="relative h-full w-full">
                <div className="absolute inset-0">
                  <Image
                    src={getOptimizedImageUrl(movie.thumb_url, "large")}
                    alt={movie.name}
                    className="object-cover"
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    quality={idx === 0 ? 100 : 75}
                    placeholder="blur"
                    blurDataURL={getImagePlaceholder("backdrop")}
                  />
                </div>
                <div className="absolute inset-0 slider-overlay z-[1]" />
                <div className="absolute inset-0 slider-side-overlay z-[1]" />
                <div className="absolute bottom-0 left-0 w-full z-[5]">
                  <div className="container mx-auto px-4 pb-10 sm:pb-14 md:pb-16 lg:pb-20 xl:pb-28">
                    <div className="movie-info-container">
                      <h1 className="movie-title text-white">
                        {info?.name || movie.name}
                      </h1>
                      {info?.origin_name && (
                        <p className="movie-origin-title">
                          {info.origin_name}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center mb-4">
                        {info && getImdbRating(info.imdb) !== "" && (
                          <span className="movie-tag imdb">
                            IMDb {getImdbRating(info.imdb)}
                          </span>
                        )}
                        {(info?.time || movie.time) && (
                          <span className="movie-tag">{info?.time || movie.time}</span>
                        )}
                        {(info?.quality || movie.quality) && (
                          <span className="movie-tag">
                            {info?.quality || movie.quality || "HD"}
                          </span>
                        )}
                        {(info?.episode_current || movie.episode_current) && (
                          <span className="movie-tag episode">
                            {info?.episode_current || movie.episode_current}
                          </span>
                        )}
                        <span className="movie-tag">
                          {info?.lang || movie.lang || "Vietsub"}
                        </span>
                        <span className="movie-tag">
                          {info?.year || movie.year || "2025"}
                        </span>
                      </div>

                      {info && info.category && info.category.length > 0 ? (
                        <div className="movie-genres">
                          {info.category.map(
                            (cat: { name: string }, i: number) => (
                              <span
                                key={i}
                                className="movie-tag"
                              >
                                {cat.name}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="movie-genres">
                          <span className="movie-tag">
                            Phim Hay
                          </span>
                          <span className="movie-tag">
                            Mới Cập Nhật
                          </span>
                        </div>
                      )}

                      <p className="movie-description line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
                        {info?.content ||
                          movie.content ||
                          "Đang tải thông tin phim..."}
                      </p>

                      <div className="action-buttons">
                        <Link href={`/phim/${movie.slug}`}>
                          <button className="watch-movie-button">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            <span>Xem Phim</span>
                          </button>
                        </Link>
                        <button className="add-list-button">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Thêm Vào Danh Sách</span>
                        </button>
                      </div>
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
            className={`thumbnail-button ${activeIndex === i ? 'active' : ''}`}
            onClick={() => handleSlideClick(i)}
            aria-label={`Chuyển đến phim ${movie.name}`}
          >
            <img 
              src={getOptimizedImageUrl(movie.thumb_url || movie.poster_url, "small")}
              alt={movie.name}
              className="thumbnail-img"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
});

MovieSlider.displayName = 'MovieSlider';