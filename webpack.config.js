const path = require('path')

module.exports = {
    entry: {
        doc: path.resolve(__dirname, './src/doc.js'),
        home: path.resolve(__dirname, './src/home.js'),
        users: path.resolve(__dirname, './src/users.js'),
    },
    output: {
        path: path.resolve(__dirname, './public'),
        filename: '[name].js',
    },
}