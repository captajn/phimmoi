"use client"

import React, { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Movie } from '@/types/movie'
import { MdPlayArrow } from 'react-icons/md'
import { getOptimizedImageUrl } from '@/utils/image'
import { useInView } from '@/utils/performance'

interface MovieCardProps {
  movie: Movie
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { ref, isInView } = useInView<HTMLDivElement>()

  // Tạo URL ảnh placeholder
  const placeholderUrl = '/assets/images/placeholder.jpg'
  const imageUrl = getOptimizedImageUrl(movie.thumb_url, 'small')

  return (
    <div ref={ref} className="group relative block overflow-hidden rounded-lg">
      <Link
        href={`/phim/${movie.slug}`}
        className="block aspect-[2/3] overflow-hidden rounded bg-black/20"
      >
        {isInView && (
          <div className="relative w-full h-full">
            <Image
              src={getOptimizedImageUrl(movie.thumb_url)}
              alt={movie.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition duration-300 group-hover:scale-110"
              priority={false}
            />
          </div>
        )}
      </Link>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 p-3 w-full flex justify-center">
          <MdPlayArrow className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="mt-2 px-1 text-center">
        <Link
          href={`/phim/${movie.slug}`}
          className="text-white font-semibold text-sm line-clamp-2 leading-snug"
        >
          {movie.name}
        </Link>
      </div>

      <div className="mt-1">
        <span className="text-xs text-white/60">
          {movie.year}
        </span>
      </div>
    </div>
  )
}

// Memo hóa component để tránh render lại không cần thiết
export default memo(MovieCard)
export { MovieCard }