const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      buffer: require.resolve('buffer'),
      url: require.resolve('url'),
      assert: require.resolve('assert'),
    },
  },
};
