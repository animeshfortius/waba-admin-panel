import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Apne login session/cookie ka naam yahan check karein (jaise 'token' ya 'session')
  const token = request.cookies.get('token')?.value; 
  const { pathname } = request.nextUrl;

  // Agar user pehle se logged-in hai aur /login page kholne ki koshish kare, toh use admin par bhej do
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Agar user logged-in nahi hai aur koi bhi protected page (jaise /admin, /waba, etc.) khol raha hai
  if (!token && pathname !== '/login' && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Kon-kon se routes par middleware chalega uska configuration
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};