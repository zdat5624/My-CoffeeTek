/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "f006.backblazeb2.com",
      },
   {
        protocol: 'https',
        hostname: 'placehold.co', // Cho phép ảnh fallback
      },
    ],
  },
};

export default nextConfig;
