const API_URL = 'https://phimapi.com'

interface Movie {
  _id: string
  name: string
  thumb_url?: string
  poster_url?: string
  slug: string
  episode_current?: string
}

interface MovieResponse {
  items: Movie[]
  total: number
  page: number
  pages: number
}

interface MovieParams {
  page?: number
  limit?: number
}

export async function getMovies(type: string, params: MovieParams = {}): Promise<MovieResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  
  // Thêm phiên bản v3 cho endpoint phim-moi-cap-nhat
  const endpoint = type === 'phim-moi-cap-nhat' ? 'phim-moi-cap-nhat-v3' : type
  const url = `${API_URL}/danh-sach/${endpoint}?${searchParams.toString()}`
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600'
      },
      cache: 'force-cache'
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
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 0
    }
  } catch (error) {
    console.error('Error fetching movies:', error)
    return {
      items: [],
      total: 0,
      page: 1,
      pages: 0
    }
  }
} 