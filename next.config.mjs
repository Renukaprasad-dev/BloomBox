/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double-mounting canvas WebGL contexts in dev
  swcMinify: true,
  transpilePackages: ['three'],
};

export default nextConfig;
