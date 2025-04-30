export interface Movie {
  _id: string
  name: string
  thumb_url?: string
  poster_url?: string
  slug: string
  content?: string
  year?: number
  quality?: string
  lang?: string
  time?: string
  episode_current?: string
}

export interface MovieDetail extends Movie {
  category: Array<{ name: string }>
  country: Array<{ name: string }>
  year: number
  content: string
  status: string
  type: string
  imdb: string | { rating: string }
  trailer_url?: string
  episodes?: Array<{
    name: string
    slug: string
    filename: string
  }>
} 