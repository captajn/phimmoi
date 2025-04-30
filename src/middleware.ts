import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/',
    '/phim/:path*',
    '/xem/:path*',
    '/api/:path*',
    '/the-loai/:path*',
    '/quoc-gia/:path*',
    '/tim-kiem',
    '/duyet-tim',
  ],
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const host = request.headers.get('host') || ''
  const isCustomDomain = host.includes('phim.chjbi.net')

  // Cấu hình cache cho trang chủ và trang chi tiết phim
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/phim/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=3600'
    )
  }

  // Cấu hình cache cho API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
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