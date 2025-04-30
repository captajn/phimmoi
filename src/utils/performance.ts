import { useEffect, useState, useRef } from 'react';
import { QueryClient } from '@tanstack/react-query';

interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0,
        root: options.root || null
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [options.rootMargin, options.threshold, options.root]);

  return { ref: elementRef, isInView };
}

// Sử dụng requestIdleCallback để thực hiện các tác vụ không quan trọng khi trình duyệt rảnh
export const scheduleIdleTask = (callback: () => void, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    // Fallback nếu không có requestIdleCallback
    setTimeout(callback, 1);
  }
};

// Hủy một tác vụ idle đã được lên lịch
export const cancelIdleTask = (id: number) => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Tối ưu prefetching data
export const prefetchData = async (url: string) => {
  // Tạo link preload 
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};

// Xử lý việc debounce các sự kiện như scroll, resize
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

// Giảm số lần render không cần thiết
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Kiểu dữ liệu cho Web Vitals metric
 */
interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta?: number;
  entries: PerformanceEntry[];
}

/**
 * ServiceWorkerRegistration với SyncManager
 */
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

/**
 * Đăng ký service worker
 * @returns Promise<void>
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      }) as ExtendedServiceWorkerRegistration;
      
      console.log('Service Worker đã đăng ký thành công:', registration.scope);
      
      // Đăng ký sync để đồng bộ dữ liệu khi online
      if (registration.sync) {
        registration.sync.register('sync-data');
      }
    } catch (error) {
      console.error('Đăng ký Service Worker thất bại:', error);
    }
  }
};

/**
 * Update Service Worker khi có phiên bản mới
 */
export const updateServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.update();
      console.log('Service Worker đã được cập nhật');
    } catch (error) {
      console.error('Cập nhật Service Worker thất bại:', error);
    }
  }
};

// Hook kiểm tra trạng thái kết nối internet
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

/**
 * Lưu vị trí cuộn trang trước khi tải lại
 */
export const saveScrollPosition = (): void => {
  // Lưu vị trí cuộn và đường dẫn hiện tại
  sessionStorage.setItem('scrollPosition', window.scrollY.toString());
  sessionStorage.setItem('currentPath', window.location.pathname);
};

/**
 * Khôi phục vị trí cuộn sau khi tải lại trang
 */
export const restoreScrollPosition = (): void => {
  const savedPath = sessionStorage.getItem('currentPath');
  const scrollPosition = sessionStorage.getItem('scrollPosition');
  
  // Chỉ khôi phục khi cùng trang
  if (savedPath === window.location.pathname && scrollPosition) {
    // Sử dụng setTimeout để đảm bảo DOM đã được hiển thị
    setTimeout(() => {
      window.scrollTo({
        top: parseInt(scrollPosition),
        behavior: 'auto'
      });
    }, 100);
  }
};

/**
 * Thiết lập lazy loading cho hình ảnh
 */
