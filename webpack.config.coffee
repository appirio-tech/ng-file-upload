webpackConfig = require 'appirio-tech-webpack-config'

if process.argv.indexOf('--react-dev') > 0
  module.exports = webpackConfig
    dirname: __dirname
    template: './index.html'
    entry:
      example: [
        'webpack-dev-server/client?http://localhost:8080'
        './example.coffee'
      ]
else
  module.exports = webpackConfig dirname: __dirname