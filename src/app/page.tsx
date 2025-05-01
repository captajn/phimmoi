// export const runtime = 'edge'
export const revalidate = 60 // revalidate mỗi phút thay vì mỗi giờ

import { Suspense } from 'react'
import { MovieSlider } from '@/components/MovieSlider'
import { LatestMoviesSection } from '@/components/LatestMoviesSection'
import { MovieSection } from '@/components/MovieSection'
import { AnimeSection } from '@/components/AnimeSection'
import { VietnameseMoviesSection } from '@/components/VietnameseMoviesSection'
import { PhimBoSection } from '@/components/PhimBoSection'
import { ThuyetMinhSection } from '@/components/ThuyetMinhSection'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { MovieSliderSkeleton, SectionSkeleton } from '@/components/Skeleton'
import { getMovies } from '@/services/movies'

async function getInitialMovies() {
  try {
    // Không sử dụng AbortController vì có thể không tương thích với ISR
    const data = await getMovies('phim-moi-cap-nhat-v3', { page: 1 });
    
    // Kiểm tra dữ liệu trả về có hợp lệ hay không
    if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.warn('API không trả về dữ liệu phim hợp lệ');
      return { 
        items: [], 
        totalItems: 0, 
        currentPage: 1, 
        totalPages: 0 
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching initial movies:', error)
    // Trả về mảng rỗng nhưng có cấu trúc đúng để component không bị lỗi
    return { 
      items: [], 
      totalItems: 0, 
      currentPage: 1, 
      totalPages: 0 
    };
  }
}

export default async function Home() {
  const initialMovies = await getInitialMovies()
  const hasMovies = initialMovies.items && initialMovies.items.length > 0;

  return (
    <div className="w-full min-h-screen text-white">
      <div className="w-full">
        <Suspense fallback={<MovieSliderSkeleton />}>
          {hasMovies ? (
            <MovieSlider movies={initialMovies.items} />
          ) : (
            <div className="w-full h-[50vh] sm:h-[60vh] md:h-[65vh] bg-gray-900 flex items-center justify-center">
              <div className="text-center p-4">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Đang tải dữ liệu phim</h2>
                <p className="text-gray-400 mb-6">Hệ thống đang xử lý dữ liệu phim, vui lòng đợi trong giây lát</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          )}
        </Suspense>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12">
        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <LatestMoviesSection />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <MovieSection 
              title="Phim Hàn Quốc"
              apiSlug="han-quoc"
              colorClass="text-blue-400"
            />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <MovieSection
              title="Phim Trung Quốc"
              apiSlug="trung-quoc" 
              colorClass="text-yellow-400"
            />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <MovieSection
              title="Phim Âu Mỹ"
              apiSlug="au-my"
              colorClass="text-red-400" 
            />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <AnimeSection />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <VietnameseMoviesSection />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <PhimBoSection
              title="Phim Bộ Mới"
              typeList="phim-bo"
              sortField="modified.time"
              sortType="desc"
              limit={12}
            />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <Suspense fallback={<SectionSkeleton />}>
            <ThuyetMinhSection />
          </Suspense>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
} 