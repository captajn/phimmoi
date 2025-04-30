"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueries } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { MovieCardGridSkeleton } from '@/components/Skeleton'

interface MovieItem {
  _id: string
  name: string
  origin_name?: string
  slug: string
  poster_url?: string
  thumb_url?: string
}

interface MovieDetail {
  movie?: {
    type?: string
    episode_current?: string
    quality?: string
    lang?: string
    year?: number
    time?: string
  }
}

interface Pagination {
  totalItems: number
  currentPage: number
  totalPages: number
}

interface ApiResponse {
  items: MovieItem[]
  pagination: Pagination
}

interface TypedApiResponse {
  data: {
    items: MovieItem[]
    params: {
      pagination: Pagination
    }
  }
}

export function MovieList() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const type = params?.type as string
  const page = parseInt(searchParams?.get('page') || '1')
  const [isClient, setIsClient] = useState(false)
  const [filters, setFilters] = useState({
    sort_field: searchParams?.get('sort_field') || 'modified.time',
    sort_type: searchParams?.get('sort_type') || 'desc',
    sort_lang: searchParams?.get('sort_lang') || '',
    category: searchParams?.get('category') || '',
    country: searchParams?.get('country') || '',
    year: searchParams?.get('year') || '',
    limit: '24'
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { data, isLoading } = useQuery<ApiResponse | TypedApiResponse>({
    queryKey: ['movieList', type, page, filters],
    queryFn: () => {
      if (!type) return Promise.resolve({ items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } })
      return type === 'phim-moi-cap-nhat' ? api.getLatestMovies(page) : api.getMoviesByType(type, page, filters)
    },
    enabled: !!type && isClient
  })

  const movies = type === 'phim-moi-cap-nhat' 
    ? (data as ApiResponse)?.items || []
    : (data as TypedApiResponse)?.data?.items || []
  
  const pagination = type === 'phim-moi-cap-nhat'
    ? (data as ApiResponse)?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 }
    : (data as TypedApiResponse)?.data?.params?.pagination || {
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
    }

  const movieQueries = useQueries({
    queries: movies.map((movie: MovieItem) => ({
      queryKey: ['movie', movie.slug],
      queryFn: () => api.getMovieDetail(movie.slug),
      staleTime: 5 * 60 * 1000,
      enabled: isClient
    })),
  })

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Update URL with new search params
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    
    router.push(`/danh-sach/${type}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', newPage.toString())
    
    router.push(`/danh-sach/${type}?${params.toString()}`)
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getTitle = () => {
    switch (type) {
      case 'phim-bo': return 'Phim Bộ'
      case 'phim-le': return 'Phim Lẻ'
      case 'hoat-hinh': return 'Hoạt Hình'
      case 'tv-shows': return 'TV Shows'
      case 'phim-vietsub': return 'Phim Vietsub'
      case 'phim-thuyet-minh': return 'Phim Thuyết Minh'
      case 'phim-long-tieng': return 'Phim Lồng Tiếng'
      case 'phim-moi-cap-nhat': return 'Phim Mới Cập Nhật'
      default: return 'Danh sách phim'
    }
  }

  const getImageUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `https://phimimg.com${url.startsWith('/') ? '' : '/'}${url}`
  }

  const renderPagination = () => {
    const pagesToShow = []
    const maxButtons = 5
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1)

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
    )

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
      )
      if (startPage > 2) {
        pagesToShow.push(
          <span key="dots1" className="px-3 py-2 text-gray-500">...</span>
        )
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
      )
    }

    // Trang cuối
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pagesToShow.push(
          <span key="dots2" className="px-3 py-2 text-gray-500">...</span>
        )
      }
      pagesToShow.push(
        <button
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-4 py-2 bg-[#2a2c31] text-white rounded-lg hover:bg-[#3a3c41] transition"
        >
          {pagination.totalPages}
        </button>
      )
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
    )

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-10">
        {pagesToShow}
      </div>
    )
  }

  const formatQuality = (quality?: string): string => {
    if (!quality) return '';
    quality = quality.toLowerCase();
    if (quality.includes('full') && quality.includes('hd')) return 'FHD';
    if (quality.includes('hd')) return 'HD';
    if (quality.includes('sd')) return 'SD';
    if (quality.includes('cam')) return 'CAM';
    return quality.toUpperCase();
  };

  if (!isClient) {
    return <MovieCardGridSkeleton />
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-6">{getTitle()}</h1>

      {/* Bộ lọc */}
      <div className="bg-[#1a1c23] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
          <select
            onChange={(e) => updateFilter('sort_field', e.target.value)}
            value={filters.sort_field}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="modified.time">Mới cập nhật</option>
            <option value="year">Năm</option>
            <option value="_id">ID</option>
          </select>
          
          <select
            onChange={(e) => updateFilter('sort_type', e.target.value)}
            value={filters.sort_type}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
          
          <select
            onChange={(e) => updateFilter('sort_lang', e.target.value)}
            value={filters.sort_lang}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="">Ngôn ngữ</option>
            <option value="vietsub">Vietsub</option>
            <option value="thuyet-minh">Thuyết minh</option>
            <option value="long-tieng">Lồng tiếng</option>
          </select>
          
          <select
            onChange={(e) => updateFilter('category', e.target.value)}
            value={filters.category}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="">Thể loại</option>
            <option value="hanh-dong">Hành Động</option>
            <option value="tinh-cam">Tình Cảm</option>
            <option value="hai-huoc">Hài Hước</option>
            <option value="co-trang">Cổ Trang</option>
            <option value="tam-ly">Tâm Lý</option>
            <option value="hinh-su">Hình Sự</option>
            <option value="chien-tranh">Chiến Tranh</option>
            <option value="the-thao">Thể Thao</option>
            <option value="vo-thuat">Võ Thuật</option>
            <option value="vien-tuong">Viễn Tưởng</option>
            <option value="phieu-luu">Phiêu Lưu</option>
            <option value="khoa-hoc">Khoa Học</option>
            <option value="kinh-di">Kinh Dị</option>
            <option value="am-nhac">Âm Nhạc</option>
            <option value="than-thoai">Thần Thoại</option>
            <option value="tai-lieu">Tài Liệu</option>
            <option value="gia-dinh">Gia Đình</option>
            <option value="chinh-kich">Chính Kịch</option>
            <option value="bi-an">Bí Ẩn</option>
            <option value="hoc-duong">Học Đường</option>
            <option value="kinh-dien">Kinh Điển</option>
          </select>
          
          <select
            onChange={(e) => updateFilter('country', e.target.value)}
            value={filters.country}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="">Quốc gia</option>
            <option value="trung-quoc">Trung Quốc</option>
            <option value="han-quoc">Hàn Quốc</option>
            <option value="nhat-ban">Nhật Bản</option>
            <option value="thai-lan">Thái Lan</option>
            <option value="au-my">Âu Mỹ</option>
            <option value="dai-loan">Đài Loan</option>
            <option value="hong-kong">Hồng Kông</option>
            <option value="an-do">Ấn Độ</option>
            <option value="viet-nam">Việt Nam</option>
          </select>
          
          <select
            onChange={(e) => updateFilter('year', e.target.value)}
            value={filters.year}
            className="bg-[#2a2c31] text-white px-3 py-2 rounded-lg w-full hover:bg-[#3a3c41] transition-colors"
          >
            <option value="">Năm</option>
            {Array.from({ length: 2025 - 1970 + 1 }, (_, i) => (
              <option key={i} value={2025 - i}>
                {2025 - i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <MovieCardGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie: MovieItem, index: number) => {
              const movieDetails = movieQueries[index]?.data;
              return (
                <Link 
                  key={movie._id} 
                  href={`/phim/${movie.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900">
                    <Image
                      src={getImageUrl(movie.thumb_url || movie.poster_url)}
                      alt={movie.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2">
                      {movieDetails?.movie?.episode_current && movieDetails.movie.type === 'series' && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
                          Tập {movieDetails.movie.episode_current.replace(/\/.*$/, '')}
                        </span>
                      )}
                      {movieDetails?.movie?.quality && (
                        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded">
                          {formatQuality(movieDetails.movie.quality)}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-2 text-white text-sm font-medium line-clamp-2 group-hover:text-yellow-500 transition-colors">
                    {movie.name}
                  </h3>
                </Link>
              );
            })}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
}