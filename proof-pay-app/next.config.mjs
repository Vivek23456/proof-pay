/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  webpack: (config) => {
    // Some Solana deps ship non-bundled ESM that older webpack chokes on.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
