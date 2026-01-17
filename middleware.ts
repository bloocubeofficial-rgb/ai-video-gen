import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Remove X-Frame-Options header (if Next.js sets it)
  response.headers.delete('X-Frame-Options');
  
  // Set Content-Security-Policy to allow embedding from bloocube.com
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://bloocube.com https://*.bloocube.com http://localhost:3000 http://localhost:*"
  );

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
};

