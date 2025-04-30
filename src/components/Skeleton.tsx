'use client'

// Skeleton cho MovieCard
export const MovieCardSkeleton = () => {
  return (
    <div className="block overflow-hidden rounded-lg">
      <div className="aspect-video max-h-40 sm:max-h-48 md:max-h-52 w-full bg-gray-700 animate-pulse rounded-md"></div>
      <div className="mt-2 px-1">
        <div className="h-4 bg-gray-700 animate-pulse rounded-md"></div>
        <div className="h-4 mt-1 bg-gray-700 animate-pulse rounded-md w-3/4"></div>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
  )
}

export function MovieCardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// Skeleton cho MovieDetail
export const MovieDetailSkeleton = () => {
  return (
    <div className="bg-[#0b0c0f] text-white">
      <div className="w-full h-[70vh] bg-gray-800 animate-pulse hidden md:block"></div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-12 lg:px-20 -mt-[150px] relative z-10">
        <div className="bg-[#1a1b1d]/95 backdrop-blur-md rounded-xl shadow-xl p-6 md:p-10 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <div className="w-full h-[350px] bg-gray-700 animate-pulse rounded-xl"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700 animate-pulse rounded-md w-3/4 mb-4"></div>
            <div className="flex flex-wrap gap-2 mb-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-6 w-16 bg-gray-700 animate-pulse rounded-full"></div>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-700 animate-pulse rounded-md w-full"></div>
              <div className="h-4 bg-gray-700 animate-pulse rounded-md w-full"></div>
              <div className="h-4 bg-gray-700 animate-pulse rounded-md w-3/4"></div>
            </div>
            <div className="h-12 bg-gray-700 animate-pulse rounded-full w-36"></div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-12 lg:px-20 py-12">
        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-gray-700 animate-pulse rounded-md w-24"></div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 animate-pulse rounded-lg w-28"></div>
            ))}
          </div>

          <div className="bg-[#1a1b1d] rounded-lg p-6">
            <div className="h-8 bg-gray-700 animate-pulse rounded-md w-32 mb-6"></div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {Array(20).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 animate-pulse rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton cho WatchDetail
export const WatchDetailSkeleton = () => {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pt-20">
      <div className="h-6 bg-gray-700 animate-pulse rounded-md w-64 mb-4"></div>

      <div className="w-full aspect-video bg-gray-800 animate-pulse rounded-xl overflow-hidden mb-6"></div>
      
      <div className="flex items-center space-x-4 mb-6 bg-[#1a1b1f] p-3 rounded-md">
        <div className="flex-1 flex items-center space-x-4">
          <div className="h-10 bg-gray-700 animate-pulse rounded-md w-24"></div>
          <div className="h-10 bg-gray-700 animate-pulse rounded-md w-24"></div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="h-10 bg-gray-700 animate-pulse rounded-md w-28"></div>
          <div className="h-10 bg-gray-700 animate-pulse rounded-md w-28"></div>
          <div className="h-10 bg-gray-700 animate-pulse rounded-md w-24"></div>
        </div>
      </div>

      <div className="text-white text-2xl font-bold mb-3">
        <div className="h-8 bg-gray-700 animate-pulse rounded-md w-64"></div>
      </div>
      <div className="mb-2">
        <div className="h-6 bg-gray-700 animate-pulse rounded-md w-16"></div>
      </div>

      <div className="mb-8">
        <div className="h-8 bg-gray-700 animate-pulse rounded-md w-36 mb-6"></div>
        <div className="flex flex-wrap gap-3">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 animate-pulse rounded-lg w-32"></div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="h-8 bg-gray-700 animate-pulse rounded-md w-36 mb-6"></div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array(20).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-gray-700 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export function MovieSliderSkeleton() {
  return (
    <div className="w-full h-[50vh] sm:h-[60vh] md:h-[65vh] lg:h-[80vh] xl:h-[90vh] bg-gray-800/50 animate-pulse">
      <div className="absolute bottom-0 left-0 w-full z-[5]">
        <div className="container mx-auto px-4 pb-10 sm:pb-14 md:pb-16 lg:pb-20">
          <div className="max-w-3xl">
            <div className="h-7 sm:h-8 md:h-10 bg-gray-700/50 w-3/4 rounded mb-3 sm:mb-4" />
            <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4">
              <div className="h-5 sm:h-6 bg-gray-700/50 w-12 sm:w-16 rounded" />
              <div className="h-5 sm:h-6 bg-gray-700/50 w-12 sm:w-16 rounded" />
              <div className="h-5 sm:h-6 bg-gray-700/50 w-12 sm:w-16 rounded" />
            </div>
            <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
              <div className="h-3 sm:h-4 bg-gray-700/50 w-full rounded" />
              <div className="h-3 sm:h-4 bg-gray-700/50 w-3/4 rounded" />
            </div>
            <div className="h-8 sm:h-10 bg-gray-700/50 w-24 sm:w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="my-4 sm:my-6 md:my-8">
      <div className="h-7 sm:h-8 bg-gray-800 w-32 sm:w-48 mb-4 rounded animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-800 aspect-[2/3] rounded-lg mb-2" />
            <div className="h-3 sm:h-4 bg-gray-800 rounded mb-1" />
            <div className="h-3 sm:h-4 bg-gray-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
} 