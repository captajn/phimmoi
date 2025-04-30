import { useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { api } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieItem {
  _id: string;
  name: string;
  origin_name?: string;
  slug: string;
  poster_url?: string;
  thumb_url?: string;
}

interface MovieDetail {
  movie?: {
    type?: string;
    episode_current?: string;
    quality?: string;
    lang?: string;
    year?: number;
    time?: string;
  }
}

interface Pagination {
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

interface ApiResponse {
  items: MovieItem[];
  pagination: Pagination;
}

interface TypedApiResponse {
  data: {
    items: MovieItem[];
    params: {
      pagination: Pagination;
    }
  }
}

export const MovieListPage = () => {
  const { type, genre, country, year } = useParams<{ type: string; genre: string; country: string; year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const [filters, setFilters] = useState({
    sort_field: searchParams.get('sort_field') || 'modified.time',
    sort_type: searchParams.get('sort_type') || 'desc',
    sort_lang: searchParams.get('sort_lang') || '',
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    year: searchParams.get('year') || '',
    limit: '24'
  });

  const { data, isLoading } = useQuery<ApiResponse | TypedApiResponse>({
    queryKey: ['movieList', type, page, filters],
    queryFn: useCallback(() => {
      if (type) {
        return api.getMoviesByType(type, page, filters);
      } else if (genre) {
        return api.getMoviesByCategory(genre, page, filters);
      } else if (country) {
        return api.getMoviesByCountry(country, page, filters);
      } else if (year) {
        // TODO: Implement year filter
        return api.getMoviesByType('phim-moi-nhat', page, { ...filters, year });
      }
      return api.getLatestMovies(page);
    }, [type, genre, country, year, page, filters]),
    enabled: !!type
  });

  const movies = type === 'phim-moi-cap-nhat' 
    ? (data as ApiResponse)?.items || []
    : (data as TypedApiResponse)?.data?.items || [];
  
  const pagination = type === 'phim-moi-cap-nhat'
    ? (data as ApiResponse)?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 }
    : (data as TypedApiResponse)?.data?.params?.pagination || {
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    };

  const movieQueries = useQueries({
    queries: movies.map((movie: MovieItem) => ({
      queryKey: ['movie', movie.slug],
      queryFn: () => api.getMovieDetail(movie.slug),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), [key]: value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTitle = () => {
    switch (type) {
      case 'phim-bo': return 'Phim Bộ';
      case 'phim-le': return 'Phim Lẻ';
      case 'hoat-hinh': return 'Hoạt Hình';
      case 'tv-shows': return 'TV Shows';
      case 'phim-vietsub': return 'Phim Vietsub';
      case 'phim-thuyet-minh': return 'Phim Thuyết Minh';
      case 'phim-long-tieng': return 'Phim Lồng Tiếng';
      case 'phim-moi-cap-nhat': return 'Phim Mới Cập Nhật';
      default: return 'Danh sách phim';
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://phimimg.com${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderPagination = () => {
    const pagesToShow = [];
    const maxButtons = 5;
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

    // Nút Previous
    pagesToShow.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg transition ${
          page === 1
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Trước</span>
      </button>
    );

    // Trang đầu
    if (startPage > 1) {
      pagesToShow.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-4 py-2 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pagesToShow.push(
          <span key="dots1" className="px-3 py-2 text-gray-500">...</span>
        );
      }
    }

    // Các trang giữa
    for (let i = startPage; i <= endPage; i++) {
      pagesToShow.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-lg transition ${
            i === page
              ? 'bg-yellow-500 text-black font-medium'
              : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
          }`}
        >
          {i}
        </button>
      );
    }

    // Trang cuối
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pagesToShow.push(
          <span key="dots2" className="px-3 py-2 text-gray-500">...</span>
        );
      }
      pagesToShow.push(
        <button
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-4 py-2 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          {pagination.totalPages}
        </button>
      );
    }

    // Nút Next
    pagesToShow.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
        disabled={page === pagination.totalPages}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg transition ${
          page === pagination.totalPages
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
        }`}
      >
        <span>Sau</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    );

    return (
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {pagination.totalPages > 1 && pagesToShow}
        </div>
        <div className="text-gray-400 text-sm">
          Trang {page} / {pagination.totalPages || 1}
          <span className="ml-2">• Tổng {pagination.totalItems} phim</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-6">{getTitle()}</h1>

      {/* Bộ lọc */}
      <div className="bg-[#1a1b1d] rounded-xl p-4 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Lọc phim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select 
            onChange={(e) => updateFilter('sort_field', e.target.value)} 
            value={filters.sort_field}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="modified.time">Mới cập nhật</option>
            <option value="year">Năm</option>
            <option value="_id">ID</option>
          </select>

          <select 
            onChange={(e) => updateFilter('sort_type', e.target.value)} 
            value={filters.sort_type}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>

          <select 
            onChange={(e) => updateFilter('sort_lang', e.target.value)} 
            value={filters.sort_lang}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="">Ngôn ngữ</option>
            <option value="vietsub">Vietsub</option>
            <option value="thuyet-minh">Thuyết minh</option>
            <option value="long-tieng">Lồng tiếng</option>
          </select>

          <select 
            onChange={(e) => updateFilter('category', e.target.value)} 
            value={filters.category}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="">Thể loại</option>
            <option value="hanh-dong">Hành động</option>
            <option value="tinh-cam">Tình cảm</option>
            <option value="hai-huoc">Hài hước</option>
            <option value="co-trang">Cổ trang</option>
            <option value="tam-ly">Tâm lý</option>
            <option value="hinh-su">Hình sự</option>
          </select>

          <select 
            onChange={(e) => updateFilter('country', e.target.value)} 
            value={filters.country}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="">Quốc gia</option>
            <option value="trung-quoc">Trung Quốc</option>
            <option value="han-quoc">Hàn Quốc</option>
            <option value="au-my">Âu Mỹ</option>
            <option value="viet-nam">Việt Nam</option>
            <option value="thai-lan">Thái Lan</option>
            <option value="nhat-ban">Nhật Bản</option>
          </select>

          <select 
            onChange={(e) => updateFilter('year', e.target.value)} 
            value={filters.year}
            className="px-3 py-2 rounded bg-[#2a2c31] text-white border border-gray-700"
          >
            <option value="">Năm phát hành</option>
            {Array.from({ length: 2025 - 1970 + 1 }, (_, i) => 2025 - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie: MovieItem, index: number) => {
              const movieDetail = movieQueries[index]?.data as MovieDetail;
              
              return (
                <Link
                  key={movie._id}
                  to={`/phim/${movie.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden bg-gray-900">
                    <img
                      src={getImageUrl(movie.poster_url)}
                      alt={movie.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                      {movieDetail?.movie?.episode_current && (
                        <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded w-fit">
                          {movieDetail.movie.type === 'series' ? movieDetail.movie.episode_current : 'Full'}
                        </span>
                      )}
                      {movieDetail?.movie?.quality && (
                        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded w-fit">
                          {movieDetail.movie.quality}
                        </span>
                      )}
                      {movieDetail?.movie?.lang && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded w-fit">
                          {movieDetail.movie.lang}
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-medium line-clamp-2 text-sm group-hover:text-yellow-400 transition-colors">
                        {movie.name}
                      </h3>
                      {movie.origin_name && movie.origin_name !== movie.name && (
                        <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">{movie.origin_name}</p>
                      )}
                      {movieDetail?.movie && (
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                          {movieDetail.movie.year && <span>{movieDetail.movie.year}</span>}
                          {movieDetail.movie.time && (
                            <>
                              <span>•</span>
                              <span>{movieDetail.movie.time}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};