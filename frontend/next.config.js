/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
  },
}

module.exports = nextConfig
