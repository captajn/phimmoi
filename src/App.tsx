'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { createOptimizedQueryClient } from './utils/queryClient'
import { Layout } from './components/Layout'

// Tạo QueryClient với cấu hình tối ưu
const queryClient = createOptimizedQueryClient()

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        {children}
      </Layout>
    </QueryClientProvider>
  )
}