import { DEFAULT_PLACEHOLDER } from './image';

// Hàm xử lý lỗi khi ảnh không tải được
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
  const img = e.currentTarget;
  img.src = fallbackSrc;
};

// Tạo URL ảnh dự phòng nếu domain chính không hoạt động
export const createFallbackImageUrl = (url?: string): string => {
  if (!url) return DEFAULT_PLACEHOLDER;
  
  // Tạo URL thay thế nếu domain chính không hoạt động
  // Ví dụ: Thay đổi từ phimimg.com sang domain khác
  if (url.includes('phimimg.com')) {
    return url.replace('phimimg.com', 'i.imgur.com');
  }
  
  return url;
}; 