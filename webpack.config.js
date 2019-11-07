const path = require('path');
const { spawn } = require('child_process');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

const commonRules = [
  {
    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader',
  },
  {
    test: /\.jpe?g$|\.gif$|\.ico$|\.png$|\.svg$/,
    use: 'file-loader',
  },
  {
    test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'file-loader',
  },
  {
    test: /\.otf(\?.*)?$/,
    use: 'file-loader',
  },
];

const forElectron = {
  mode: 'production',
  name: 'electron-main',
  target: 'electron-main',
  entry: './src/electron/index.js',
  output: {
    path: `${__dirname}/build`,
    filename: 'index.js',
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: ['babel-loader'],
      },
      ...commonRules,
    ],
  },
  resolve: {
    extensions: ['*', '.js'],
  },
  plugins: [
    new CopyPlugin([
      {
        from: 'package.json',
        to: './',
        transformPath(targetPath) {
          return targetPath.replace('src/', '');
        },
      },
    ]),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
};

const forView = ({ mode, devtool }) => ({
  mode,
  devtool,
  name: 'electron-renderer',
  target: 'electron-renderer',
  entry: [
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://localhost:8080/`,
    'webpack/hot/only-dev-server',
    './src/view/index.js',
  ],
  output: {
    path: `${__dirname}/build`,
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'react-hot-loader/webpack'],
      },
      {
        test: /\.css$/,
        use: [mode === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
      ...commonRules,
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/view/index.html',
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'build'),
    compress: true,
    noInfo: true,
    stats: 'errors-only',
    inline: true,
    lazy: false,
    hot: true,
    watchOptions: {
      aggregateTimeout: 300,
      ignored: /node_modules/,
      poll: 100,
    },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false,
    },
    before() {
      // start electron process
      spawn('npm', ['run', 'start-electron-dev'], {
        shell: true,
        env: process.env,
        stdio: 'inherit',
      })
        .on('close', code => process.exit(code))
        .on('error', spawnError => {
          throw new Error(spawnError);
        });
    },
  },
});

module.exports = (env, argv) => {
  const mode = argv.mode === 'development' ? 'development' : 'production';
  const devtool = mode === 'development' ? 'inline-source-map' : false;
  const webpackConfig = [forView({ mode, devtool })];
  if (mode === 'production') {
    webpackConfig.push(forElectron);
  }
  return webpackConfig;
};
