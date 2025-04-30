import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { getImageUrl } from '../utils/image';
import { Movie } from '../types/movie';

export const LatestMovies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const [filters, setFilters] = useState({
    sort_field: searchParams.get('sort_field') || 'modified.time',
    sort_type: searchParams.get('sort_type') || 'desc'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['latestMovies', page, filters],
    queryFn: () => api.getLatestMovies(page),
    staleTime: 5 * 60 * 1000
  });

  const movies = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || page;

  const pagination = {
    totalItems,
    totalItemsPerPage: 24,
    currentPage,
    totalPages
  };

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), [key]: value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pagesToShow = [];
    const maxButtons = 5;
    const startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

    if (page > 1) {
      pagesToShow.push(
        <button 
          key="prev" 
          onClick={() => handlePageChange(page - 1)} 
          className="flex items-center gap-1 px-4 py-2.5 text-base rounded-lg bg-[#2a2c31] text-white hover:bg-[#3a3c41] transition-colors"
        >
          <span>‹</span>
          <span className="hidden sm:inline">Trước</span>
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i <= 0) continue;
      pagesToShow.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2.5 text-base rounded-lg transition-colors ${
            i === page ? "bg-yellow-500 text-black font-medium" : "bg-[#2a2c31] text-white hover:bg-[#3a3c41]"
          }`}
        >
          {i}
        </button>
      );
    }

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
          className="px-4 py-2.5 text-base rounded-lg bg-[#2a2c31] text-white hover:bg-[#3a3c41] transition-colors"
        >
          {pagination.totalPages}
        </button>
      );
    }

    if (page < pagination.totalPages) {
      pagesToShow.push(
        <button 
          key="next" 
          onClick={() => handlePageChange(page + 1)}
          className="flex items-center gap-1 px-4 py-2.5 text-base rounded-lg bg-[#2a2c31] text-white hover:bg-[#3a3c41] transition-colors"
        >
          <span className="hidden sm:inline">Sau</span>
          <span>›</span>
        </button>
      );
    }

    return (
      <div className="mt-8 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {pagesToShow}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-6">Phim mới cập nhật</h1>

      <div className="flex flex-wrap gap-2 mb-6 text-sm text-white">
        <select 
          onChange={(e) => updateFilter('sort_field', e.target.value)} 
          value={filters.sort_field} 
          className="bg-black/40 px-3 py-2 rounded"
        >
          <option value="modified.time">Mới cập nhật</option>
          <option value="year">Năm</option>
          <option value="_id">ID</option>
        </select>
        <select 
          onChange={(e) => updateFilter('sort_type', e.target.value)} 
          value={filters.sort_type} 
          className="bg-black/40 px-3 py-2 rounded"
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-white">Đang tải phim...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((movie: Movie) => (
              <Link
                key={movie._id}
                to={`/phim/${movie.slug}`}
                className="group relative block overflow-hidden rounded-lg"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={getImageUrl(movie.poster_url)}
                    alt={movie.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 right-2 flex flex-col gap-1">
                    <div className="flex justify-between items-start w-full">
                      <div>
                        {movie.episode_current && (
                          <span className="px-2 py-1 bg-pink-500 text-white text-xs md:text-sm rounded">
                            {movie.episode_current}
                          </span>
                        )}
                      </div>
                      <div>
                        {movie.quality && (
                          <span className="px-2 py-1 bg-yellow-500 text-black text-xs md:text-sm font-medium rounded">
                            {movie.quality}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-2">
                  <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {movie.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};