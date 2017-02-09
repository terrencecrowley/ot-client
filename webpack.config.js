var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  	.filter(function(x) {
   		return ['.bin'].indexOf(x) === -1;
	})
	.forEach(function(mod) {
		nodeModules[mod] = 'commonjs ' + mod;
});

// Really should make work for scoped modules
nodeModules['@terrencecrowley/ot-js'] = 'commonjs @terrencecrowley/ot-js';

var serverConfig = {
	entry: './src/server.ts',
	target: 'node',
	output: {
		path: './dist',
		filename: 'guiserver.bundle.js'
	},
	externals: nodeModules,

	// Enable source maps
	devtool: "source-map",

	resolve: {
		extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
	},

	module: {
		loaders: [
			{ test: /\.tsx?$/, loader: 'ts-loader' },
			{ test: /\.json$/, loader: 'json-loader' }
		],

		preLoaders: [
			{ test: /\.js$/, loader: "source-map-loader" }
		]
	}
};

var clientConfig = {
	entry: './src/client.tsx',
	target: 'web',
	output: {
		path: './clientdist',
		filename: 'guiclient.bundle.js'
	},

	externals: {
		"jquery": "jQuery",
		"react": "React",
		"react-dom": "ReactDOM"
	},

	// Enable source maps
	devtool: "source-map",

	resolve: {
		extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
	},

	module: {
		loaders: [
			{ test: /\.tsx?$/, loader: 'ts-loader' },
			{ test: /\.json$/, loader: 'json-loader' }
		],

		preLoaders: [
			{ test: /\.js$/, loader: "source-map-loader" }
		]
	}
};

module.exports = [ serverConfig, clientConfig ];
