'use client'

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { MovieDetailSkeleton } from '@/components/Skeleton';
import { setupImageLazyLoading } from '@/utils/image';
import { scheduleIdleTask } from '@/utils/performance';
import { Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ServerData {
  name: string;
  slug: string;
  link_m3u8?: string;
}

interface Episode {
  server_name: string;
  server_data: ServerData[];
}

interface MovieDetailResponse {
  movie: {
    name: string;
    origin_name?: string;
    thumb_url?: string;
    poster_url?: string;
    year?: number;
    time?: string;
    quality?: string;
    lang?: string;
    content?: string;
    episode_current?: string;
    trailer_url?: string;
    actor?: string[];
    director?: string[];
    slug: string;
    category?: { name: string }[];
    imdb?: string | { rating: string };
  };
  episodes: Episode[];
}

export default function MovieDetail() {
  const [tab, setTab] = useState('episodes');
  const [activeServer, setActiveServer] = useState(0);
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug?.toString() || '';

  useEffect(() => {
    scheduleIdleTask(() => {
      import('@/app/page').then(() => {
        console.log('Home component prefetched');
      });
    });
    
    setupImageLazyLoading();

    return () => {
      sessionStorage.setItem('last-visited-movie', slug || '');
    };
  }, [slug]);

  const { data, isLoading } = useQuery<MovieDetailResponse>({
    queryKey: ['movie', slug],
    queryFn: () => api.getMovieDetail(slug),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!slug,
  });

  const movie = data?.movie;
  const episodes = data?.episodes || [];

  if (isLoading) {
    return <MovieDetailSkeleton />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center text-white">
        Không tìm thấy phim
      </div>
    );
  }

  const poster = movie?.poster_url?.startsWith('/') ? 'https://phimimg.com' + movie.poster_url : movie?.poster_url;
  const thumb = movie?.thumb_url?.startsWith('/') ? 'https://phimimg.com' + movie.thumb_url : movie?.thumb_url;

  const getImdbRating = (imdb: string | { rating: string } | undefined) => {
    if (!imdb) return '';
    if (typeof imdb === 'string') return imdb;
    return imdb?.rating || '';
  };

  const handleEpisodeClick = (serverType: string, slug: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/xem/${movie.slug}/${serverType}/${slug}`);
  };

  return (
    <div className="bg-[#0b0c0f] text-white">
      <style jsx global>{`
        .shadow-text {
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
        }
        .movie-title {
          text-shadow: 0 4px 8px rgba(0,0,0,1);
        }
        .hero-overlay {
          background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0) 100%);
        }
        .hero-side-overlay {
          background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 85%);
        }
        @media (max-width: 1023px) {
          .hero-overlay {
            background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 75%, rgba(0,0,0,0) 100%);
          }
          .hero-side-overlay {
            background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 75%);
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
      `}</style>
      
      {/* Hero Section - Full width background */}
      <div className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[85vh] xl:h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={thumb || '/images/placeholder.jpg'}
            alt={movie?.name}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            quality={90}
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 hero-overlay z-[1]" />
        <div className="absolute inset-0 hero-side-overlay z-[1]" />
        
        {/* Movie Info Container */}
        <div className="absolute bottom-0 left-0 w-full z-[5] pb-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-row items-end gap-6">
              <div className="hidden sm:block w-[140px] md:w-[180px]">
                <img 
                  src={poster || '/images/placeholder-poster.jpg'} 
                  alt={movie?.name} 
                  className="w-full h-auto rounded-lg shadow-lg" 
                  loading="eager" 
                />
              </div>
              <div className="flex-1 text-white max-w-3xl">
                {/* Movie Title */}
                <h1 className="font-bold mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white movie-title">
                  {movie?.name}
                </h1>
                
                {/* Original Title if different */}
                {movie?.origin_name && movie.origin_name !== movie.name && (
                  <h3 className="text-sm sm:text-base text-white/80 mb-2 line-clamp-1 shadow-text">
                    {movie.origin_name}
                  </h3>
                )}
                
                {/* Movie Badges/Tags */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 text-xs sm:text-xs md:text-sm">
                  {getImdbRating(movie.imdb) !== '' && (
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-500 rounded text-black font-bold">
                      IMDb {getImdbRating(movie.imdb)}
                    </span>
                  )}
                  {movie?.time && (
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                      {movie.time}
                    </span>
                  )}
                  {movie?.quality && (
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                      {movie.quality}
                    </span>
                  )}
                  {movie?.episode_current && (
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-500/90 backdrop-blur-sm rounded font-medium text-white">
                      {movie.episode_current}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                    {movie?.lang || 'Vietsub'}
                  </span>
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                    {movie?.year || '2025'}
                  </span>
                </div>
                
                {/* Categories */}
                {movie.category && movie.category.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 text-white text-xs sm:text-xs md:text-sm mb-3">
                    {movie.category.map((cat, i) => (
                      <span key={i} className="category-item px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm rounded font-medium">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                
                {/* Movie Description */}
                <p className="text-white text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-2 md:line-clamp-3 mb-3 sm:mb-4 md:mb-5 shadow-text font-medium">
                  {movie?.content || "Chưa có thông tin mô tả."}
                </p>
                
                {/* Watch Button */}
                {episodes[0]?.server_data?.[0]?.slug && (
                  <button
                    onClick={() => {
                      // Xác định đúng loại server cho tập đầu tiên
                      const firstServer = episodes[0];
                      const serverName = firstServer.server_name.toLowerCase();
                      let serverType = 'vietsub';
                      
                      if (serverName.includes('vietsub')) {
                        serverType = 'vietsub';
                      } else if (serverName.includes('thuyet minh')) {
                        serverType = 'thuyet-minh';
                      } else if (serverName.includes('long tieng') || serverName.includes('lồng tiếng')) {
                        serverType = 'long-tieng';
                      }
                      
                      handleEpisodeClick(serverType, firstServer.server_data[0].slug);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3 rounded-full flex items-center gap-2 text-xs sm:text-sm md:text-base transition-all shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span className="font-bold">Xem Phim</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-800 hide-scrollbar">
          <button
            onClick={() => setTab('episodes')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
              tab === 'episodes' 
                ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            Tập Phim
          </button>
          <button
            onClick={() => setTab('info')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
              tab === 'info' 
                ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            Nội dung
          </button>
          {movie?.trailer_url && (
            <button
              onClick={() => setTab('trailer')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === 'trailer' 
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Trailer
            </button>
          )}
          {movie?.actor && movie.actor.length > 0 && (
            <button
              onClick={() => setTab('actors')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === 'actors' 
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Diễn Viên
            </button>
          )}
          {movie?.director && movie.director.length > 0 && (
            <button
              onClick={() => setTab('director')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === 'director' 
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Đạo Diễn
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tab === 'episodes' && (
            <div className="space-y-8">
              {/* Server Selection */}
              {episodes.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {episodes.map((server: Episode, idx: number) => {
                    // Xác định loại server dựa trên tên
                    let serverLabel = "Khác";
                    const serverName = server.server_name.toLowerCase();
                    
                    if (serverName.includes('vietsub')) {
                      serverLabel = "VietSub";
                    } else if (serverName.includes('thuyet minh')) {
                      serverLabel = "Thuyết Minh";
                    } else if (serverName.includes('long tieng') || serverName.includes('lồng tiếng')) {
                      serverLabel = "Lồng Tiếng";
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveServer(idx)}
                        className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
                          activeServer === idx
                            ? 'bg-yellow-500 text-black'
                            : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                        }`}
                      >
                        {serverLabel}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode List */}
              {episodes.map((server: Episode, idx: number) => {
                const isVietsub = server.server_name.toLowerCase().includes('vietsub');
                const isThuyetMinh = server.server_name.toLowerCase().includes('thuyet minh');
                const isLongTieng = server.server_name.toLowerCase().includes('long tieng') || 
                                   server.server_name.toLowerCase().includes('lồng tiếng');
                
                // Xác định serverType dựa trên loại server
                let serverType = 'vietsub';
                if (isVietsub) {
                  serverType = 'vietsub';
                } else if (isThuyetMinh) {
                  serverType = 'thuyet-minh';
                } else if (isLongTieng) {
                  serverType = 'long-tieng';
                }

                if (idx !== activeServer) return null;

                return (
                  <div key={idx} className="bg-[#1a1b1d] rounded-lg p-6">
                    <h3 className="text-xl font-medium mb-6 text-yellow-500">
                      {(() => {
                        const serverName = server.server_name.toLowerCase();
                        if (serverName.includes('vietsub')) {
                          return "VietSub";
                        } else if (serverName.includes('thuyet minh')) {
                          return "Thuyết Minh";
                        } else if (serverName.includes('long tieng') || serverName.includes('lồng tiếng')) {
                          return "Lồng Tiếng";
                        } else {
                          return server.server_name;
                        }
                      })()}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                      {server.server_data.map((ep: ServerData, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleEpisodeClick(serverType, ep.slug)}
                          className="px-4 py-2.5 text-sm rounded-lg font-medium text-center bg-[#2a2c31] text-white hover:bg-yellow-500 hover:text-black transition-colors"
                        >
                          {ep.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'info' && (
            <div className="bg-[#1a1b1d] p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-yellow-500">Nội dung phim</h3>
              <div className="text-white/90 text-sm sm:text-base space-y-4">
                <p>{movie?.content || "Chưa có thông tin mô tả cho phim này."}</p>
              </div>
            </div>
          )}

          {tab === 'trailer' && movie?.trailer_url && (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={movie.trailer_url.replace("watch?v=", "embed/")}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          )}

          {tab === 'actors' && movie?.actor && movie.actor.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.actor.map((actor: string, idx: number) => (
                <div key={idx} className="bg-[#1a1b1d] p-4 rounded-lg text-center">
                  <p className="text-white/90">{actor}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'director' && movie?.director && movie.director.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.director.map((director: string, idx: number) => (
                <div key={idx} className="bg-[#1a1b1d] p-4 rounded-lg text-center">
                  <p className="text-white/90">{director}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}