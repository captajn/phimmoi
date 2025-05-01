const API_URL = 'https://phimapi.com'

interface Movie {
  _id: string
  name: string
  thumb_url?: string
  poster_url?: string
  slug: string
  episode_current?: string
}

interface MovieParams {
  page?: number
  limit?: number
}

// Sửa lại MovieResponse để tương thích với định nghĩa từ types/movie.ts
export async function getMovies(type: string, params: MovieParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  
  // Thêm phiên bản v3 cho endpoint phim-moi-cap-nhat
  const endpoint = type === 'phim-moi-cap-nhat' ? 'phim-moi-cap-nhat-v3' : type
  const url = `${API_URL}/danh-sach/${endpoint}?${searchParams.toString()}`
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Giảm thời gian revalidate xuống để thử nghiệm
      headers: {
        'Content-Type': 'application/json',
      },
      // Để Next.js tự xử lý việc caching và stale-while-revalidate
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch movies: ${res.status} ${res.statusText}`)
    }
    
    const data = await res.json()
    
    // Validate data structure
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Invalid API response format')
    }
    
    return {
      items: data.items.map((item: Movie) => ({
        ...item,
        thumb_url: item.thumb_url || '',
        poster_url: item.poster_url || ''
      })),
      totalItems: data.total || 0,
      currentPage: data.page || 1,
      totalPages: data.pages || 0
    }
  } catch (error) {
    console.error('Error fetching movies:', error)
    return {
      items: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 0
    }
  }
} 