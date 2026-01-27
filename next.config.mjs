/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 👈 ADD THIS

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },
}

export default nextConfig
