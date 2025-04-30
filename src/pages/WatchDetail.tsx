import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { api } from '../services/api';
import { WatchDetailSkeleton } from '../components/Skeleton';
import { setupImageLazyLoading } from '../utils/image';
import { scheduleIdleTask } from '../utils/performance';

// Định nghĩa kiểu cho dữ liệu từ API
interface MovieDetail {
  movie: {
    name: string;
    origin_name: string;
    year: number;
    thumb_url?: string;
    poster_url?: string;
    time?: string;
    quality?: string;
    lang?: string;
    content?: string;
    episode_current?: string;
    trailer_url?: string;
    actor?: string[];
    director?: string[];
    slug?: string;
  };
  episodes: Array<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      link_m3u8: string;
    }>;
  }>;
}

// Định nghĩa kiểu dữ liệu cho tham số text
function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Định nghĩa kiểu cho Artplayer options
interface ArtPlayerOptions {
  container: HTMLElement;
  url: string;
  type: string;
  setting: boolean;
  fullscreen: boolean;
  fullscreenWeb: boolean;
  playbackRate: boolean;
  autoSize: boolean;
  aspectRatio: boolean;
  pip: boolean;
  airplay: boolean;
  theme: string;
  customType: Record<string, (video: HTMLVideoElement, url: string) => void>;
  events?: {
    ready?: () => void;
    error?: () => void;
  };
}

