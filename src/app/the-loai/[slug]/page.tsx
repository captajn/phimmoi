'use client'

import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/services/api'
import { MovieCard } from '@/components/MovieCard'
import { MovieCardGridSkeleton } from '@/components/Skeleton'
import type { Movie } from '@/types/movie'

interface PageProps {
  params: {
    slug: string
  }
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = params
  
  return (
    <Suspense fallback={<MovieCardGridSkeleton />}>
      <CategoryContent slug={slug} />
    </Suspense>
  )
}

function CategoryContent({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams?.get('page') ?? '1')
  const [filters, setFilters] = useState({
    year: searchParams?.get('year') ?? '',
    country: searchParams?.get('country') ?? '',
    sort_field: searchParams?.get('sort_field') ?? 'modified.time',
    sort_type: searchParams?.get('sort_type') ?? 'desc',
    sort_lang: searchParams?.get('sort_lang') ?? ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['moviesByCategory', slug, page, filters],
    queryFn: () =>
      api.getMoviesByCategory(slug, page, {
        ...filters,
        limit: 18
      }),
    enabled: !!slug
  })

  const movies = data?.data?.items || []
  const totalPages = data?.data?.params?.pagination?.totalPages || 1
  const categoryTitle = data?.data?.titlePage || slug

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set(key, value)
    params.set('page', '1')
    
    router.push(`/the-loai/${slug}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', newPage.toString())
    
    router.push(`/the-loai/${slug}?${params.toString()}`)
    
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderPagination = () => {
    const pagesToShow = []
    const maxButtons = 5
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

    if (page > 1) {
      pagesToShow.push(
        <button
          key="prev"
          onClick={() => handlePageChange(page - 1)}
          className="px-3 py-1 rounded bg-white/10 hover:bg-yellow-500 hover:text-black"
        >
          ‹
        </button>
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      pagesToShow.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            page === i ? "bg-yellow-500 text-black" : "bg-white/10 hover:bg-yellow-400 hover:text-black"
          }`}
        >
          {i}
        </button>
      )
    }

    if (page < totalPages) {
      pagesToShow.push(
        <button
          key="next"
          onClick={() => handlePageChange(page + 1)}
          className="px-3 py-1 rounded bg-white/10 hover:bg-yellow-500 hover:text-black"
        >
          ›
        </button>
      )
    }

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-10 text-white">
        {pagesToShow}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-[72px]">
      <h1 className="text-2xl font-bold text-white mb-6">
        Thể loại: {categoryTitle}
      </h1>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2 mb-6 text-sm text-white">
        <select
          onChange={(e) => updateFilter('year', e.target.value)}
          value={filters.year}
          className="bg-black/40 px-3 py-2 rounded"
        >
          <option value="">Năm</option>
          {Array.from({ length: 2025 - 1970 + 1 }, (_, i) => (
            <option key={i} value={2025 - i}>
              {2025 - i}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => updateFilter('sort_lang', e.target.value)}
          value={filters.sort_lang}
          className="bg-black/40 px-3 py-2 rounded"
        >
          <option value="">Ngôn ngữ</option>
          <option value="vietsub">Vietsub</option>
          <option value="thuyet-minh">Thuyết minh</option>
          <option value="long-tieng">Lồng tiếng</option>
        </select>
        <select
          onChange={(e) => updateFilter('country', e.target.value)}
          value={filters.country}
          className="bg-black/40 px-3 py-2 rounded"
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
        <MovieCardGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((movie: Movie) => {
              const rawImg = movie.thumb_url || movie.poster_url || ''
              const imgUrl = rawImg.startsWith('/')
                ? 'https://phimimg.com' + rawImg
                : 'https://phimimg.com/' + rawImg
              return <MovieCard key={movie._id} movie={{ ...movie, thumb_url: imgUrl }} />
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  )
} 