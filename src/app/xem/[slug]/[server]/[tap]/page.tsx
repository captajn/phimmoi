'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { api } from '@/services/api'
import { WatchDetailSkeleton } from '@/components/Skeleton'
import { setupImageLazyLoading } from '@/utils/image'
import { useParams } from 'next/navigation'
import type { MovieEpisodeResponse } from '@/types/types'
import React from 'react'

// Định nghĩa kiểu cho dữ liệu từ API
interface MovieEpisodeData {
  name: string
  slug: string
  link_m3u8: string
}

interface ServerData {
  server_name: string
  server_data: Array<{
    name: string
    slug: string
    link_m3u8: string
  }>
}

interface MovieDetail {
  movie: {
    name: string
    origin_name: string
    year: number
    thumb_url?: string
    poster_url?: string
    time?: string
    quality?: string
    lang?: string
    content?: string
    episode_current?: string
    trailer_url?: string
    actor?: string[]
    director?: string[]
    slug?: string
  }
  episodes: Array<ServerData>
}

// Định nghĩa kiểu dữ liệu cho tham số text
function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function WatchDetail() {
  const params = useParams() as { slug: string; server: string; tap: string }
  const { slug, server, tap } = params
  
  const playerRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<Artplayer | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [tab, setTab] = useState('episodes')
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)
  const maxRetries = 3
  const [autoNext, setAutoNext] = useState(true)
  const [theaterMode, setTheaterMode] = useState(false)

  const { data: movieData, isLoading } = useQuery<MovieDetail>({
    queryKey: ['movieDetail', slug],
    queryFn: () => api.getMovieDetail(slug),
    enabled: !!slug
  })

  const { data: episodeData } = useQuery<MovieEpisodeResponse>({
    queryKey: ['episode', slug, server, tap],
    queryFn: () => api.getMovieEpisode(slug, server, tap),
    enabled: !!movieData && !!slug && !!server && !!tap
  })

  const movie = movieData?.movie
  const episodes = movieData?.episodes || []
  const currentEpisode = episodeData?.data

  // Debug log
  useEffect(() => {
    console.log('Movie Data:', movieData)
    console.log('Episode Data:', episodeData)
    console.log('Current Episode:', currentEpisode)
    
    if (movieData?.episodes) {
      console.log('Số lượng server:', movieData.episodes.length)
      movieData.episodes.forEach((serverData, index) => {
        console.log(`Server ${index + 1}: ${serverData.server_name} - Số tập: ${serverData.server_data.length}`)
        
        // Kiểm tra xem server này có đúng với server đang xem không
        const isVietsub = normalizeText(serverData.server_name).includes('vietsub')
        const isLongTieng = normalizeText(serverData.server_name).includes('long tieng') || 
                         normalizeText(serverData.server_name).includes('lồng tiếng')
        const isThuyetMinh = normalizeText(serverData.server_name).includes('thuyet minh')
        
        let matchServer = false
        if (server === 'vietsub' && isVietsub) matchServer = true
        if (server === 'thuyet-minh' && isThuyetMinh) matchServer = true
        if (server === 'long-tieng' && isLongTieng) matchServer = true
        
        console.log(`Server ${serverData.server_name} khớp với "${server}": ${matchServer}`)
      })
    }
  }, [movieData, episodeData, currentEpisode, server])

  useEffect(() => {
    if (playerRef.current && currentEpisode?.link_m3u8) {
      setIsVideoLoading(true)
      setVideoLoadError(false)

      // Cleanup previous instances to prevent memory leaks
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

        if (artRef.current) {
          artRef.current.destroy()
          artRef.current = null
        }

      try {
        const art = new Artplayer({
          container: playerRef.current,
          url: currentEpisode.link_m3u8,
          type: 'm3u8',
          customType: {
            m3u8: function (video: HTMLVideoElement, url: string) {
              if (Hls.isSupported()) {
                // Cấu hình HLS với xử lý lỗi và timeout dài hơn
                const hls = new Hls({
                  xhrSetup: function (xhr) {
                    xhr.withCredentials = false
                  },
                  // Tăng thời gian timeout cho các request
                  fragLoadingTimeOut: 60000,
                  manifestLoadingTimeOut: 60000,
                  levelLoadingTimeOut: 60000,
                  // Tăng số lần thử lại
                  fragLoadingMaxRetry: 6,
                  manifestLoadingMaxRetry: 6,
                  levelLoadingMaxRetry: 6,
                  // Đặt thời gian chờ giữa các lần thử lại (ms)
                  fragLoadingRetryDelay: 1000,
                  manifestLoadingRetryDelay: 1000,
                  levelLoadingRetryDelay: 1000
                })

                hlsRef.current = hls
                
                hls.loadSource(url)
                hls.attachMedia(video)
                
                // Xử lý lỗi HLS
                hls.on(Hls.Events.ERROR, function (event, data) {
                  console.error('HLS Error:', data)
                  
                  if (data.fatal) {
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        // Xử lý lỗi mạng - thử tải lại
                        console.log('HLS Network error - Trying to recover')
                        hls.startLoad()
                        break
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        // Xử lý lỗi media - thử khôi phục
                        console.log('HLS Media error - Trying to recover')
                        hls.recoverMediaError()
                        break
                      case Hls.ErrorTypes.MUX_ERROR:
                      case Hls.ErrorTypes.OTHER_ERROR:
                      default:
                        // Lỗi khác - thử tạo lại HLS
                        if (retryCount.current < maxRetries) {
                          retryCount.current++
                          console.log(`HLS Error - Retrying (${retryCount.current}/${maxRetries})`)
                          
                          if (hlsRef.current) {
                            hlsRef.current.destroy()
                            hlsRef.current = null
                          }

                          setTimeout(() => {
                            const newHls = new Hls()
                            hlsRef.current = newHls
                            newHls.loadSource(url)
                            newHls.attachMedia(video)
                          }, 1000)
                        } else {
                          // Đã thử quá nhiều lần - hiển thị lỗi
                          console.error('Failed to recover from HLS error after multiple attempts')
                          setIsVideoLoading(false)
                    setVideoLoadError(true)
                        }
                        break
                    }
                  }
                })
                
                // Theo dõi sự kiện tải thành công
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                  console.log('HLS Manifest loaded successfully')
                  // Reset số lần thử khi tải thành công
                  retryCount.current = 0
                })
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Fallback cho Safari
                video.src = url
              }
            },
          },
          volume: 1,
          autoplay: true,
          autoSize: true,
          autoMini: true,
          loop: false,
          flip: true,
          playbackRate: true,
          aspectRatio: true,
          setting: true,
          hotkey: true,
          pip: true,
          mutex: true,
          fullscreen: true,
          fullscreenWeb: true,
          subtitleOffset: true,
          miniProgressBar: true,
          playsInline: true,
          theme: '#23ade5',
          lang: 'vi-VN',
          moreVideoAttr: {
            crossOrigin: 'anonymous',
          },
          icons: {
            loading: '<img src="/loading.gif">',
            state: '<img src="/state.gif">',
          }
        })

        artRef.current = art

        art.on('ready', () => {
          console.log('Video ready')
          setIsVideoLoading(false)
        })

        art.on('error', (error) => {
          console.error('Video error:', error)
          setIsVideoLoading(false)
          setVideoLoadError(true)
        })

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy()
            hlsRef.current = null
          }
          
          if (artRef.current) {
            artRef.current.destroy()
            artRef.current = null
          }
        }
      } catch (error) {
        console.error('Error initializing player:', error)
        setIsVideoLoading(false)
        setVideoLoadError(true)
      }
    }
  }, [currentEpisode])

  useEffect(() => {
    if (!isLoading) {
      setupImageLazyLoading()
    }
  }, [isLoading])

  useEffect(() => {
    if (theaterMode) {
      document.body.classList.add('theater-mode')
    } else {
      document.body.classList.remove('theater-mode')
    }

    const style = document.createElement('style')
    style.textContent = `
      body.theater-mode {
        background: #000 !important;
        overflow: hidden;
      }
      body.theater-mode header,
      body.theater-mode .content-container {
        display: none !important;
      }
      body.theater-mode .player-wrapper {
        width: 100vw;
        height: 100vh;
        max-width: none;
        margin: 0;
      }
      body.theater-mode .player-controls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.body.classList.remove('theater-mode')
      style.remove()
    }
  }, [theaterMode])

  if (isLoading) {
    return <WatchDetailSkeleton />
  }

  const reloadVideo = () => {
    setIsVideoLoading(true)
    setVideoLoadError(false)
    retryCount.current = 0
    
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    
    if (artRef.current) {
      artRef.current.destroy()
      artRef.current = null
    }

    setTimeout(() => {
      if (playerRef.current && currentEpisode?.link_m3u8) {
        try {
        const art = new Artplayer({
          container: playerRef.current,
          url: currentEpisode.link_m3u8,
          type: 'm3u8',
          customType: {
            m3u8: function (video: HTMLVideoElement, url: string) {
              if (Hls.isSupported()) {
                const hls = new Hls({
                  xhrSetup: function (xhr) {
                    xhr.withCredentials = false
                    },
                    fragLoadingTimeOut: 60000,
                    manifestLoadingTimeOut: 60000,
                    fragLoadingMaxRetry: 6,
                    manifestLoadingMaxRetry: 6
                  })
                  
                  hlsRef.current = hls
                hls.loadSource(url)
                hls.attachMedia(video)
                  
                  hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                      console.error('Fatal HLS Error on reload:', data)
                      setVideoLoadError(true)
                    }
                  })
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url
              }
            },
          },
            volume: 1,
            autoplay: true,
            theme: '#23ade5',
        })
          
        artRef.current = art
          
          art.on('ready', () => {
            setIsVideoLoading(false)
          })
          
          art.on('error', () => {
            setVideoLoadError(true)
            setIsVideoLoading(false)
          })
        } catch (error) {
          console.error('Error during reload:', error)
          setVideoLoadError(true)
          setIsVideoLoading(false)
        }
      }
    }, 1000)
  }

  return (
    <div className="bg-[#0b0c0f] text-white min-h-screen">
      <div className="max-w-screen-xl mx-auto">
        <div className="px-4 py-2 text-sm md:text-base">
          <Link href={`/phim/${slug}`} className="text-yellow-500 hover:underline">
            {movie?.name}
          </Link>
          <span className="mx-2">-</span>
          <span>Tập {tap?.replace('tap-', '')} - Server {server === 'vietsub' ? 'Vietsub' : server === 'thuyet-minh' ? 'Thuyết Minh' : 'Lồng Tiếng'}</span>
        </div>

        <div className={`relative ${theaterMode ? 'player-wrapper' : ''}`}>
        <div className="w-full aspect-video bg-black relative">
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
          <div ref={playerRef} className="w-full h-full"></div>
          </div>

          <div className={`flex items-center flex-wrap gap-2 sm:gap-4 p-2 sm:p-3 bg-[#1a1b1f] rounded-md player-controls ${theaterMode ? 'mt-0' : 'mt-4'}`}>
            <div className="flex-1 flex items-center flex-wrap gap-2">
              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-[#2a2b2d] rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="hidden sm:inline">Yêu thích</span>
              </button>

              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-[#2a2b2d] rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Thêm vào</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <button
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                    autoNext ? 'text-white bg-red-600' : 'text-gray-400 hover:bg-[#2a2b2d]'
                  }`}
                  onClick={() => setAutoNext(!autoNext)}
                  title="Tự động chuyển tập và phát khi video kết thúc"
                >
                  <span className="inline mr-1">Chuyển tập</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-sm ${
                    autoNext ? 'bg-white text-red-600' : 'bg-gray-700 text-white'
                  }`}>
                    {autoNext ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="flex items-center">
                <button
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                    theaterMode ? 'text-white bg-red-600' : 'text-gray-400 hover:bg-[#2a2b2d]'
                  }`}
                  onClick={() => setTheaterMode(!theaterMode)}
                  title="Chế độ rạp phim, ẩn tất cả các menu và nội dung khác"
                >
                  <span className="inline mr-1">Rạp phim</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-sm ${
                    theaterMode ? 'bg-white text-red-600' : 'bg-gray-700 text-white'
                  }`}>
                    {theaterMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <button className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-[#2a2b2d] rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="inline">Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-screen-xl mx-auto px-4 md:px-12 lg:px-20 py-8 ${theaterMode ? 'hidden' : ''}`}>
        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800">
          <button
            className={`pb-4 px-2 relative ${
              tab === 'episodes'
                ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500'
                : 'text-white/80 hover:text-white'
            }`}
            onClick={() => setTab('episodes')}
          >
            Tập phim
          </button>
          <button
            className={`pb-4 px-2 relative ${
              tab === 'info'
                ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500'
                : 'text-white/80 hover:text-white'
            }`}
            onClick={() => setTab('info')}
          >
            Thông tin phim
          </button>
          {movie?.trailer_url && (
            <button
              className={`pb-4 px-2 relative ${
                tab === 'trailer'
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500'
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setTab('trailer')}
            >
              Trailer
            </button>
          )}
          {movie?.actor && movie.actor.length > 0 && (
            <button
              className={`pb-4 px-2 relative ${
                tab === 'actors'
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500'
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setTab('actors')}
            >
              Diễn viên
            </button>
          )}
          {movie?.director && movie.director.length > 0 && (
            <button
              className={`pb-4 px-2 relative ${
                tab === 'director'
                  ? 'text-yellow-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500'
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setTab('director')}
            >
              Đạo diễn
            </button>
          )}
        </div>

        <div className="mt-6">
          {tab === 'episodes' && (
            <div className="bg-[#1a1b1d] p-4 sm:p-6 rounded-lg">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-lg font-medium text-white">Server:</h3>
                <div className="flex flex-wrap gap-2">
                  {episodes.some(ep => normalizeText(ep.server_name).includes('vietsub')) && (
                    <Link
                      href={`/xem/${slug}/vietsub/${tap}`}
                      className={`px-3 py-1 rounded text-sm ${
                        server === 'vietsub' 
                          ? 'bg-yellow-500 text-black font-medium' 
                          : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                      }`}
                    >
                      VietSub
                    </Link>
                  )}
                  {episodes.some(ep => normalizeText(ep.server_name).includes('thuyet minh')) && (
                    <Link
                      href={`/xem/${slug}/thuyet-minh/${tap}`}
                      className={`px-3 py-1 rounded text-sm ${
                        server === 'thuyet-minh'
                          ? 'bg-yellow-500 text-black font-medium' 
                          : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                      }`}
                    >
                      Thuyết Minh
                    </Link>
                  )}
                  {episodes.some(ep => 
                    normalizeText(ep.server_name).includes('long tieng') || 
                    normalizeText(ep.server_name).includes('lồng tiếng')
                  ) && (
                    <Link
                      href={`/xem/${slug}/long-tieng/${tap}`}
                      className={`px-3 py-1 rounded text-sm ${
                        server === 'long-tieng'
                          ? 'bg-yellow-500 text-black font-medium' 
                          : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                      }`}
                    >
                      Lồng Tiếng
                    </Link>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-4">Danh sách tập:</h3>
              {(() => {
                // Trước tiên, xác định server phù hợp với loại hiện tại
                let currentServerData = null;
                
                for (const serverData of episodes) {
                  const serverName = normalizeText(serverData.server_name);
                  let isMatchingServer = false;
                  
                  if (server === 'vietsub' && serverName.includes('vietsub')) {
                    isMatchingServer = true;
                  } else if (server === 'thuyet-minh' && serverName.includes('thuyet minh')) {
                    isMatchingServer = true;
                  } else if (server === 'long-tieng' && 
                             (serverName.includes('long tieng') || serverName.includes('lồng tiếng'))) {
                    isMatchingServer = true;
                  }
                  
                  if (isMatchingServer) {
                    currentServerData = serverData;
                    break;
                  }
                }
                
                // Nếu không tìm thấy server nào phù hợp, sử dụng server đầu tiên
                if (!currentServerData && episodes.length > 0) {
                  currentServerData = episodes[0];
                }
                
                // Nếu không có dữ liệu, hiển thị thông báo
                if (!currentServerData) {
                  return (
                    <div className="text-white text-center py-4">
                      Không tìm thấy tập phim nào cho server này.
                    </div>
                  );
                }
                
                // Hiển thị danh sách tập phim
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {currentServerData.server_data.map((episode) => (
                    <Link
                      key={episode.slug}
                        href={`/xem/${slug}/${server}/${episode.slug}`}
                      className={`block text-center py-2 px-3 rounded-lg ${
                        episode.slug === tap
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-[#2a2b2d] text-white/90 hover:bg-[#3a3b3d]'
                      }`}
                    >
                      {episode.name}
                    </Link>
                    ))}
              </div>
                );
              })()}
            </div>
          )}

          {tab === 'info' && (
            <div className="bg-[#1a1b1d] p-4 sm:p-6 rounded-lg">
              <div className="flex flex-row gap-3 sm:gap-6">
                <div className="w-2/5 sm:w-1/3 md:w-1/4 lg:w-1/5 flex items-start justify-center">
                  <img
                    src={
                      movie?.poster_url?.startsWith('/')
                        ? 'https://phimimg.com' + movie.poster_url
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

                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie?.quality && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded">
                        {movie.quality}
                      </span>
                    )}
                    {movie?.lang && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        {movie.lang}
                      </span>
                    )}
                    {movie?.time && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                        {movie.time}
                      </span>
                    )}
                    {movie?.year && (
                      <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">
                        {movie.year}
                      </span>
                    )}
                  </div>

                  {movie?.content && (
                    <div
                      className="text-white/80 text-sm sm:text-base mb-6 line-clamp-[8]"
                      dangerouslySetInnerHTML={{ __html: movie.content }}
                    />
                  )}

                  <Link
                    href={`/phim/${movie?.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-medium rounded-full hover:bg-yellow-400 transition-colors"
                  >
                    Xem thông tin chi tiết
                  </Link>
                </div>
              </div>
            </div>
          )}

          {tab === 'trailer' && movie?.trailer_url && (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={movie.trailer_url.replace('watch?v=', 'embed/')}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
  )
} 