import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePerformanceOptimizations, registerServiceWorker } from './utils/performance.ts'

// Khởi tạo các tối ưu hiệu suất trước khi render
initializePerformanceOptimizations();

// Đăng ký service worker để cải thiện tải trang và hoạt động offline
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
