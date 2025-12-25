// craco.config.js
const path = require("path");
require("dotenv").config();

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === "true",
  enableVisualEdits: process.env.REACT_APP_ENABLE_VISUAL_EDITS === "true",
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load visual editing modules only if enabled
let babelMetadataPlugin;
let setupDevServer;

if (config.enableVisualEdits) {
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });

        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      // Remove console.* in production
      if (process.env.NODE_ENV === 'production') {
        const TerserPlugin = require('terser-webpack-plugin');
        webpackConfig.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true, // Remove all console statements
                drop_debugger: true,
              },
            },
          }),
        ];
      }

      // Performance optimizations for production builds
      if (process.env.NODE_ENV === 'production') {
        // Enable performance hints - increased limits for modern apps
        webpackConfig.performance = {
          maxEntrypointSize: 1024000, // 1 MB - increased for feature-rich app
          maxAssetSize: 1024000, // 1 MB
          hints: 'warning',
        };

        // Optimize chunk splitting for better caching
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 30,
            maxAsyncRequests: 30,
            minSize: 20000,
            maxSize: 500000, // Max 500KB per chunk - increased for better balance
            cacheGroups: {
              // Separate React vendor bundle
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                name: 'react-vendor',
                priority: 40,
                maxSize: 400000, // 400KB max - increased
                reuseExistingChunk: true,
              },
              // Separate UI library bundle
              ui: {
                test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
                name: 'ui-vendor',
                priority: 30,
                maxSize: 500000, // 500KB max - increased
                reuseExistingChunk: true,
              },
              // Separate chart library bundle
              charts: {
                test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
                name: 'charts',
                priority: 35,
                maxSize: 150000, // 150KB max
                reuseExistingChunk: true,
              },
              // Other vendors
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                maxSize: 244000, // 244KB max
                reuseExistingChunk: true,
              },
              // Common code used across multiple pages
              common: {
                minChunks: 2,
                priority: 5,
                maxSize: 100000, // 100KB max
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
          runtimeChunk: 'single',
          moduleIds: 'deterministic', // Better long-term caching
        };

        // Add Brotli and Gzip compression for text assets
        const CompressionPlugin = require('compression-webpack-plugin');
        const zlib = require('zlib');
        
        // Gzip compression
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg|json)$/,
            threshold: 10240, // Only compress files larger than 10KB
            minRatio: 0.8,
            deleteOriginalAssets: false,
          })
        );
        
        // Brotli compression (better than gzip)
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg|json)$/,
            compressionOptions: {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
              },
            },
            threshold: 10240,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          })
        );

        // Tree shaking for better bundle size
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.sideEffects = false;
      }

      return webpackConfig;
    },
  },
};

// Only add babel plugin if visual editing is enabled
if (config.enableVisualEdits) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

// Setup dev server with visual edits and/or health check
if (config.enableVisualEdits || config.enableHealthCheck) {
  webpackConfig.devServer = (devServerConfig) => {
    // Apply visual edits dev server setup if enabled
    if (config.enableVisualEdits && setupDevServer) {
      devServerConfig = setupDevServer(devServerConfig);
    }

    // Add health check endpoints if enabled
    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        // Call original setup if exists
        if (originalSetupMiddlewares) {
          middlewares = originalSetupMiddlewares(middlewares, devServer);
        }

        // Setup health endpoints
        setupHealthEndpoints(devServer, healthPluginInstance);

        return middlewares;
      };
    }

    return devServerConfig;
  };
}

module.exports = webpackConfig;
