/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/medismart",
        destination: "https://www.medismart.software/medismart",
      },
      {
        source: "/medismart/:path*",
        destination: "https://www.medismart.software/medismart/:path*",
      },
    ];
  },
};

export default nextConfig;
