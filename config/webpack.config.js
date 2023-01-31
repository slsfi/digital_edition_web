var webpack = require('webpack');
const defaultWebpackConfig = require('../node_modules/@ionic/app-scripts/config/webpack.config.js');

module.exports = function () {
  defaultWebpackConfig.prod.output['chunkFilename'] = "[name].[chunkhash:10].js";
  defaultWebpackConfig.dev.output['chunkFilename'] = "[name].[chunkhash:10].js";
  defaultWebpackConfig.prod.output['filename'] = "[name].[chunkhash:10].js";
  defaultWebpackConfig.dev.output['filename'] = "[name].[chunkhash:10].js";
  return defaultWebpackConfig;
};