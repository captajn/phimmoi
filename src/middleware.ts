import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Tạo response
  const response = NextResponse.next()
  
  // Lấy thông tin hostname và đường dẫn
  const url = request.nextUrl.clone()
  const { pathname } = url
  const host = request.headers.get('host') || ''
  const isCustomDomain = host.includes('phim.chjbi.net')
  
  // Cấu hình cache cho trang chủ và trang chi tiết phim
  if (pathname === '/' || pathname.startsWith('/phim/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=3600'
    )
  }

  // Cấu hình cache cho API endpoints
  if (pathname.startsWith('/api/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
  }

  // Thêm các headers bảo mật
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Đảm bảo đường dẫn asset đúng khi sử dụng domain tùy chỉnh
  if (isCustomDomain) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' *.chjbi.net; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.chjbi.net; style-src 'self' 'unsafe-inline' *.chjbi.net; img-src 'self' data: https: http:;"
    )
  }

  return response
}

// Chỉ áp dụng middleware cho các đường dẫn cần xử lý
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 