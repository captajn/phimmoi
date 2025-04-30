import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Movie } from '../types/movie';

export const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const [filters, setFilters] = useState({
    sort_field: searchParams.get('sort_field') || 'modified.time',
    sort_type: searchParams.get('sort_type') || 'desc',
    sort_lang: searchParams.get('sort_lang') || '',
    country: searchParams.get('country') || '',
    year: searchParams.get('year') || '',
    limit: '24'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categoryMovies', slug, page, filters],
    queryFn: () => api.getMoviesByCategory(slug || '', page, filters),
    enabled: !!slug
  });

  const movies = data?.data?.items || [];
  const totalPages = data?.data?.params?.pagination?.totalPages || 1;
  const categoryName = data?.data?.titlePage || '';

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), [key]: value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('/') ? `https://phimimg.com${url}` : `https://phimimg.com/${url}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-6">
        Phim {categoryName}
      </h1>

      {/* Bộ lọc */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie: Movie) => (
              <Link to={`/phim/${movie.slug}`} key={movie._id} className="group">
                <div className="bg-[#2a2c31] rounded-lg overflow-hidden">
                  {/* Ảnh ngang */}
                  <div className="relative aspect-video">
                    <img
                      src={getImageUrl(movie.thumb_url)}
                      alt={movie.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Tập mới nhất */}
                    {movie.episode_current && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-pink-500 text-white text-sm rounded">
                        {movie.episode_current}
                      </span>
                    )}
                    {/* Chất lượng */}
                    {movie.quality && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-sm font-medium rounded">
                        {movie.quality}
                      </span>
                    )}
                    {/* Overlay khi hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Xem phim</span>
                    </div>
                  </div>
                  {/* Thông tin phim */}
                  <div className="p-3">
                    <h3 className="text-white font-medium line-clamp-2 group-hover:text-yellow-400 transition-colors">
                      {movie.name}
                    </h3>
                    <div className="mt-1 text-sm text-gray-400">
                      {movie.year}
                      {movie.time && <span className="mx-2">•</span>}
                      {movie.time}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <button
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 bg-[#2a2c31] text-white rounded hover:bg-[#3a3c41]"
              >
                Trang trước
              </button>
            )}
            <span className="px-4 py-2 bg-yellow-500 text-black rounded font-medium">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <button
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 bg-[#2a2c31] text-white rounded hover:bg-[#3a3c41]"
              >
                Trang sau
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};