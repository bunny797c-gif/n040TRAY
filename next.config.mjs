/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400],
    imageSizes: [64, 128, 256, 384, 800],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jpiztqskhqicwnvvowpm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
export default nextConfig;
