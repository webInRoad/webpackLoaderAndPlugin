const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        // 通过 options 参数传参
        use: [
          {
            loader: './loaders/asyncLoader.js',
          },
          {
            loader: './loaders/replaceLoader.js',
            options: {
              name: 'hello',
            },
          },
        ],
        // 通过字符串来传参
        // use: './loaders/replaceLoader.js?name=hello'
      },
    ],
  },
};
