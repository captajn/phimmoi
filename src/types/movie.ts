export interface Movie {
  _id: string;
  name: string;
  origin_name?: string;
  slug: string;
  thumb_url?: string;
  poster_url?: string;
  type?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  year?: number;
  time?: string;
  content?: string;
  category?: string[];
  country?: string[];
  chieurap?: boolean;
  status?: string;
  episode_total?: string;
  view?: number;
}

export interface MovieResponse {
  items: Movie[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}