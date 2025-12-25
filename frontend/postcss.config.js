module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Optimize CSS for production
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          minifyFontValues: true,
          minifyGradients: true,
        }],
      },
    }),
  },
}
