const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: "./js/recipes.jsx",
    mode: "development",
    devtool: 'source-map',
    output: {
        filename: 'recipes.js',
        path: path.resolve(__dirname, './js')
    },
    resolve: { extensions: [".js", ".jsx"] },
    module: {
        rules: [
            {
              test: /\.(js|jsx)$/, 
              exclude: /node_modules/, 
              loader: 'babel-loader',
            },
        ]
    }  
};