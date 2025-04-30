import axios from 'axios';
import { MovieResponse } from '../types/movie';
import { MovieEpisodeResponse } from '../types/types';

const BASE_URL = 'https://phimapi.com';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_CACHE_TIME = 30 * 60 * 1000;

interface FilterParams {
  page?: number;                  // Số trang cần truy xuất, sử dụng [totalPages] để biết tổng trang khả dụng
  sort_field?: string;            // modified.time: thời gian cập nhật, _id: ID của phim, year: năm phát hành
  sort_type?: string;             // desc hoặc asc
  sort_lang?: string;             // vietsub, thuyet-minh, long-tieng
  category?: string;              // Thể loại phim, lấy slug từ API /the-loai
  country?: string;               // Quốc gia phim, lấy slug từ API /quoc-gia
  year?: string;                  // Năm phát hành của phim (1970 - hiện tại)
  limit?: string | number;        // Giới hạn kết quả (tối đa 64)
}

interface ServerData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface Episode {
  server_name: string;
  server_data: ServerData[];
}

interface MovieApiResponse {
  status: boolean;
  msg: string;
  episodes: Episode[];
}

interface CacheItem {
  data: any;
  timestamp: number;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Thời gian cache (5 phút)
const CACHE_TTL = 5 * 60 * 1000;

// Cache cho từng loại request
const cacheStore: Record<string, CacheItem> = {};

// Hàm tạo khóa cache từ URL và tham số
const createCacheKey = (endpoint: string, params: any = {}): string => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

// Hàm kiểm tra và lấy từ cache
const getFromCache = (key: string): any | null => {
  const now = Date.now();
  const cachedItem = cacheStore[key];
  
  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    console.log(`Sử dụng cache cho ${key}`);
    return cachedItem.data;
  }
  
  return null;
};

// Hàm lưu vào cache
const saveToCache = (key: string, data: any): void => {
  cacheStore[key] = {
    data,
    timestamp: Date.now()
  };
};

// Cache cũ (để duy trì khả năng tương thích)
let latestMoviesCache: { data: MovieResponse | null, timestamp: number } = { 
  data: null, 
  timestamp: 0 
};

