"use client"

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import LazyImage from './LazyImage';

// Các API servers có thể dùng thay thế
const API_SERVERS = [
  'https://phimapi.com/v1/api'
];

// Interface cho dữ liệu API trả về
interface ApiCategory {
  id: string;
  name: string;
  slug: string;
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
  lang?: string;
}

interface ApiSuccessResponse {
  status: string;
  msg: string;
  data: {
    items: ApiMovie[];
    pagination: {
      totalItems: number;
      totalItemsPerPage: number;
      currentPage: number;
      totalPages: number;
    };
  };
}

// Khai báo interface cho dữ liệu phim đã được format
interface FormattedMovie {
  _id: string;
  name: string;
  origin_name: string;
  slug: string;
  year: number;
  thumb_url: string;
  poster_url: string;
  lang: string;
  quality?: string;
  episode_current?: string;
  episode_total?: string;
}

interface ThuyetMinhSectionProps {
  title?: string;
  limit?: number;
}

export const ThuyetMinhSection: React.FC<ThuyetMinhSectionProps> = ({
  title = "Phim Thuyết Minh",
  limit = 15
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Hàm điều hướng
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -scrollRef.current.offsetWidth / 2 : scrollRef.current.offsetWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Truy vấn dữ liệu phim thuyết minh
  const { data, isLoading, error } = useQuery({
    queryKey: ['phimThuyetMinhList', limit],
    queryFn: async () => {
      try {
        // Kiểm tra cache trước
        const cacheKey = 'cache_phim-thuyet-minh';
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            if (Date.now() - parsedCache.timestamp < 30 * 60 * 1000) {
              return parsedCache.data;
            }
          }
        } catch (e) {
          console.warn("Lỗi đọc cache:", e);
        }

        // Gọi API phim thuyết minh
        const params = {
          page: 1,
          limit: limit,
          sort_field: 'modified.time',
          sort_type: 'desc'
        };

        // Thêm timeout để tránh chờ quá lâu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
          const response = await axios.get<ApiSuccessResponse>(`${API_SERVERS[0]}/danh-sach/phim-thuyet-minh`, {
            params,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.data && response.data.status === "success") {
            const items = response.data.data.items || [];
            
            // Chuyển đổi dữ liệu để hiển thị
            const formattedData = items.map(movie => ({
              _id: movie._id,
              name: movie.name,
              origin_name: movie.origin_name,
              slug: movie.slug,
              year: movie.year,
              thumb_url: movie.thumb_url,
              poster_url: movie.poster_url,
              lang: movie.lang || "Thuyết Minh",
              quality: movie.quality || "HD",
              episode_current: movie.episode_current,
              episode_total: movie.episode_total
            }));

            // Lưu vào cache
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: formattedData
              }));
            } catch (e) {
              console.warn("Lỗi lưu cache:", e);
            }

            return formattedData;
          }
          
          throw new Error("API không trả về dữ liệu hợp lệ");
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      } catch (err) {
        console.error("Lỗi khi tải phim thuyết minh:", err);
        
        // Thử APIs dự phòng
        for (let i = 1; i < API_SERVERS.length; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await axios.get<ApiSuccessResponse>(`${API_SERVERS[i]}/danh-sach/phim-thuyet-minh`, {
              params: { page: 1, limit },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.data?.status === "success" && response.data.data.items?.length > 0) {
              return response.data.data.items.map(movie => ({
                _id: movie._id,
                name: movie.name,
                origin_name: movie.origin_name,
                slug: movie.slug,
                year: movie.year,
                thumb_url: movie.thumb_url,
                poster_url: movie.poster_url,
                lang: movie.lang || "Thuyết Minh",
                quality: movie.quality || "HD",
                episode_current: movie.episode_current,
                episode_total: movie.episode_total
              }));
            }
          } catch (e) {
            console.error(`API dự phòng ${i} lỗi:`, e);
          }
        }
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Trường hợp đang tải 
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-500">
            {title}
          </h2>
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-gray-800/60 aspect-[2/3] rounded-xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  // Trường hợp lỗi hoặc không có dữ liệu
  if (error || !data || data.length === 0) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-500">
            {title}
          </h2>
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-center h-24">
          <p className="text-gray-400">Đang cập nhật phim thuyết minh...</p>
        </div>
      </section>
    );
  }

  // Hiển thị danh sách phim
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/danh-sach/phim-thuyet-minh" className="flex items-center gap-2 group">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-500 group-hover:text-yellow-400 transition">
            {title}
          </h2>
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 group-hover:text-yellow-400 transition" />
        </Link>
        
        {/* Nút điều hướng - hiển thị ở tất cả các kích thước màn hình */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleScroll('left')}
            className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            aria-label="Trước"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          <button 
            onClick={() => handleScroll('right')}
            className="p-2 md:p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            aria-label="Sau"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[140px] sm:auto-cols-[160px] md:auto-cols-[180px] lg:auto-cols-[200px] gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {data.map((movie: FormattedMovie) => (
          <Link
            key={movie._id}
            href={`/phim/${movie.slug}`}
            className="group snap-start"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800/60">
              <LazyImage 
                src={movie.thumb_url ? movie.thumb_url.startsWith('/') ? `https://phimimg.com${movie.thumb_url}` : `https://phimimg.com/${movie.thumb_url}` : '/no-image-portrait.png'} 
                alt={movie.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-90">
                {/* Badge góc trái - Số tập */}
                {movie.episode_current && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 bg-opacity-90 text-white text-xs font-medium rounded">
                    {movie.episode_current}
                  </div>
                )}
                
                {/* Badge góc phải - Chất lượng */}
                {movie.quality && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600 bg-opacity-90 text-white text-xs font-medium rounded">
                    {movie.quality}
                  </div>
                )}
              </div>
            </div>
            <h3 className="mt-2 text-white text-sm md:text-base font-medium line-clamp-1 group-hover:text-yellow-400 transition-colors">
              {movie.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}; 