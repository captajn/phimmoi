# Tối ưu hiệu suất ứng dụng

Dự án này đã được tối ưu hiệu suất với các biện pháp sau:

## 1. Tối ưu tải hình ảnh

- Thêm hàm `getOptimizedImageUrl` để tối ưu kích thước và chất lượng hình ảnh
- Thêm thuộc tính `width` và `height` cho ảnh để tránh layout shift
- Sử dụng `loading="lazy"` cho hình ảnh nằm dưới đường viewport
- Cài đặt polyfill cho lazy loading trên trình duyệt không hỗ trợ
- Sử dụng `IntersectionObserver` để tối ưu việc hiển thị hình ảnh

## 2. Code splitting và lazy loading

- Lazy load các component không cần thiết ngay lập tức
- Sử dụng `React.lazy` và `Suspense` để phân chia code
- Chỉ tải các section khi chúng được cuộn đến gần viewport
- Sử dụng `useInView` hook để kiểm soát việc render các component

## 3. React Query Optimizations

- Tăng thời gian `staleTime` và `gcTime` để giảm số lần fetch
- Cấu hình `QueryClient` tối ưu trong file riêng biệt
- Prefetch dữ liệu quan trọng cho trang chủ
- Tận dụng cache giữa các component

## 4. Component Optimizations

- Sử dụng `React.memo` để tránh render lại không cần thiết
- Triển khai `useCallback` cho các event handlers
- Phân chia các phần UI thành component nhỏ hơn để dễ quản lý
- Memoize các kết quả tính toán phức tạp

## 5. Prefetching và Preloading

- Preconnect và DNS-prefetch cho các domain chính
- Preload các tài nguyên thiết yếu
- Cài đặt manifest.json cho PWA
- Script preload cho các component chính

## 6. Tối ưu JavaScript

- Sử dụng `debounce` cho các sự kiện như scroll
- Thêm `{ passive: true }` cho các event listener không ngăn chặn hành vi mặc định
- Sử dụng `requestIdleCallback` cho các tác vụ không quan trọng
- Tối ưu độ ưu tiên tải script

## 7. Performance Monitoring

- Cài đặt các event listener cho việc đo lường hiệu suất
- Theo dõi các vấn đề tiềm ẩn

## 8. Responsive Design Optimizations

- Tối ưu tải hình ảnh dựa trên kích thước màn hình
- Sử dụng media queries hiệu quả

## Các file đã được tối ưu:

- `src/utils/image.ts`: Tối ưu URL hình ảnh và lazy loading
- `src/utils/performance.ts`: Các utility cho việc tối ưu hiệu suất
- `src/utils/queryClient.ts`: Cấu hình React Query tối ưu
- `src/pages/Home.tsx`: Tối ưu trang chủ với lazy loading và preloading
- `src/components/MovieCard.tsx`: Tối ưu component hiển thị phim
- `src/components/MovieSlider.tsx`: Tối ưu slider chính
- `src/App.tsx`: Cấu hình lazy loading cho các routes
- `public/index.html`: Preload các tài nguyên quan trọng
- `public/manifest.json`: Cấu hình PWA
