/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400],
    imageSizes: [64, 128, 256, 384, 800],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};
export default nextConfig;
