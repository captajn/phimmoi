import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Không cache kết quả

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Kiểm tra kết nối đến API
    const res = await fetch('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
      cache: 'no-store'
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (!res.ok) {
      return NextResponse.json({
        status: 'error',
        message: `API responded with status ${res.status}`,
        responseTime: `${responseTime}ms`
      }, { status: 500 });
    }
    
    // Thử phân tích JSON để đảm bảo dữ liệu hợp lệ
    const data = await res.json();
    
    if (!data || !Array.isArray(data.items)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid API response format',
        responseTime: `${responseTime}ms`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'API connection successful',
      itemCount: data.items.length,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(res.headers)
    });
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.error('API check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`
    }, { status: 500 });
  }
} 