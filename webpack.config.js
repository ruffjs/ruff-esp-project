'use strict'

const webpack = require('webpack');
const path = require('path');
const MODULE_DIR = path.resolve('./src');
const OUTPUT_DIR = path.resolve('./dist/app');
const ENTRY = 'index.js';

module.exports = {
  mode: 'production',
  entry: [ path.resolve(MODULE_DIR, ENTRY) ],
  output: {
    path: OUTPUT_DIR,
    filename: 'index.js',
  },
  optimization: {
      minimize: false
  },
  node: false,
  resolve: {
    modules: [ MODULE_DIR ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
}