export const setupImageLazyLoading = (): void => {
  // Kiểm tra browser có hỗ trợ Intersection Observer API không
  if ('IntersectionObserver' in window) {
    // Tạo Intersection Observer để theo dõi các hình ảnh
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // Nạp trước hình ảnh khi chúng còn cách 50px
      threshold: 0.01 // Kích hoạt khi 1% hình ảnh hiển thị
    });
    
    // Tìm và theo dõi tất cả hình ảnh có thuộc tính data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
    
    // Thiết lập MutationObserver để theo dõi các hình ảnh mới được thêm vào DOM
    const mutationCallback = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              const element = node as Element;
              if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
                imageObserver.observe(element);
              } else {
                element.querySelectorAll('img[data-src]').forEach(img => {
                  imageObserver.observe(img);
                });
              }
            }
          });
        }
      }
    };
    
    const observer = new MutationObserver(mutationCallback);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Thiết lập native lazy loading cho các trình duyệt hỗ trợ
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
  } else {
    // Fallback cho trình duyệt không hỗ trợ Intersection Observer
    const lazyLoadThrottleTimeout: number | null = null;
    
    const lazyLoad = () => {
      if (lazyLoadThrottleTimeout) {
        clearTimeout(lazyLoadThrottleTimeout);
      }
      
      const windowHeight = window.innerHeight;
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        const imgElement = img as HTMLImageElement;
        const rect = imgElement.getBoundingClientRect();
        
        if (rect.top <= windowHeight + 100 && rect.bottom >= -100) {
          if (imgElement.dataset.src) {
            imgElement.src = imgElement.dataset.src;
            if (imgElement.dataset.srcset) {
              imgElement.srcset = imgElement.dataset.srcset;
            }
            imgElement.classList.add('loaded');
            imgElement.removeAttribute('data-src');
            imgElement.removeAttribute('data-srcset');
          }
        }
      });
    };
    
    // Sửa lỗi kiểu dữ liệu window
    const win = window as Window;
    win.addEventListener('scroll', lazyLoad);
    win.addEventListener('resize', lazyLoad);
    win.addEventListener('orientationchange', lazyLoad);
    lazyLoad(); // Kiểm tra ngay khi trang tải
  }
};

/**
 * Báo cáo các chỉ số Web Vitals
 * @param {WebVitalsMetric} metric Chỉ số hiệu suất web
 */
export const reportWebVitals = (metric: WebVitalsMetric): void => {
  // Các chỉ số quan trọng
  const vitalsToReport = [
    'FID', // First Input Delay
    'LCP', // Largest Contentful Paint
    'CLS', // Cumulative Layout Shift
    'FCP', // First Contentful Paint
    'TTFB' // Time to First Byte
  ];

  if (vitalsToReport.includes(metric.name)) {
    // Ghi log hiện tại (có thể thay bằng analytics trong môi trường production)
    console.log(`${metric.name}: ${metric.value}`);
    
    // Gửi dữ liệu tới phân tích (Analytics)
    // Ví dụ nếu sử dụng Google Analytics:
    // if (window.gtag) {
    //   window.gtag('event', 'web_vitals', {
    //     event_category: 'Web Vitals',
    //     event_action: metric.name,
    //     event_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //     event_label: metric.id,
    //     non_interaction: true,
    //   });
    // }
  }
};

// Kỹ thuật prefetch dữ liệu quan trọng trước khi cần
export const prefetchCriticalData = (urls: string[]) => {
  // Sử dụng Promise.all để tải song song
  Promise.all(
    urls.map(url => 
      fetch(url, { 
        method: 'GET',
        priority: 'high',
        cache: 'force-cache'
      }).catch(() => {
        // Bỏ qua lỗi, không làm gián đoạn tiến trình
        console.error(`Failed to prefetch: ${url}`);
      })
    )
  );
};

// Constant cho việc cache
export const CACHE_TIME = 1000 * 60 * 10; // 10 phút
export const STALE_TIME = 1000 * 60 * 5; // 5 phút
export const CACHE_PREFIX = 'app_cache_';

/**
 * Khởi tạo các tối ưu hiệu suất khi ứng dụng được tải
 */
export function initializePerformanceOptimizations(): void {
  // Đăng ký các event listeners
  setupPerformanceListeners();

  // Cải thiện thời gian phản hồi cho người dùng
  initUserTimingAPI();
  
  // Thiết lập debounce và throttle cho các sự kiện quá tải
  setupEventThrottling();
  
  // Cải thiện quá trình lazy loading
  setupLazyLoading();
  
  // Thiết lập cache cho dữ liệu API
  setupAPICache();
  
  // Cache phản hồi trình duyệt khi F5
  setupF5Optimization();
  
  // Theo dõi hiệu suất
  initPerformanceTracking();
}

/**
 * Khởi tạo Performance Timing API để theo dõi các mốc thời gian quan trọng
 */
