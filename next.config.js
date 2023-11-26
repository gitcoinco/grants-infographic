const webpack = require("webpack");
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
   experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
future: {
    webpack5: true,
  },
  

  webpack: (config, options) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
     config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, 
    };
    return config;
  },
};

module.exports = nextConfig;
