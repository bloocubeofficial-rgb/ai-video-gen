/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Headers to allow iframe embedding from Bloocube frontend
  async headers() {
    // Get allowed origins from environment variable or use wildcard for development
    const allowedOrigins = process.env.ALLOWED_IFRAME_ORIGINS 
      ? process.env.ALLOWED_IFRAME_ORIGINS.split(',').map(origin => origin.trim())
      : ['*']; // Allow all origins in development, restrict in production
    
    // Build CSP frame-ancestors directive
    const frameAncestors = allowedOrigins.includes('*') 
      ? "*" 
      : allowedOrigins.join(' ');
    
    const headers = [
      {
        key: 'Content-Security-Policy',
        value: `frame-ancestors ${frameAncestors};`,
      },
    ];
    
    // Only add X-Frame-Options if we're restricting origins
    // When allowing all origins (*), we omit X-Frame-Options and rely on CSP
    if (!allowedOrigins.includes('*')) {
      headers.push({
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN', // This allows same-origin, but CSP frame-ancestors takes precedence
      });
    }
    
    return [
      {
        source: '/:path*',
        headers: headers,
      },
    ];
  },
};

export default nextConfig;