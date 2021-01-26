module.exports = {
	presets: [
		process.env.NODE_ENV === "test"
			? ["@babel/preset-env", { targets: { node: "current" } }] // Jest needs to target `node`
			: "@babel/preset-env",
		"@babel/preset-typescript",
	],
};
