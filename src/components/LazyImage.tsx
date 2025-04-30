"use client"

import { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  placeholderSrc?: string;
  blurEffect?: boolean;
  onLoad?: () => void;
}

/**
 * Component tối ưu hiệu suất để lazy load hình ảnh
 */
const LazyImage = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMzMzMzMzIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjwvc3ZnPg==',
  blurEffect = true,
  onLoad,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    // Lưu trữ tham chiếu hiện tại của imgRef để tránh lỗi trong hàm cleanup
    const currentImgRef = imgRef.current;
    
    // Khởi tạo Intersection Observer để theo dõi khi nào hình ảnh xuất hiện trong viewport
    const observer = new IntersectionObserver((entries) => {
      // Khi hình ảnh xuất hiện trong viewport
      if (entries[0].isIntersecting) {
        // Tạo một hình ảnh ẩn để tải trước
        const img = new Image();
        
        // Xử lý sự kiện khi hình ảnh được tải xong
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
          if (onLoad) {
            onLoad();
          }
        };
        
        // Bắt đầu tải hình ảnh
        img.src = src;
        
        // Ngừng theo dõi sau khi đã tải
        if (currentImgRef) {
          observer.unobserve(currentImgRef);
        }
      }
    }, {
      rootMargin: '100px 0px', // Tải trước khi hình ảnh hiển thị 100px
      threshold: 0.01 // Chỉ cần 1% hình ảnh hiển thị
    });
    
    // Bắt đầu theo dõi hình ảnh
    if (currentImgRef) {
      observer.observe(currentImgRef);
    }
    
    // Dọn dẹp observer khi component unmount
    return () => {
      if (currentImgRef) {
        observer.unobserve(currentImgRef);
      }
    };
  }, [src, onLoad]);
  
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy" // Native lazy loading
      decoding="async" // Giải mã không đồng bộ
      className={`${className} ${blurEffect ? 'transition-all duration-300' : ''} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        filter: blurEffect && !isLoaded ? 'blur(5px)' : 'none',
        opacity: isLoaded ? 1 : 0.8,
      }}
    />
  );
});

export default LazyImage; 