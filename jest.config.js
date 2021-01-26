module.exports = {
	rootDir: "./", // This will end up being local to the extending configuration
	transform: {
		"^.+\\.(j|t)sx?$": "babel-jest", // Transform JS/TS with Babel
	},
	moduleDirectories: ["src"], // Allows local absolute imports
	clearMocks: true,
	coverageDirectory: "./.coverage", // You'll want to override this if you're using a package that doesn't have the direct parent `packages`
	setupFilesAfterEnv: ["jest-extended", "jest-chain"], // Adds useful extra testing tools
	testMatch: ["<rootDir>/(src|test)/**/*.test.(ts|tsx)"], // This will match all tests ending in `.ts` or `.tsx` - you may want to change that in some cases (separate logic and UI testing for example)
};
