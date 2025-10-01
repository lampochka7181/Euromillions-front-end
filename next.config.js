/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 13.4+
  output: 'export', // Enable static export for mobile apps
  trailingSlash: true, // Required for static export
  images: {
    unoptimized: true // Required for static export
  },
  // Disable server-side features for static export
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
