const path = require('path');

module.exports = function config(env) {
  const mode = env === 'prod' ? 'production' : 'development';

  const conf = {
    mode,
    devtool: mode === 'production' ? false : 'inline-source-map',

    entry: './src/cocorita.js',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'cocorita.js',
      library: 'CocoLib',
      libraryTarget: 'umd',
      globalObject: 'typeof self !== \'undefined\' ? self : this',
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            'babel-loader',
            'eslint-loader',
          ],
        },
      ],
    },
  };

  return conf;
};
