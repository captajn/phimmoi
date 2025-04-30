import React, { useEffect, useCallback, useState } from 'react';
import { MdKeyboardArrowUp } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
import { MovieSlider } from '../components/MovieSlider';
import { MovieSection } from '../components/MovieSection';
import { LatestMoviesSection } from '../components/LatestMoviesSection';
import { VietnameseMoviesSection } from '../components/VietnameseMoviesSection';
import { AnimeSection } from '../components/AnimeSection';
import { PhimBoSection } from '../components/PhimBoSection';
import { ThuyetMinhSection } from '../components/ThuyetMinhSection';
import { setupImageLazyLoading, preloadPriorityImages } from '../utils/image';
import { debounce } from '../utils/performance';
import { api } from '../services/api';

// Constants for cache keys
const LATEST_MOVIES_CACHE_KEY = 'latestMovies';
const TOP_MOVIES_CACHE_KEY = 'topMovies';

// Utility to load from cache
const loadFromCache = (key: string) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Lỗi khi đọc cache:', error);
    return null;
  }
};

interface MovieItem {
  _id: string;
  name: string;
  thumb_url?: string;
  poster_url?: string;
  slug: string;
}

const Home: React.FC = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sử dụng React Query để tải dữ liệu
  const { data: moviesForSlider, isLoading: isLoadingSlider } = useQuery({
    queryKey: ['homeSliderMovies'],
    queryFn: async () => {
      try {
        // Kiểm tra cache trước khi gọi API
        const cacheKey = 'cache_slider_movies';
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            if (Date.now() - parsedCache.timestamp < 5 * 60 * 1000) { // 5 phút thay vì 10 phút
              console.log('[SLIDER] Sử dụng cache');
              
              // Preload ảnh ngay khi dùng cache
              if (parsedCache.data.items) {
                console.log('[SLIDER] Preloading', parsedCache.data.items.length, 'ảnh từ cache');
                const imagesToPreload = parsedCache.data.items.slice(0, 6).map(
                  (item: MovieItem) => item.thumb_url || item.poster_url
                );
                preloadPriorityImages(imagesToPreload);
              }
              
              return parsedCache.data;
            }
          }
        } catch (e) {
          console.warn('[SLIDER] Lỗi đọc cache:', e);
        }

        console.log('[SLIDER] Tải dữ liệu mới từ API');
        // Load ảnh placeholder trước khi fetch API
        preloadPriorityImages(['/placeholder-movie.jpg']);
        
        // Sử dụng API mới với fetch trực tiếp thay vì qua axios
        const startTime = Date.now();
        const response = await fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1');
        const data = await response.json();
        const fetchTime = Date.now() - startTime;
        console.log(`[SLIDER] API trả về sau ${fetchTime}ms`);
        
        // Preload ảnh ngay khi nhận được dữ liệu mới
        if (data.items) {
          console.log('[SLIDER] Preloading', data.items.length, 'ảnh từ API mới');
          const imagesToPreload = data.items.slice(0, 6).map(
            (item: MovieItem) => item.thumb_url || item.poster_url
          );
          preloadPriorityImages(imagesToPreload);
        }
        
        // Lưu vào cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
          }));
          console.log('[SLIDER] Đã lưu dữ liệu vào cache');
        } catch (e) {
          console.warn('[SLIDER] Lỗi lưu cache:', e);
        }
        
        return data;
      } catch (err) {
        console.error('[SLIDER] Lỗi API chính:', err);
        try {
          // Backup API call nếu API chính lỗi
          console.log('[SLIDER] Gọi API dự phòng...');
          const data = await api.getMoviesByType('phim-chieu-rap', 1);
          console.log('[SLIDER] API dự phòng thành công');
          return data;
        } catch {
          console.error('[SLIDER] API dự phòng cũng lỗi');
          throw err;
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1, // Giảm số lần retry để tăng tốc
    retryDelay: 1000, // Chỉ đợi 1 giây trước khi retry
  });

  // Lấy phim mới nhất cho slider (sử dụng cho LatestMoviesSection)
  useQuery({
    queryKey: ['latestMovies'],
    queryFn: () => api.getLatestMovies(1),
    staleTime: 5 * 60 * 1000,
  });

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll event handler
  useEffect(() => {
    const handleScroll = debounce(() => {
      setShowScrollTop(window.scrollY > 300);
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prefetch các hình ảnh ưu tiên cao để hiển thị ngay lập tức
  const prefetchPriorityContent = useCallback(() => {
    // Lấy ảnh từ cache nếu có
    const cachedLatestMovies = loadFromCache(LATEST_MOVIES_CACHE_KEY);
    const cachedTopMovies = loadFromCache(TOP_MOVIES_CACHE_KEY);
    
    // Danh sách ảnh cần tải trước
    const priorityImages: string[] = [];
    
    if (cachedLatestMovies?.items) {
      // Lấy 6 ảnh đầu tiên từ phim mới cập nhật
      const latestImages = cachedLatestMovies.items
        .slice(0, 6)
        .map((movie: MovieItem) => movie.thumb_url)
        .filter(Boolean) as string[];
      
      priorityImages.push(...latestImages);
    }
    
    if (cachedTopMovies?.data?.items) {
      // Lấy 3 ảnh đầu tiên từ top phim
      const topImages = cachedTopMovies.data.items
        .slice(0, 3)
        .map((movie: MovieItem) => movie.thumb_url)
        .filter(Boolean) as string[];
      
      priorityImages.push(...topImages);
    }
    
    // Ưu tiên tải trước các ảnh chính
    if (priorityImages.length > 0) {
      console.log('Preloading priority images:', priorityImages.length);
      preloadPriorityImages(priorityImages);
      
      // Thêm thẻ style để ảnh hiển thị mịn hơn
      const style = document.createElement('style');
      style.textContent = `
        .movie-poster {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        .movie-poster.loaded {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
      
      // Thêm sự kiện onload cho các ảnh đã có
      setTimeout(() => {
        document.querySelectorAll('.movie-poster').forEach(img => {
          const imgEl = img as HTMLImageElement;
          if (imgEl.complete) {
            imgEl.classList.add('loaded');
          } else {
            imgEl.addEventListener('load', () => {
              imgEl.classList.add('loaded');
            });
          }
        });
      }, 300);
    }
  }, []);

  // Setup lazy loading và preload ảnh khi component mount
  useEffect(() => {
    // Setup lazy loading 
    setupImageLazyLoading();
    
    // Prefetch các nội dung ưu tiên
    prefetchPriorityContent();

    // Đánh dấu là đã tải dữ liệu sau 500ms (giảm từ 1s xuống 500ms)
    const timer = setTimeout(() => {
      setDataLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [prefetchPriorityContent]);

  // Khi có dữ liệu slider, tự động đánh dấu là đã tải
  useEffect(() => {
    if (moviesForSlider && moviesForSlider.items && moviesForSlider.items.length > 0) {
      // Nếu có dữ liệu, đánh dấu là đã tải ngay lập tức
      setDataLoaded(true);
    }
  }, [moviesForSlider]);

  // Lấy danh sách phim từ dữ liệu API
  const sliderMovies = moviesForSlider?.items || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Hiển thị nội dung thay thế khi chưa tải xong hoặc không có dữ liệu */}
      {(isLoadingSlider || moviesForSlider === undefined || (moviesForSlider && moviesForSlider.items?.length === 0)) && (
        <div className="container mx-auto p-4 pt-20">
          <h2 className="text-2xl font-bold mb-4">Phim đang tải...</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-700 aspect-video rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-1"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nội dung chính - hiển thị khi đã tải xong hoặc song song với skeleton */}
      <div className={dataLoaded ? "opacity-100 transition-opacity duration-500" : "opacity-0 absolute"}>
        {/* 1. Slider phim hot */}
        <div className="relative">
          <MovieSlider movies={sliderMovies} />
        </div>
        
        {/* 2. Phim mới cập nhật */}
        <LatestMoviesSection />
        
        {/* 3. Phim Hàn Quốc */}
        <MovieSection title="Phim Hàn Quốc" apiSlug="han-quoc" colorClass="text-blue-400" />
        
        {/* 4. Phim Trung Quốc */}
        <MovieSection title="Phim Trung Quốc" apiSlug="trung-quoc" colorClass="text-yellow-400" />
        
        {/* 5. Phim Âu Mỹ */}
        <MovieSection title="Phim Âu Mỹ" apiSlug="au-my" colorClass="text-red-400" />
        
        {/* 6. Phim hoạt hình */}
        <AnimeSection />
        
        {/* 7. Phim Việt Nam */}
        <VietnameseMoviesSection />
        
        {/* 8. Phim Bộ Mới */}
        <PhimBoSection 
          title="Phim Bộ Mới" 
          typeList="phim-bo"
          sortField="modified.time"
          sortType="desc"
          limit={12}
        />
        <ThuyetMinhSection />
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-all"
          aria-label="Cuộn lên đầu trang"
        >
          <MdKeyboardArrowUp className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default Home;