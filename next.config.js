const webpack = require("webpack");
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
   experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
future: {
    webpack5: true, // by default, if you customize webpack config, they switch back to version 4. 
      // Looks like backward compatibility approach.
  },
  

  webpack: (config, options) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
     config.resolve.fallback = {
      ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
        // by next.js will be dropped. Doesn't make much sense, but how it is
      fs: false, // the solution
    };
    return config;
  },
};

module.exports = nextConfig;