function initUserTimingAPI(): void {
  if (typeof window !== 'undefined' && window.performance) {
    const { performance } = window;
    
    // Đánh dấu thời điểm bắt đầu ứng dụng
    performance.mark('app_init_start');
    
    // Thiết lập các observers theo dõi hiệu suất DOM
    setupPerformanceObservers();
    
    // Đo thời gian tải trang
    window.addEventListener('load', () => {
      performance.mark('app_loaded');
      performance.measure('app_load_time', 'app_init_start', 'app_loaded');
      
      const loadTime = performance.getEntriesByName('app_load_time')[0];
      console.log(`Thời gian tải trang: ${loadTime.duration.toFixed(2)}ms`);
    });
  }
}

interface PerformanceEntryWithStart extends PerformanceEntry {
  startTime: number;
}

interface FirstInputEntry extends PerformanceEntryWithStart {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntryWithStart {
  value: number;
  hadRecentInput: boolean;
}

/**
 * Thiết lập Performance Observers để theo dõi các chỉ số hiệu suất quan trọng
 */
function setupPerformanceObservers(): void {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Theo dõi Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceEntryWithStart[];
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Theo dõi First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as FirstInputEntry[];
        for (const entry of entries) {
          const delay = entry.processingStart - entry.startTime;
          console.log('FID:', delay);
        }
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
      
      // Theo dõi Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsEntries: LayoutShiftEntry[] = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as LayoutShiftEntry[];
        
        for (const entry of entries) {
          // Chỉ tính CLS nếu không phải do user interaction
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        
        console.log('Current CLS:', clsValue);
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
    } catch (e) {
      console.error('Lỗi khi thiết lập PerformanceObserver:', e);
    }
  }
}

/**
 * Thiết lập các event listener để theo dõi và cải thiện hiệu suất
 */
function setupPerformanceListeners(): void {
  if (typeof window !== 'undefined') {
    // Theo dõi khi nào DOM đã sẵn sàng
    document.addEventListener('DOMContentLoaded', () => {
      window.performance.mark('dom_ready');
    });
    
    // Ẩn skeleton screens khi nội dung đã hiển thị
    requestAnimationFrame(() => {
      const loaders = document.querySelectorAll('.skeleton-loader');
      loaders.forEach(loader => {
        (loader as HTMLElement).style.display = 'none';
      });
    });
    
    // Sử dụng requestIdleCallback để xử lý tác vụ không cấp bách
    if ('requestIdleCallback' in window) {
      // Các tác vụ không quan trọng có thể được thực hiện trong thời gian nhàn rỗi
      (window as Window & typeof globalThis).requestIdleCallback(() => {
        prefetchResources();
      }, { timeout: 2000 });
    } else {
      // Fallback nếu không có requestIdleCallback
      setTimeout(() => {
        prefetchResources();
      }, 1000);
    }
  }
}

/**
 * Prefetch các tài nguyên quan trọng nhưng không cấp bách
 */
function prefetchResources(): void {
  // Danh sách các routes cần prefetch
  const routesToPrefetch = [
    '/browse',
    '/latest'
  ];
  
  // Danh sách API cần prefetch
  const apiToPrefetch = [
    'https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1',
    'https://phimapi.com/v1/api/danh-sach/phim-le?page=1',
    'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1'
  ];
  
  // Tạo link prefetch cho routes
  routesToPrefetch.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
  
  // Prefetch dữ liệu API quan trọng
  if ('caches' in window) {
    caches.open('api-cache').then(cache => {
      apiToPrefetch.forEach(url => {
        fetch(url, { method: 'GET', mode: 'cors' })
          .then(response => {
            cache.put(url, response.clone());
            return response.json();
          })
          .catch(error => console.warn(`Lỗi prefetch API ${url}:`, error));
      });
    });
  }
}

/**
 * Thiết lập throttle cho các sự kiện thường xuyên xảy ra
 */
