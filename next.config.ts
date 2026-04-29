import path from 'node:path';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ['motion'],
  webpack: (config, {dev, isServer, webpack}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    if (dev) {
      config.cache = false;
    }
    if (dev && !isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        process: require.resolve('process/browser'),
      };
      config.plugins = [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      ];
    }
    return config;
  },
};

export default nextConfig;
