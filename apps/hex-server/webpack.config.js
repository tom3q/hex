const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');

const {
  NODE_ENV = 'production',
} = process.env;

module.exports = {
  devtool: NODE_ENV === "development" ? "inline-source-map" : undefined,
  entry: "./src/index.ts",
  externals: [nodeExternals()],
  mode: NODE_ENV,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: "node",
  plugins: [
    new webpack.DefinePlugin({ "global.GENTLY": false })
  ],
  node: {
    __dirname: true,
  },
};
