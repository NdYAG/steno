var autoprefixer = require('autoprefixer'),
    ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    entry: {
        steno: './index.js'
    },
    output: {
        path: './dist',
        filename: 'steno.built.js'
    },
    module: {
        loaders: [
            {
                test:   /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!sass-loader')
            },
            {
                test: /\.styl$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!stylus-loader')
            }
        ]
    },
    postcss: function () {
        return [autoprefixer]
    },
    resolve: {
        modulesDirectories: [
            'node_modules',
            'bower_components'
        ]
    },
    plugins: [
        new ExtractTextPlugin('steno.css')
    ]
}
