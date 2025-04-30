export interface MovieEpisode {
  name: string;
  slug: string;
  link_m3u8: string;
}

export interface MovieEpisodeResponse {
  success: boolean;
  data: MovieEpisode;
  message?: string;
} 