/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-syntax-highlighter"],
  experimental: {
    appDir: false,
  },
}

module.exports = nextConfig
