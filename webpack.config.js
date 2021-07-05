const path = require('path');
const DemoPlugin = require('./plugins/demoPlugin');
const CopyRightWebpackPlugin = require('./plugins/copyright-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  resolveLoader: { modules: ['./loaders/', 'node_modules'] },
  module: {
    rules: [
      {
        test: /\.js$/,
        // 通过 options 参数传参
        use: [
          // {
          //   loader: 'asyncLoader.js',
          // },
          // {
          //   loader: 'emitLoader.js',
          // },
          {
            loader: 'replaceLoader.js',
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
  plugins: [new DemoPlugin({ name: 'zhangsan' }), new CopyRightWebpackPlugin()],
};