export default function WatchDetail() {
  const { slug, server, tap } = useParams();
  const playerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const [currentEp, setCurrentEp] = useState<{
    link_m3u8: string;
    serverIndex: number;
    slug: string;
    name: string;
  } | null>(null);
  const [autoNext, setAutoNext] = useState<boolean>(true);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [tab, setTab] = useState<string>('episodes');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initAttempts = useRef(0);

  // Định nghĩa hàm initializePlayer
  const initializePlayer = useCallback(() => {
    if (!playerRef.current || !currentEp) return;
    setIsVideoLoading(true);
    setVideoLoadError(false);
    
    try {
      initAttempts.current += 1;
      console.log(`Đang tải video lần thứ ${initAttempts.current}...`);
      
      const artOptions: ArtPlayerOptions = {
        container: playerRef.current,
        url: currentEp.link_m3u8,
        type: 'm3u8',
        setting: false,
        fullscreen: true,
        fullscreenWeb: true,
        playbackRate: true,
        autoSize: false,
        aspectRatio: true,
        pip: true,
        airplay: true,
        theme: '#ff0000',
        customType: {
          m3u8: function (video, url) {
            if (Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            }
          },
        },
        events: {
          ready: function() {
            setIsVideoLoading(false);
          },
          error: function() {
            console.error('Video loading error');
            setIsVideoLoading(false);
            setVideoLoadError(true);
          }
        }
      };
      
      // @ts-expect-error - Bỏ qua lỗi kiểu vì Artplayer có thể không khớp hoàn toàn với kiểu ArtPlayerOptions
      const art = new Artplayer(artOptions);

      const style = document.createElement('style');
      style.textContent = `
        .art-video-player .art-controls {
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          padding-bottom: 10px;
        }
        .art-video-player .art-controls .art-controls-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
        }
        .art-video-player .art-controls .art-controls-progress .art-progress-loaded {
          background: rgba(255, 0, 0, 0.5);
        }
        .art-video-player .art-controls .art-controls-progress .art-progress-played {
          background: rgb(255, 0, 0);
        }
        .art-video-player.art-fullscreen .art-controls {
          z-index: 9999;
        }
      `;
      document.head.appendChild(style);

      artRef.current = art;

      return () => {
        if (artRef.current) {
          artRef.current.destroy();
          artRef.current = null;
        }
        style.remove();
      };
    } catch {
      setIsVideoLoading(false);
      setVideoLoadError(true);
    }
  }, [currentEp]);

  useEffect(() => {
    if (!currentEp || !playerRef.current) return;
    if (artRef.current) artRef.current.destroy();

    // Hiển thị trạng thái đang tải
    setIsVideoLoading(true);
    
    // Đặt timeout phòng trường hợp tải quá lâu
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setIsVideoLoading(false);
      setVideoLoadError(true);
    }, 20000); // 20 giây
    
    initializePlayer();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [currentEp, initializePlayer]);

  // Thêm hàm tải lại video
  const reloadVideo = useCallback(() => {
    setIsVideoLoading(true);
    setVideoLoadError(false);
    
    // Xóa timeout hiện tại nếu có
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Xóa player cũ nếu có
    if (artRef.current) {
      artRef.current.destroy();
      artRef.current = null;
    }
    
    // Đặt timeout mới
    loadingTimeoutRef.current = setTimeout(() => {
      setIsVideoLoading(false);
      setVideoLoadError(true);
    }, 20000); // 20 giây
    
    // Thử khởi tạo lại player
    setTimeout(() => {
      initializePlayer();
    }, 500);
  }, [initializePlayer]);

  useEffect(() => {
    scheduleIdleTask(() => {
      import('../pages/Home').then(() => {
        console.log('Home component prefetched in WatchDetail');
      });
    });
    
    setupImageLazyLoading();
  }, []);
  
  useEffect(() => {
    return () => {
      sessionStorage.setItem('last-watched-movie', 
        JSON.stringify({
          slug, 
          server, 
          tap, 
          timestamp: Date.now()
        })
      );
      
      if (artRef.current) {
        artRef.current.destroy();
        artRef.current = null;
      }
    };
  }, [slug, server, tap]);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['movieDetail', slug],
    queryFn: () => api.getMovieDetail(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const movieDetailData = detail as MovieDetail | undefined;
  const movie = movieDetailData?.movie;

  const episodes = useMemo(() => {
    return movieDetailData?.episodes || [];
  }, [movieDetailData?.episodes]);

  useEffect(() => {
    if (!episodes.length || !server || !tap) return;

    const sIndex = episodes.findIndex((s) => {
      const serverName = normalizeText(s.server_name);
      return server === 'vietsub'
        ? serverName.includes('vietsub')
        : serverName.includes('thuyet minh') || serverName.includes('thuyết minh');
    });

    if (sIndex !== -1) {
      const ep = episodes[sIndex]?.server_data.find((e) => e.slug === tap);
      if (ep) {
        setCurrentEp({ ...ep, serverIndex: sIndex });
      }
    }
  }, [episodes, server, tap]);

  useEffect(() => {
    if (theaterMode) {
      document.body.classList.add('theater-mode-active');
    } else {
      document.body.classList.remove('theater-mode-active');
    }

    const theaterStyle = document.createElement('style');
    theaterStyle.textContent = `
      body.theater-mode-active {
        background-color: #000 !important;
        overflow: hidden;
      }
      body.theater-mode-active header,
      body.theater-mode-active .fixed.top-0,
      body.theater-mode-active .content-container,
      body.theater-mode-active .text-sm.text-white.mb-2,
      body.theater-mode-active footer,
      body.theater-mode-active .border-t,
      body.theater-mode-active .mt-auto {
        display: none !important;
      }
      body.theater-mode-active .theater-mode {
        position: relative;
        background: #000;
        margin: 0 auto;
        width: 100%;
        max-width: 100vw;
      }
      body.theater-mode-active .player-wrapper {
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        aspect-ratio: 16 / 9;
      }
      body.theater-mode-active .theater-controls {
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
      }
      body.theater-mode-active .theater-controls button {
        background: #dc2626 !important;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(theaterStyle);

    return () => {
      document.body.classList.remove('theater-mode-active');
      theaterStyle.remove();
    };
  }, [theaterMode]);

  if (isLoading) {
    return <WatchDetailSkeleton />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center text-white">
        Không tìm thấy phim
      </div>
    );
  }

  const serverType = server === 'vietsub' ? 'Việt Sub' : 'Thuyết Minh';

  return (
    <div
      className={`max-w-screen-xl mx-auto px-4 pt-16 md:pt-20 ${
        theaterMode ? "theater-mode" : ""
      }`}
    >
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0b0c0f]/95 backdrop-blur-sm py-3 px-4 flex items-center justify-between md:hidden">
        <Link 
          to="/" 
          className="text-yellow-500 font-bold text-xl"
        >
          Kho Phim
        </Link>
      </div>

      <div className="text-sm text-white mb-2">
        <Link to={`/phim/${slug}`} className="text-yellow-400 hover:underline">
          {"< Xem Phim " + movie?.name}
        </Link>
        <span>
          {" "}
          - Tập {tap?.replace("tap-", "")} - Server {serverType}
        </span>
      </div>

      {currentEp && (
        <>
          <div
            className={`w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 sm:mb-6 relative player-wrapper`}
          >
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                  <p className="text-white mt-4">Đang tải video...</p>
                </div>
              </div>
            )}
            {videoLoadError && !isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
                <div className="text-center p-4">
                  <div className="text-red-500 text-5xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white mb-4">Không thể tải video. Vui lòng thử lại.</p>
                  <button 
                    onClick={reloadVideo}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
                  >
                    Tải lại video
                  </button>
                </div>
              </div>
            )}
            <div id="artplayer-app" className="w-full h-full" ref={playerRef} />
          </div>

          <div
            className={`flex items-center flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 bg-[#1a1b1f] p-2 sm:p-3 rounded-md overflow-x-auto hide-scrollbar player-controls ${
              theaterMode ? "hidden" : "flex"
            }`}
          >
            <div className="flex-1 flex items-center flex-wrap gap-2">
              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Yêu thích</span>
              </button>

              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Thêm vào</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <button
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                    autoNext
                      ? "text-white bg-red-600 rounded-md"
                      : "text-gray-400"
                  }`}
                  onClick={() => setAutoNext(!autoNext)}
                  title="Tự động chuyển tập và phát khi video kết thúc"
                >
                  <span className="inline mr-1">Chuyển tập</span>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded-sm ${
                      autoNext
                        ? "bg-white text-red-600"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {autoNext ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div className="flex items-center">
                <button
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                    theaterMode
                      ? "text-white bg-red-600 rounded-md"
                      : "text-gray-400"
                  }`}
                  onClick={() => setTheaterMode(!theaterMode)}
                  title="Chế độ rạp phim, ẩn tất cả các menu và nội dung khác"
                >
                  <span className="inline mr-1">Rạp phim</span>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded-sm ${
                      theaterMode
                        ? "bg-white text-red-600"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {theaterMode ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="inline">Chia sẻ</span>
              </button>
            </div>
          </div>

          {theaterMode && (
            <div className="theater-controls">
              <button
                className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white bg-red-600 rounded-md !important"
                onClick={() => setTheaterMode(false)}
                title="Tắt chế độ rạp phim"
                style={{ backgroundColor: '#dc2626' }}
              >
                <span className="inline mr-1">Rạp Phim</span>
                <span className="px-1.5 py-0.5 text-xs rounded-sm bg-white text-red-600">
                  OFF
                </span>
              </button>
            </div>
          )}
        </>
      )}

      <div className={`content-container ${theaterMode ? "hidden" : "block"}`}>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 mb-4 sm:mb-8 border-b border-gray-800 pb-1">
          <button
            onClick={() => setTab("episodes")}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
              tab === "episodes"
                ? "text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500"
                : "text-white/70 hover:text-white"
            }`}
          >
            Tập Phim
          </button>
          <button
            onClick={() => setTab("info")}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
              tab === "info"
                ? "text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500"
                : "text-white/70 hover:text-white"
            }`}
          >
            Thông Tin
          </button>
          {movie?.trailer_url && (
            <button
              onClick={() => setTab("trailer")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === "trailer"
                  ? "text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Trailer
            </button>
          )}
          {movie?.actor && movie.actor.length > 0 && (
            <button
              onClick={() => setTab("actors")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === "actors"
                  ? "text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Diễn Viên
            </button>
          )}
          {movie?.director && movie.director.length > 0 && (
            <button
              onClick={() => setTab("director")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium transition-colors relative whitespace-nowrap ${
                tab === "director"
                  ? "text-yellow-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Đạo Diễn
            </button>
          )}
        </div>

        <div className="mt-6">
          {tab === "episodes" && (
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-6 text-yellow-500">
                  Chọn Server
                </h3>
                <div className="flex flex-wrap gap-3">
                  {episodes.map((s, i) => {
                    const isVietsub = normalizeText(s.server_name).includes(
                      "vietsub"
                    );
                    const label = isVietsub ? "vietsub" : "thuyet-minh";
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          window.location.href = `/xem/${slug}/${label}/${s.server_data[0].slug}`
                        }
                        className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                          i === currentEp?.serverIndex
                            ? "bg-yellow-500 text-black"
                            : "bg-[#2a2c31] text-white hover:bg-[#3a3c41]"
                        }`}
                      >
                        {isVietsub ? "Việt Sub" : "Thuyết Minh"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-xl font-medium mb-6 text-yellow-500">
                  Danh sách tập
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {currentEp?.serverIndex !== undefined && currentEp.serverIndex !== -1 &&
                    episodes[currentEp.serverIndex]?.server_data.map((ep, i) => (
                      <Link
                        key={i}
                        to={`/xem/${slug}/${server}/${ep.slug}`}
                        className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                          ep.slug === tap
                            ? "bg-yellow-500 text-black"
                            : "bg-[#2a2c31] text-white hover:bg-[#3a3c41]"
                        }`}
                      >
                        {ep.name}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
          
          {tab === "info" && (
            <div className="bg-[#1a1b1d] p-4 sm:p-6 rounded-lg">
              <div className="flex flex-row gap-3 sm:gap-6">
                <div className="w-2/5 sm:w-1/3 md:w-1/4 lg:w-1/5 flex items-start justify-center">
                  <img
                    src={
                      movie?.poster_url?.startsWith("/")
                        ? "https://phimimg.com" + movie.poster_url
                        : movie?.poster_url
                    }
                    alt={movie?.name}
                    className="w-full h-auto rounded-lg shadow-lg"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 line-clamp-2">
                    {movie?.name}
                  </h2>
                  {movie?.origin_name && movie.origin_name !== movie.name && (
                    <h3 className="text-sm sm:text-base md:text-xl text-white/80 mb-2 line-clamp-1">
                      {movie.origin_name}
                    </h3>
                  )}

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-[10px] xs:text-xs sm:text-sm">
                    {[
                      movie?.year,
                      movie?.time,
                      movie?.quality,
                      movie?.lang,
                    ].map(
                      (item, i) =>
                        item && (
                          <span
                            key={i}
                            className="px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 bg-white/10 rounded-full text-white"
                          >
                            {item}
                          </span>
                        )
                    )}
                    {movie?.episode_current && (
                      <span className="px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 bg-yellow-500 text-black font-medium rounded-full">
                        {movie.episode_current}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2 md:space-y-4">
                    <h3 className="text-sm sm:text-base md:text-xl font-medium text-yellow-500">
                      Nội dung
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-white line-clamp-4 sm:line-clamp-5 md:line-clamp-none">
                      {movie?.content || "Chưa có thông tin mô tả."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "trailer" && movie?.trailer_url && (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={movie.trailer_url.replace("watch?v=", "embed/")}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {tab === "actors" && movie?.actor && movie.actor.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.actor.map((actor, idx) => (
                <div
                  key={idx}
                  className="bg-[#1a1b1d] p-4 rounded-lg text-center"
                >
                  <p className="text-white/90">{actor}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "director" &&
            movie?.director &&
            movie.director.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movie.director.map((director, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1a1b1d] p-4 rounded-lg text-center"
                  >
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