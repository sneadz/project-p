/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-api.pandascore.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pandascore.co',
      },
    ],
  },
};

export default nextConfig;
