// Cấu hình domain ảnh
export const IMAGE_DOMAINS = [
  'https://phimimg.com'
];

// Ảnh mặc định khi không tải được hình ảnh
export const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxYTFiMWQiLz48L3N2Zz4='

export interface ImageDimensions {
  width: number
  height: number
}

const IMAGE_SIZES = {
  small: { width: 300, height: 169 },
  medium: { width: 500, height: 281 },
  large: { width: 800, height: 450 }
} as const

type ImageSize = keyof typeof IMAGE_SIZES

/**
 * Lấy URL hình ảnh đã chuẩn hóa
 */
export const getImageUrl = (url: string | undefined): string => {
  if (!url || url.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }
  
  try {
    // Kiểm tra nếu là URL đầy đủ
    if (url.startsWith('http')) {
      return url;
    }
    
    // Nếu chỉ là đường dẫn tương đối, thêm domain
    const baseUrl = url.startsWith('/') ? url : `/${url}`;
    return `https://phimimg.com${baseUrl}`;
  } catch (e) {
    console.warn('Invalid image URL:', url);
    return DEFAULT_PLACEHOLDER;
  }
};

/**
 * Lấy URL hình ảnh đã được tối ưu theo kích thước
 */
export const getOptimizedImageUrl = (url?: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  if (!url) return DEFAULT_PLACEHOLDER;
  
  try {
    const imageUrl = getImageUrl(url);
    if (imageUrl === DEFAULT_PLACEHOLDER) return imageUrl;
    
    const dimensions = IMAGE_SIZES[size];
    const urlObj = new URL(imageUrl);
    urlObj.searchParams.set('width', dimensions.width.toString());
    urlObj.searchParams.set('height', dimensions.height.toString());
    return urlObj.toString();
  } catch (e) {
    console.warn('Error optimizing image URL:', url);
    return DEFAULT_PLACEHOLDER;
  }
};

/**
 * Preload một hình ảnh với độ ưu tiên
 */
export const preloadImage = (url: string | undefined, size: ImageSize = 'medium'): void => {
  if (typeof window === 'undefined' || !url) return;
  
  const imageUrl = getOptimizedImageUrl(url, size);
  const img = new Image();
  img.src = imageUrl;
};

/**
 * Preload nhiều hình ảnh ưu tiên
 */
export const preloadPriorityImages = (urls: (string | undefined)[]): void => {
  if (typeof window === 'undefined' || !urls?.length) return;
  
  urls.forEach(url => {
    if (url) preloadImage(url, 'medium');
  });
};

/**
 * Chuyển sang domain dự phòng khi domain chính không hoạt động
 */
export const switchToBackupDomain = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('use_backup_image_domain', 'true');
};

/**
 * Thiết lập lazy loading cho hình ảnh để tối ưu hiệu suất
 */
export const setupImageLazyLoading = (): void => {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return;
  }

  const loadImage = (img: HTMLImageElement) => {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  };

  const handleIntersection = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        loadImage(img);
        observer.unobserve(img);
      }
    });
  };

  // Tạo Intersection Observer
  const observer = new IntersectionObserver(handleIntersection, {
    rootMargin: '200px 0px', // Bắt đầu tải khi hình ảnh cách viewport 200px
    threshold: 0.01
  });

  // Tìm tất cả hình ảnh có thuộc tính data-src
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach((img) => {
    observer.observe(img);
  });

  // Thêm một MutationObserver để theo dõi các hình ảnh mới được thêm vào DOM
  const mutationCallback = (mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            if (element.tagName === 'IMG' && element.getAttribute('data-src')) {
              observer.observe(element);
            } else {
              const imgs = element.querySelectorAll('img[data-src]');
              imgs.forEach((img) => {
                observer.observe(img);
              });
            }
          }
        });
      }
    });
  };

  const mutationObserver = new MutationObserver(mutationCallback);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cleanup function (không trả về vì setupImageLazyLoading không được thiết kế để cần cleanup)
  // Nhưng nếu cần, bạn có thể lưu trữ observers trong biến toàn cục và disconnect khi cần thiết
};

export function getImagePlaceholder(type: 'poster' | 'backdrop' = 'poster'): string {
  return DEFAULT_PLACEHOLDER;
} 