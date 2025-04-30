import { Suspense } from 'react'
import { MovieList } from '@/components/MovieList'
import { MovieCardGridSkeleton } from '@/components/Skeleton'

export default function MovieListPage() {
  return (
    <Suspense fallback={<MovieCardGridSkeleton />}>
      <MovieList />
    </Suspense>
  )
} 