import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Yahan 'token' ki jagah 'userId' check karein kyunki login me wahi set ho raha hai
  const userId = request.cookies.get('userId')?.value; 
  const { pathname } = request.nextUrl;

  // Agar user pehle se logged-in hai aur /login page kholne ki koshish kare, toh use admin par bhej do
  if (pathname === '/login' && userId) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Agar user logged-in nahi hai aur koi bhi protected page khol raha hai
  if (!userId && pathname !== '/login' && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Kon-kon se routes par middleware chalega uska configuration
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};