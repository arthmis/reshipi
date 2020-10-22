const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        new_recipe: './js/new_recipe.jsx'
    },
    mode: 'development',
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist'),
    },
    resolve: { extensions: ['.js', '.jsx'] },
    module: {
        rules: [
            {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
            },
        ],
    },  
};