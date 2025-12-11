/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // 可以添加实验性功能
  },
  // 如果你的 API 需要跨域，可以在这里配置
  async rewrites() {
    return [
      // {
      //   source: '/api/:path*',
      //   destination: 'https://api.example.com/:path*',
      // },
    ];
  },
  // 构建配置
  webpack: (config) => {
    // 可以添加自定义 webpack 配置
    return config;
  },
};

module.exports = nextConfig;