function setupEventThrottling(): void {
  if (typeof window !== 'undefined') {
    // Throttle scroll events
    const throttleTime = 100; // 100ms
    let lastScrollTime = 0;
    
    const originalScrollHandler = window.onscroll;
    window.onscroll = function(e) {
      const now = Date.now();
      
      if (now - lastScrollTime >= throttleTime) {
        lastScrollTime = now;
        
        // Gọi handler gốc nếu tồn tại
        if (typeof originalScrollHandler === 'function') {
          originalScrollHandler.call(window, e);
        }
      }
    };
    
    // Debounce resize events
    let resizeTimeout: number | null = null;
    const originalResizeHandler = window.onresize;
    
    window.onresize = function(e) {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = window.setTimeout(() => {
        // Gọi handler gốc nếu tồn tại
        if (typeof originalResizeHandler === 'function') {
          originalResizeHandler.call(window, e);
        }
        
        // Thực hiện các tác vụ phụ thuộc vào kích thước
        handleViewportChange();
      }, 150) as unknown as number;
    };
  }
}

/**
 * Xử lý thay đổi viewport
 */
function handleViewportChange(): void {
  // Xóa biến sliders vì không được sử dụng
  
  // Tải lại ảnh với kích thước phù hợp
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      // Thêm breakpoint vào URL ảnh nếu cần
      const viewportWidth = window.innerWidth;
      let imgSize = 'md';
      
      if (viewportWidth < 768) {
        imgSize = 'sm';
      } else if (viewportWidth > 1440) {
        imgSize = 'lg';
      }
      
      // Cập nhật src với kích thước phù hợp
      const newSrc = dataSrc.replace('{size}', imgSize);
      img.setAttribute('src', newSrc);
    }
  });
}

/**
 * Thiết lập lazy loading cho ảnh và các component
 */
function setupLazyLoading(): void {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    // Tạo observer cho lazy loading ảnh
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.getAttribute('data-src');
          
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            observer.unobserve(img);
            
            // Thêm fade-in animation
            img.style.opacity = '0';
            img.onload = () => {
              img.style.transition = 'opacity 0.3s ease-in';
              img.style.opacity = '1';
            };
          }
        }
      });
    }, {
      rootMargin: '200px 0px', // Tải trước khi phần tử cách viewport 200px
      threshold: 0.01
    });
    
    // Đăng ký lazy loading cho tất cả ảnh có data-src
    document.addEventListener('DOMContentLoaded', () => {
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    });
    
    // Lazy load components khi scroll
    const componentObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const component = entry.target;
          
          // Kích hoạt tải component
          component.dispatchEvent(new CustomEvent('loadComponent'));
          observer.unobserve(component);
        }
      });
    }, {
      rootMargin: '400px 0px', // Tải component trước khi nó cách viewport 400px
      threshold: 0
    });
    
    // Đăng ký lazy loading cho components
    document.addEventListener('DOMContentLoaded', () => {
      const lazyComponents = document.querySelectorAll('[data-lazy-component]');
      lazyComponents.forEach(component => {
        componentObserver.observe(component);
      });
    });
    
    // Quản lý lazy loading khi scroll
    let lazyLoadThrottleTimeout: number | null = null;
    
    // Cập nhật ảnh khi scroll
    function lazyLoadImages() {
      if (lazyLoadThrottleTimeout) {
        clearTimeout(lazyLoadThrottleTimeout);
      }
      
      // Throttle function để tránh gọi quá nhiều
      lazyLoadThrottleTimeout = window.setTimeout(() => {
        // Không cần biến scrollTop
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        lazyImages.forEach(img => {
          const rect = img.getBoundingClientRect();
          
          // Tải ảnh khi nó gần đến viewport
          if (rect.top - window.innerHeight < 200) {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              (img as HTMLImageElement).src = dataSrc;
              img.removeAttribute('data-src');
            }
          }
        });
      }, 20) as unknown as number;
    }
    
    // Thêm event listeners cho scroll, resize và thay đổi orientation
    window.addEventListener('scroll', lazyLoadImages);
    window.addEventListener('resize', lazyLoadImages);
    window.addEventListener('orientationchange', lazyLoadImages);
  } else {
    // Fallback cho trình duyệt không hỗ trợ IntersectionObserver
    function lazyLoadFallback() {
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          (img as HTMLImageElement).src = dataSrc;
          img.removeAttribute('data-src');
        }
      });
    }
    
    // Chạy lazy load sau khi trang đã load
    if (typeof window !== 'undefined') {
      (window as Window & typeof globalThis).addEventListener('load', lazyLoadFallback);
    }
  }
}

