const config = (module.exports = {
	entry: {
		tokens_and_grammar: "./src/tokens_and_grammar.js",
		grammar_only_es6: "./src/grammar_only_es6_import.js",
		grammar_only_commonjs: "./src/grammar_only_commonjs_require.js"
	},

	output: {
		filename: "./gen/[name].bundle.js",
		libraryTarget: "umd"
	},

	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: "babel-loader"
			}
		]
	},

	devtool: "sourcemap"
})
