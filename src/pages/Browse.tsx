import { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MdFilterList, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

interface MovieItem {
  _id: string;
  name: string;
  slug: string;
  thumb_url?: string;
  poster_url?: string;
  quality?: string;
  episode_current?: string;
  lang?: string;
  origin_name?: string;
}

export function Browse() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [countries, setCountries] = useState<{ name: string; slug: string }[]>([]);
  const [activeFilters, setActiveFilters] = useState({
    country: '',
    category: '',
    year: '',
    sort_lang: ''
  });

  const page = parseInt(searchParams.get('page') || '1');
  const [filters, setFilters] = useState({
    sort_field: searchParams.get('sort_field') || '_id',
    sort_type: searchParams.get('sort_type') || 'desc',
    sort_lang: searchParams.get('sort_lang') || '',
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    year: searchParams.get('year') || '',
    limit: '24'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          axios.get('https://phimapi.com/the-loai').then(res => res.data),
          axios.get('https://phimapi.com/quoc-gia').then(res => res.data)
        ]);
        setCategories(categoriesRes);
        setCountries(countriesRes);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };
    fetchData();
    
    // Set active filters from URL params
    setActiveFilters({
      country: searchParams.get('country') || '',
      category: searchParams.get('category') || '',
      year: searchParams.get('year') || '',
      sort_lang: searchParams.get('sort_lang') || ''
    });
  }, [searchParams]);

  // Xác định tiêu đề và API endpoint dựa vào type
  const getBrowseInfo = () => {
    if (!type || !slug) {
      // Kiểm tra xem có bất kỳ bộ lọc nào được áp dụng không
      const hasFilters = Object.values(activeFilters).some(val => val !== '');
      
      if (hasFilters) {
        // Sử dụng endpoint phù hợp dựa trên bộ lọc đang được áp dụng
        if (activeFilters.country) {
          const countryName = countries.find(c => c.slug === activeFilters.country)?.name || activeFilters.country;
          return {
            title: `Phim ${countryName}`,
            endpoint: `https://phimapi.com/v1/api/quoc-gia/${activeFilters.country}`,
            isValid: true
          };
        } else if (activeFilters.category) {
          const categoryName = categories.find(c => c.slug === activeFilters.category)?.name || activeFilters.category;
          return {
            title: `Phim Thể Loại ${categoryName}`,
            endpoint: `https://phimapi.com/v1/api/the-loai/${activeFilters.category}`,
            isValid: true
          };
        } else if (activeFilters.year) {
          return {
            title: `Phim Năm ${activeFilters.year}`,
            endpoint: `https://phimapi.com/v1/api/nam/${activeFilters.year}`,
            isValid: true
          };
        } else if (activeFilters.sort_lang) {
          let langTitle = 'Phim';
          if (activeFilters.sort_lang === 'vietsub') langTitle = 'Phim Vietsub';
          if (activeFilters.sort_lang === 'thuyet-minh') langTitle = 'Phim Thuyết Minh';
          if (activeFilters.sort_lang === 'long-tieng') langTitle = 'Phim Lồng Tiếng';
          
          return {
            title: langTitle,
            endpoint: `https://phimapi.com/v1/api/danh-sach/${activeFilters.sort_lang === 'vietsub' ? 'phim-vietsub' : 
                        activeFilters.sort_lang === 'thuyet-minh' ? 'phim-thuyet-minh' : 
                        activeFilters.sort_lang === 'long-tieng' ? 'phim-long-tieng' : 'phim-moi-cap-nhat'}`,
            isValid: true
          };
        }
        
        // Fallback
        return {
          title: 'Phim Mới Cập Nhật',
          endpoint: 'https://phimapi.com/v1/api/danh-sach/phim-moi-cap-nhat',
          isValid: true
        };
      }
      
      return {
        title: 'Duyệt Tìm Phim',
        endpoint: '',
        isValid: false
      };
    }

    switch (type) {
      case 'quoc-gia':
        return {
          title: `Phim ${countries.find(c => c.slug === slug)?.name || slug}`,
          endpoint: `https://phimapi.com/v1/api/quoc-gia/${slug}`,
          isValid: true
        };
      case 'the-loai':
        return {
          title: `Phim Thể Loại ${categories.find(c => c.slug === slug)?.name || slug}`,
          endpoint: `https://phimapi.com/v1/api/the-loai/${slug}`,
          isValid: true
        };
      case 'nam':
        return {
          title: `Phim Năm ${slug}`,
          endpoint: `https://phimapi.com/v1/api/nam/${slug}`,
          isValid: true
        };
      default:
        return {
          title: 'Duyệt Tìm Phim',
          endpoint: '',
          isValid: false
        };
    }
  };

  const browseInfo = getBrowseInfo();

  const { data, isLoading, error } = useQuery({
    queryKey: ['browseMovies', type, slug, page, filters],
    queryFn: async () => {
      try {
        if (!browseInfo.isValid) {
          return { data: { items: [], params: { pagination: { totalPages: 1 } } } };
        }

        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('sort_field', filters.sort_field);
        params.append('sort_type', filters.sort_type);
        params.append('limit', filters.limit);
        
        if (filters.sort_lang && filters.sort_lang.trim() !== '') {
          // Không cần thêm sort_lang vào URL nếu đã có trong endpoint
          if (!browseInfo.endpoint.includes(`/danh-sach/phim-${filters.sort_lang}`)) {
            params.append('sort_lang', filters.sort_lang);
          }
        }
        
        // Thêm các bộ lọc
        if (filters.category && filters.category.trim() !== '') {
          // Chỉ thêm category nếu không duyệt theo thể loại hoặc không có type
          if (!type || type !== 'the-loai' && !browseInfo.endpoint.includes(`/the-loai/${filters.category}`)) {
            params.append('category', filters.category);
          }
        }
        
        if (filters.country && filters.country.trim() !== '') {
          // Chỉ thêm country nếu không duyệt theo quốc gia hoặc không có type
          if (!type || type !== 'quoc-gia' && !browseInfo.endpoint.includes(`/quoc-gia/${filters.country}`)) {
            params.append('country', filters.country);
          }
        }
        
        if (filters.year && filters.year.trim() !== '') {
          // Chỉ thêm year nếu không duyệt theo năm hoặc không có type
          if (!type || type !== 'nam' && !browseInfo.endpoint.includes(`/nam/${filters.year}`)) {
            params.append('year', filters.year);
          }
        }
        
        const apiUrl = `${browseInfo.endpoint}?${params.toString()}`;
        console.log('Calling API:', apiUrl);
        
        try {
          const response = await axios.get(apiUrl);
          console.log('API Response status:', response.status);
          console.log('API Response data structure:', Object.keys(response.data));
          
          // Kiểm tra cấu trúc dữ liệu và đảm bảo cấu trúc nhất quán
          if (response.data && response.data.data) {
            // API đã trả về dữ liệu trong thuộc tính "data"
            return response.data;
          } else if (response.data && response.data.items) {
            // API trả về dữ liệu trực tiếp, bọc nó trong đối tượng "data"
            return { data: response.data };
          } else {
            console.error('Unexpected API response structure:', response.data);
            return { data: { items: [], params: { pagination: { totalPages: 1 } } } };
          }
        } catch (apiError: unknown) {
          console.error('API Error:', apiError instanceof Error ? apiError.message : apiError);
          if (apiError && typeof apiError === 'object' && 'response' in apiError) {
            const errorWithResponse = apiError as { response?: { status: number; data: unknown } };
            if (errorWithResponse.response) {
              console.error('API Error Response:', errorWithResponse.response.status, errorWithResponse.response.data);
            }
          }
          throw apiError;
        }
      } catch (err) {
        console.error('API Error:', err);
        throw err;
      }
    },
    enabled: browseInfo.isValid,
    retry: 1
  });

  const movies = data?.data?.items || [];
  const totalPages = data?.data?.params?.pagination?.totalPages || 1;

  const updateFilter = (key: string, value: string) => {
    // If clicking on already active filter, remove it
    if (activeFilters[key as keyof typeof activeFilters] === value) {
      value = '';
    }
    
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), [key]: value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://phimimg.com${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(val => val !== '').length;
  };

  const renderPagination = () => {
    const pagesToShow = [];
    const maxButtons = 5;
    const startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Previous button
    if (page > 1) {
      pagesToShow.push(
        <button
          key="prev"
          onClick={() => handlePageChange(page - 1)}
          className="flex items-center justify-center w-10 h-10 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          <span className="transform rotate-180">›</span>
        </button>
      );
    }
    
    // First page
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
    
    // Page numbers
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
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pagesToShow.push(
          <span key="dots2" className="px-3 py-2 text-gray-500">...</span>
        );
      }
      pagesToShow.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-4 py-2 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    if (page < totalPages) {
      pagesToShow.push(
        <button
          key="next"
          onClick={() => handlePageChange(page + 1)}
          className="flex items-center justify-center w-10 h-10 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          <span>›</span>
        </button>
      );
    }
    
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {pagesToShow}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-4">
        {browseInfo.title}
      </h1>

      {/* Nút hiển thị bộ lọc */}
      <div className="mb-4">
        <button 
          onClick={toggleFilters} 
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          <MdFilterList size={20} />
          <span>Bộ lọc</span>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{getActiveFiltersCount()}</span>
          )}
          {showFilters ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
        </button>
      </div>

      {/* Bộ lọc */}
      {showFilters && (
        <div className="bg-[#1a1b1d] rounded-xl p-4 mb-6 animate-fadeIn">
          {/* Quốc gia - Hiển thị nếu không phải đang duyệt theo quốc gia */}
          {type !== 'quoc-gia' && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Quốc gia:</h3>
              <div className="flex flex-wrap gap-2">
                {countries.filter(country => [
                  'viet-nam', 'trung-quoc', 'han-quoc', 'nhat-ban', 'dai-loan', 
                  'hong-kong', 'au-my', 'thai-lan', 'uc', 'anh', 'y', 'phap', 
                  'nga', 'an-do'
                ].includes(country.slug)).map(country => (
                  <button
                    key={country.slug}
                    onClick={() => updateFilter('country', country.slug)}
                    className={`px-3 py-1.5 text-sm rounded-full transition ${
                      activeFilters.country === country.slug
                        ? 'bg-yellow-500 text-black font-medium'
                        : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loại phim */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Loại phim:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('sort_lang', 'vietsub')}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  activeFilters.sort_lang === 'vietsub'
                    ? 'bg-yellow-500 text-black font-medium'
                    : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                }`}
              >
                Vietsub
              </button>
              <button
                onClick={() => updateFilter('sort_lang', 'thuyet-minh')}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  activeFilters.sort_lang === 'thuyet-minh'
                    ? 'bg-yellow-500 text-black font-medium'
                    : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                }`}
              >
                Thuyết minh
              </button>
              <button
                onClick={() => updateFilter('sort_lang', 'long-tieng')}
                className={`px-3 py-1.5 text-sm rounded-full transition ${
                  activeFilters.sort_lang === 'long-tieng'
                    ? 'bg-yellow-500 text-black font-medium'
                    : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                }`}
              >
                Lồng tiếng
              </button>
            </div>
          </div>

          {/* Thể loại - Hiển thị nếu không phải đang duyệt theo thể loại */}
          {type !== 'the-loai' && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Thể loại:</h3>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2">
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`px-3 py-1.5 text-sm rounded-full transition ${
                      activeFilters.category === cat.slug
                        ? 'bg-yellow-500 text-black font-medium'
                        : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Năm phát hành - Hiển thị nếu không phải đang duyệt theo năm */}
          {type !== 'nam' && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Năm phát hành:</h3>
              <div className="flex flex-wrap gap-2">
                {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(year => (
                  <button
                    key={year}
                    onClick={() => updateFilter('year', year.toString())}
                    className={`px-3 py-1.5 text-sm rounded-full transition ${
                      activeFilters.year === year.toString()
                        ? 'bg-yellow-500 text-black font-medium'
                        : 'bg-[#2a2c31] text-white hover:bg-[#3a3c41]'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            
            let displayName = '';
            if (key === 'country') {
              displayName = countries.find(c => c.slug === value)?.name || '';
            } else if (key === 'category') {
              displayName = categories.find(c => c.slug === value)?.name || '';
            } else if (key === 'year') {
              displayName = `Năm ${value}`;
            } else if (key === 'sort_lang') {
              if (value === 'vietsub') displayName = 'Vietsub';
              if (value === 'thuyet-minh') displayName = 'Thuyết minh';
              if (value === 'long-tieng') displayName = 'Lồng tiếng';
            }
            
            if (!displayName) return null;
            
            return (
              <button
                key={key}
                onClick={() => updateFilter(key, '')}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-black text-sm rounded-full font-medium"
              >
                {displayName} <span className="text-xs">×</span>
              </button>
            );
          })}
        </div>
      )}

      {!browseInfo.isValid ? (
        <div className="text-center py-12 text-gray-400">
          Vui lòng chọn thể loại, quốc gia hoặc năm để hiển thị kết quả
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-gray-400">
          <p>Lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
          <p className="text-xs mt-2">Chi tiết: {(error as Error).message}</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Không tìm thấy kết quả phù hợp
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {movies.map((movie: MovieItem) => (
              <Link
                key={movie._id}
                to={`/phim/${movie.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden bg-gray-900">
                  <img
                    src={getImageUrl(movie.poster_url || movie.thumb_url)}
                    alt={movie.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                    {movie.episode_current && (
                      <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded w-fit">
                        {movie.episode_current}
                      </span>
                    )}
                    {movie.quality && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded w-fit">
                        {movie.quality}
                      </span>
                    )}
                    {movie.lang && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded w-fit">
                        {movie.lang}
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-medium line-clamp-2 text-sm group-hover:text-yellow-400 transition-colors">
                      {movie.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          <div className="mt-8">
            {renderPagination()}
          </div>
        </>
      )}
    </div>
  );
} 