/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Allow iframe embedding from bloocube.com and localhost (for development)
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            // Remove X-Frame-Options header (we'll use CSP frame-ancestors instead)
            // Setting to empty string removes the default DENY header
            key: 'X-Frame-Options',
            value: '', 
          },
          {
            // Modern approach: Use CSP frame-ancestors to explicitly allow embedding
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://bloocube.com https://*.bloocube.com http://localhost:3000 http://localhost:*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;