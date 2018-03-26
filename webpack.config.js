const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function configureWebpack(mode) {
  mode = mode || 'development';
  const buildDir = process.env.BUILD_DIR || 'build';
  const base = {
    mode,
    entry: [
      './src/app.js'
    ]
  };

  if (mode === 'production') {
    fs.mkdirSync(path.join(__dirname, buildDir));
    return Object.assign({}, base, {
      output: {
        filename: 'bundle.js',
        path: path.join(__dirname, buildDir)
      },
      plugins: [
        new CopyWebpackPlugin([
          './src/index.html',
          './src/fishes.json'
        ])
      ]
    });
  } else {
    return Object.assign({}, base, {
      output: {
        filename: 'bundle.js',
        path: __dirname
      },
      devServer: {
        contentBase: './src',
        inline: true,
        host: '0.0.0.0',
        port: 8080,
        disableHostCheck: true,
        stats: {
          version: false,
          hash: false,
          chunkModules: false
        }
      },
      devtool: 'source-map'
    });
  }
}

module.exports = configureWebpack(process.env.ENV);