// Hàm chuẩn hóa text để dễ dàng so sánh
function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const api = {
  getLatestMovies: async (page: number = 1): Promise<MovieResponse> => {
    try {
      const cacheKey = createCacheKey('/danh-sach/phim-moi-cap-nhat-v3', { page });
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;

      console.log('Fetch dữ liệu mới từ API: latest movies');
      const response = await apiClient.get('/danh-sach/phim-moi-cap-nhat-v3', {
        params: { page }
      });
      
      // Lưu vào cache mới
      saveToCache(cacheKey, response.data);
      
      // Cập nhật cache cũ (để duy trì khả năng tương thích)
      latestMoviesCache = {
        data: response.data,
        timestamp: Date.now()
      };
      
      return response.data;
    } catch (err) {
      console.error("Lỗi getLatestMovies:", err);
      // Trả về cache cũ nếu có lỗi và có cache
      if (latestMoviesCache.data) {
        console.log('Sử dụng cache cũ do API lỗi');
        return latestMoviesCache.data;
      }
      throw err;
    }
  },

  getMovieDetail: async (slug: string) => {
    try {
      const cacheKey = createCacheKey(`/phim/${slug}`);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      const response = await apiClient.get(`/phim/${slug}`);
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getMovieDetail:", err);
      throw err;
    }
  },

  searchMovies: async (keyword: string, page: number = 1, options = {}) => {
    try {
      const params = { keyword, page, ...options };
      const cacheKey = createCacheKey('/v1/api/tim-kiem', params);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      const response = await apiClient.get('/v1/api/tim-kiem', { params });
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi searchMovies:", err);
      throw err;
    }
  },

  getMoviesByType: async (type: string, page: number = 1, params: FilterParams = {}) => {
    // type_list có thể là: phim-bo, phim-le, tv-shows, hoat-hinh, phim-vietsub, phim-thuyet-minh, phim-long-tieng
    try {
      const allParams = { page, ...params };
      const cacheKey = createCacheKey(`/v1/api/danh-sach/${type}`, allParams);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      console.log(`Fetch dữ liệu mới từ API: danh sách ${type}`);
      const response = await apiClient.get(`/v1/api/danh-sach/${type}`, {
        params: allParams
      });
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getMoviesByType:", err);
      throw err;
    }
  },

  getMoviesByCategory: async (slug: string, page: number = 1, params: FilterParams = {}) => {
    try {
      const allParams = { page, ...params };
      const cacheKey = createCacheKey(`/v1/api/the-loai/${slug}`, allParams);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      console.log(`Fetch dữ liệu mới từ API: thể loại ${slug}`);
      const response = await apiClient.get(`/v1/api/the-loai/${slug}`, {
        params: allParams
      });
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getMoviesByCategory:", err);
      throw err;
    }
  },

  getMoviesByCountry: async (slug: string, page: number = 1, params: FilterParams = {}) => {
    try {
      const allParams = { page, ...params };
      const cacheKey = createCacheKey(`/v1/api/quoc-gia/${slug}`, allParams);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      console.log(`Fetch dữ liệu mới từ API: quốc gia ${slug}`);
      const response = await apiClient.get(`/v1/api/quoc-gia/${slug}`, {
        params: allParams
      });
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getMoviesByCountry:", err);
      throw err;
    }
  },
  
  getMoviesByYear: async (year: string, page: number = 1, params: FilterParams = {}) => {
    try {
      const allParams = { page, ...params };
      const cacheKey = createCacheKey(`/v1/api/nam/${year}`, allParams);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      console.log(`Fetch dữ liệu mới từ API: năm ${year}`);
      const response = await apiClient.get(`/v1/api/nam/${year}`, {
        params: allParams
      });
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getMoviesByYear:", err);
      throw err;
    }
  },

  getCategories: async () => {
    try {
      const cacheKey = createCacheKey('/the-loai');
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      const response = await apiClient.get('/the-loai');
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getCategories:", err);
      throw err;
    }
  },

  getCountries: async () => {
    try {
      const cacheKey = createCacheKey('/quoc-gia');
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) return cachedData;
      
      const response = await apiClient.get('/quoc-gia');
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      console.error("Lỗi getCountries:", err);
      throw err;
    }
  },

  getSeriesMovies: async (page: number = 1, limit: number = 12) => {
    try {
      // Sử dụng endpoint /v1/api/danh-sach/phim-bo để lấy danh sách phim bộ
      const response = await apiClient.get('/v1/api/danh-sach/phim-bo', {
        params: {
          page,
          limit,
          sort_field: 'modified.time',
          sort_type: 'desc'
        }
      });
      return response.data;
    } catch (err) {
      console.error("Lỗi getSeriesMovies:", err);
      throw err;
    }
  },

  getVietnameseMovies: async (page: number = 1, limit: number = 12) => {
    try {
      const response = await apiClient.get('/v1/api/quoc-gia/viet-nam', {
        params: { page, limit }
      });
      return response.data;
    } catch (err) {
      console.error("Lỗi getVietnameseMovies:", err);
      throw err;
    }
  },

  getMovieEpisode: async (slug: string, server: string, tap: string): Promise<MovieEpisodeResponse> => {
    try {
      // Lấy thông tin chi tiết phim
      const movieDetail = await api.getMovieDetail(slug);
      const episodes = movieDetail.episodes || [];
      
      // Map các slug server có thể đến các tên server thực tế
      const serverMap: Record<string, string> = {
        'vietsub': 'VietSub',
        'thuyet-minh': 'Thuyết Minh',
        'long-tieng': 'Lồng Tiếng'
      };
      
      // Tìm server tương ứng
      let serverName = serverMap[server] || server;
      let serverData = episodes.find((e: any) => 
        normalizeText(e.server_name).includes(normalizeText(serverName))
      );
      
      // Nếu không tìm thấy server, thử tìm server phù hợp với loại phim
      if (!serverData) {
        // Nếu tìm thuyết minh mà không có, thử sử dụng lồng tiếng
        if (server === 'thuyet-minh') {
          serverData = episodes.find((e: any) => 
            e.server_name.toLowerCase().includes('lồng tiếng') || 
            e.server_name.toLowerCase().includes('long tieng')
          );
        }
        // Nếu không tìm thấy, lấy server đầu tiên
        if (!serverData && episodes.length > 0) {
          serverData = episodes[0];
        }
      }
      
      if (!serverData) {
        throw new Error(`Không tìm thấy server ${server}`);
      }
      
      // Tìm tập phim
      const episode = serverData.server_data.find((e: any) => e.slug === tap);
      
      if (!episode) {
        throw new Error(`Không tìm thấy tập ${tap}`);
      }
      
      return {
        success: true,
        data: {
          name: episode.name,
          slug: episode.slug,
          link_m3u8: episode.link_m3u8
        }
      };
    } catch (err) {
      console.error("Lỗi getMovieEpisode:", err);
      throw err;
    }
  }
};

export { api, DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME };