const webpack = require("webpack");
/** @type {import('next').NextConfig} */
const nextConfig = {
ssr: {
  // noExternal: ["@nivo/*"],
  },
  reactStrictMode: false,
   experimental: {
    esmExternals: 'loose',
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  future: {
    webpack5: true,
  },
  

  webpack: (config, options) => {
     config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
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
