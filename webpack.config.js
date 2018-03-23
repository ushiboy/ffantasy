function configureWebpack(mode) {
  mode = mode || 'development';
  const base = {
    mode,
    entry: [
      './src/app.js'
    ],
    module: {
      rules: [
      ]
    },
    plugins: [
    ]
  };

  if (mode === 'production') {
    // 後で
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
