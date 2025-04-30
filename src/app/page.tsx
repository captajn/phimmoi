export const runtime = 'edge'
export const revalidate = 3600 // revalidate every hour

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
    const data = await getMovies('phim-moi-cap-nhat-v3', { page: 1 })
    return data
  } catch (error) {
    console.error('Error fetching initial movies:', error)
    return { items: [] }
  }
}

export default async function Home() {
  const initialMovies = await getInitialMovies()

  return (
    <div className="w-full min-h-screen text-white">
      <div className="w-full">
        <Suspense fallback={<MovieSliderSkeleton />}>
          <MovieSlider movies={initialMovies.items} />
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