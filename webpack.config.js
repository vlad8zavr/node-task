const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports ={
  // entry point
  entry: {
    app: './src/index.js'
  },
  //output point
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, './build'),
    // for dev-server
    publicPath: '/build'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node-modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: true }
          },
          {
            loader: 'postcss-loader',
            options: { sourceMap: true, config: {path: 'src/js/postcss.config.js'} }
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: true }
          },
          {
            loader: 'postcss-loader',
            options: { sourceMap: true, config: {path: 'src/js/postcss.config.js'} }
          }
        ]
      }
    ]
  },
  devServer: {
    // show errors in browser
    overlay: true,
    // cors error fixed
    // https://stackoverflow.com/questions/45575713/webpack-dev-server-cors-error-with-credentials
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
  ],
}
