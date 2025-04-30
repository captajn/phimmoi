import { QueryClient } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from '../services/api';

// Cấu hình QueryClient tối ưu
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
        staleTime: 5 * 60 * 1000 // 5 phút
      },
      mutations: {
        retry: 2,
        retryDelay: 1000,
      }
    },
  });
}

// Hàm để chuẩn bị prefetch dữ liệu quan trọng
export async function prefetchImportantData(queryClient: QueryClient) {
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: ['latestMovies'],
      queryFn: () => import('../services/api').then(module => module.api.getLatestMovies(1)),
      staleTime: 10 * 60 * 1000,
    }),
    
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => import('../services/api').then(module => module.api.getCategories()),
      staleTime: 24 * 60 * 60 * 1000,
    }),
    
    queryClient.prefetchQuery({
      queryKey: ['countries'],
      queryFn: () => import('../services/api').then(module => module.api.getCountries()),
      staleTime: 24 * 60 * 60 * 1000,
    }),
  ];
  
  try {
    await Promise.all(prefetchPromises);
  } catch (error) {
    console.error('Lỗi khi prefetch dữ liệu:', error);
  }
}

// Hàm tối ưu loader priority
export function optimizeInitialLoad() {
  if (typeof document !== 'undefined') {
    const adjustScriptPriority = () => {
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        if ((script as HTMLScriptElement).src.includes('chunk')) {
          script.setAttribute('fetchpriority', 'low');
          script.setAttribute('async', 'true');
        }
      });
    };

    if (document.readyState === 'complete') {
      adjustScriptPriority();
    } else {
      window.addEventListener('load', adjustScriptPriority);
    }
    
    const prefetchImportantRoutes = () => {
      const routes = ['/', '/danh-sach/phim-moi-cap-nhat', '/tim-kiem'];
      routes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
      });
    };
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => prefetchImportantRoutes());
    } else {
      setTimeout(prefetchImportantRoutes, 2000);
    }
  }
}

// Luôn trả về false để ẩn DevTools
export const isDevelopment = false; 