/**
 * Thiết lập cache cho API calls
 */
function setupAPICache(): void {
  if (typeof window !== 'undefined') {
    // Không cần làm gì nếu service worker đã hoạt động
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      console.log('Service Worker đã kích hoạt, sử dụng cache từ SW');
      return;
    }
    
    // Cache trong memory cho session hiện tại
    const apiCache = new Map();
    
    // Override fetch API để thêm cache
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Chỉ cache GET requests
      if (!init || init.method === 'GET' || !init.method) {
        // Kiểm tra cache trước
        const cacheKey = url;
        
        if (apiCache.has(cacheKey)) {
          const cachedData = apiCache.get(cacheKey);
          const now = Date.now();
          
          // Sử dụng cache nếu chưa hết hạn
          if (now - cachedData.timestamp < CACHE_TIME) {
            console.log(`[Cache hit] ${url}`);
            
            // Clone response để trả về
            return Promise.resolve(new Response(JSON.stringify(cachedData.data), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          } else {
            // Xóa cache đã hết hạn
            apiCache.delete(cacheKey);
          }
        }
        
        // Xử lý các request không có trong cache
        return originalFetch.apply(window, [input, init])
          .then(response => {
            // Cache chỉ áp dụng nếu response thành công
            if (response.ok) {
              // Clone response 
              const responseClone = response.clone();
              
              responseClone.json().then(data => {
                // Lưu vào cache
                apiCache.set(cacheKey, {
                  data,
                  timestamp: Date.now()
                });
                
                // Lưu vào localStorage nếu cần
                try {
                  localStorage.setItem(
                    `${CACHE_PREFIX}${cacheKey}`,
                    JSON.stringify({
                      data,
                      timestamp: Date.now()
                    })
                  );
                } catch (e) {
                  console.warn('Không thể lưu vào localStorage:', e);
                }
              });
            }
            
            return response;
          });
      }
      
      // Không cache các request không phải GET
      return originalFetch.apply(window, [input, init]);
    };
    
    // Khôi phục cache từ localStorage
    try {
      const cacheKeys = Object.keys(localStorage).filter(
        key => key.startsWith(CACHE_PREFIX)
      );
      
      for (const key of cacheKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            const now = Date.now();
            
            // Chỉ khôi phục cache còn hạn
            if (now - parsedValue.timestamp < CACHE_TIME) {
              const originalKey = key.slice(CACHE_PREFIX.length);
              apiCache.set(originalKey, parsedValue);
            } else {
              // Xóa cache đã hết hạn
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.warn(`Lỗi parse cache key ${key}:`, e);
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi khi khôi phục cache từ localStorage:', e);
    }
  }
}

/**
 * Tối ưu khả năng phản hồi khi F5
 */
function setupF5Optimization(): void {
  if (typeof window !== 'undefined') {
    // Kiểm tra nếu đây là F5 reload
    const lastReload = sessionStorage.getItem('lastReload');
    const isF5 = lastReload && (Date.now() - parseInt(lastReload)) < 3000;
    
    if (isF5) {
      console.log('Phát hiện F5, khôi phục cache cho trang');
      
      // Khôi phục Redux state nếu cần
      const reduxState = sessionStorage.getItem('reduxState');
      if (reduxState) {
        try {
          const parsedState = JSON.parse(reduxState);
          window.__REDUX_STATE__ = parsedState;
        } catch (e) {
          console.warn('Lỗi khi khôi phục Redux state:', e);
        }
      }
      
      // Khôi phục React Query cache
      const queryState = localStorage.getItem(`${CACHE_PREFIX}queryCache`);
      if (queryState) {
        try {
          const parsedState = JSON.parse(queryState);
          window.__REACT_QUERY_STATE__ = parsedState;
        } catch (e) {
          console.warn('Lỗi khi khôi phục React Query cache:', e);
        }
      }
      
      // Sử dụng skeleton templates
      document.querySelectorAll('.skeleton-loader').forEach(skeleton => {
        (skeleton as HTMLElement).style.display = 'block';
      });
    }
    
    // Lưu React Query cache khi unload
    window.addEventListener('beforeunload', () => {
      if (window.__REACT_QUERY_STATE__) {
        try {
          localStorage.setItem(
            `${CACHE_PREFIX}queryCache`,
            JSON.stringify(window.__REACT_QUERY_STATE__)
          );
        } catch (e) {
          console.warn('Lỗi khi lưu React Query cache:', e);
        }
      }
    });
  }
}

/**
 * Theo dõi hiệu suất và gửi metrics nếu cần
 */
function initPerformanceTracking(): void {
  // Đã được thiết lập trong các functions khác
}

/**
 * Tối ưu cấu hình React Query
 */
export function optimizeQueryClient(queryClient: QueryClient): QueryClient {
  // Thiết lập cấu hình cơ bản
  queryClient.setDefaultOptions({
    queries: {
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 1,
      // Prefetch khi hover vào đường link
      meta: {
        prefetchOnHover: true
      }
    }
  });
  
  // Lắng nghe sự kiện unload để lưu trạng thái
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Lưu trạng thái queryClient nếu cần
      const cache = queryClient.getQueryCache().getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state
      }));
      
      try {
        localStorage.setItem(
          `${CACHE_PREFIX}queryCache`,
          JSON.stringify(cache)
        );
      } catch (e) {
        console.warn('Lỗi khi lưu trạng thái query cache:', e);
      }
    });
    
    // Khôi phục trạng thái
    const cacheData = localStorage.getItem(`${CACHE_PREFIX}queryCache`);
    if (cacheData) {
      try {
        const cache = JSON.parse(cacheData);
        
        // Khôi phục dữ liệu từ cache
        if (Array.isArray(cache)) {
          cache.forEach((item: { queryKey: unknown; state: { data: unknown } }) => {
            if (item.queryKey && item.state && item.state.data) {
              // Đảm bảo queryKey là mảng
              const queryKey = Array.isArray(item.queryKey) ? item.queryKey : [item.queryKey];
              queryClient.setQueryData(queryKey, item.state.data);
            }
          });
        }
      } catch (e) {
        console.warn('Lỗi khi khôi phục query cache:', e);
      }
    }
  }
  
  return queryClient;
}

// Khai báo các interface bổ sung cho Window
declare global {
  interface Window {
    __REDUX_STATE__: unknown;
    __REACT_QUERY_STATE__: unknown;
  }
}

// Tối ưu hoá quá trình tải ban đầu
export const optimizeInitialLoad = () => {
  // Tắt animation cho lần load đầu tiên để ưu tiên hiệu suất
  document.documentElement.classList.add('no-animations');
  
  // Bật lại animation sau khi trang đã load
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-animations');
    }, 300);
  });
  
  // Đánh dấu các hình ảnh có thể nhìn thấy
  markVisibleImages();
};

// Đánh dấu ảnh đang nằm trong viewport để ưu tiên tải
const markVisibleImages = () => {
  if (!('IntersectionObserver' in window)) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.setAttribute('fetchpriority', 'high');
          observer.unobserve(img);
        }
      });
    },
    { threshold: 0 }
  );
  
  document.querySelectorAll('img').forEach(img => observer.observe(img));
}; 