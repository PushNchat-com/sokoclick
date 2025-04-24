export default {
  plugins: {
    'tailwindcss': {},
    'postcss-import': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
      },
    },
    'autoprefixer': {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          'cssnano': {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
              normalizeWhitespace: false,
            }],
          },
        }
      : {}),
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        map: {
          inline: true,
        },
      }
    : {}),
} 