const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        new_recipe: './js/new_recipe.jsx',
        edit_recipe: './js/edit_recipe.jsx'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist'),
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    chunks: 'all'
                },
                vendor: {
                    test: /[\\/]node_modules[\\/]react-beautiful-dnd[\\/]/,
                    name: 'react-beautiful-dnd',
                    chunks: 'all'
                }
            }
        }
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