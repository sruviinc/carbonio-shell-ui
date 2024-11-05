/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Config } from 'jest';

const config: Config = {
	// All imported modules in your tests should be mocked automatically
	// automock: false,

	// Stop running tests after `n` failures
	// bail: 0,

	// The directory where Jest should store its cached dependency information
	// cacheDirectory: "/tmp/jest_rs",

	// Automatically clear mock calls, instances, contexts and results before every test
	// clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,

	// An array of glob patterns indicating a set of files for which coverage information should be collected
	collectCoverageFrom: [
		'src/**/*.{js,ts}(x)?',
		'!src/**/mocks/**/*', // exclude msw handlers
		'!src/mocks/**/*', // exclude msw handlers
		'!**/(test|mock)*.ts(x)?', // exclude file which name starts with test or mock
		'!src/**/types/*', // exclude types
		'!src/**/*.d.ts', // exclude declarations
		'!src/tests/*', // exclude test folder
		'!**/__mocks__/**/*', // exclude manual mocks
		'!src/workers/*' // FIXME: exclude worker folder which throws error because of the esm syntax
	],

	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',

	// An array of regexp pattern strings used to skip coverage collection
	// coveragePathIgnorePatterns: [
	//   "/node_modules/"
	// ],

	// Indicates which provider should be used to instrument code for coverage
	coverageProvider: 'babel',

	// A list of reporter names that Jest uses when writing coverage reports
	coverageReporters: ['text', 'cobertura', 'lcov'],

	// An object that configures minimum threshold enforcement for coverage results
	// coverageThreshold: {
	// global: {
	// 	branches: 75,
	// 	functions: 75,
	// 	lines: 75,
	// 	statements: 75
	// }
	// },

	// A path to a custom dependency extractor
	// dependencyExtractor: undefined,

	// Make calling deprecated APIs throw helpful error messages
	// errorOnDeprecated: false,

	// The default configuration for fake timers
	fakeTimers: {
		enableGlobally: true,
		doNotFake: ['queueMicrotask']
	},

	// Force coverage collection from ignored files using an array of glob patterns
	// forceCoverageMatch: [],

	// A path to a module which exports an async function that is triggered once before all test suites
	// globalSetup: '',

	// A path to a module which exports an async function that is triggered once after all test suites
	// globalTeardown: undefined,

	// A set of global variables that need to be available in all test environments
	globals: {
		BASE_PATH: ''
	},

	// The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
	// maxWorkers: undefined,

	// An array of directory names to be searched recursively up from the requiring module's location
	moduleDirectories: ['node_modules'],

	// An array of file extensions your modules use
	// moduleFileExtensions: [
	//   "js",
	//   "mjs",
	//   "cjs",
	//   "jsx",
	//   "ts",
	//   "tsx",
	//   "json",
	//   "node"
	// ],

	// A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
	moduleNameMapper: {
		'\\.(css|less)$': 'identity-obj-proxy'
	},

	// An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
	modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__'],

	// Activates notifications for test results
	// notify: false,

	// An enum that specifies notification mode. Requires { notify: true }
	// notifyMode: "failure-change",

	// A preset that is used as a base for Jest's configuration
	// preset: undefined,

	// Run tests from one or more projects
	// projects: undefined,

	// Use this configuration option to add custom reporters to Jest
	reporters: ['default', 'jest-junit'],

	// Automatically reset mock state before every test
	// resetMocks: true,

	// Reset the module registry before running each individual test
	// resetModules: false,

	// A path to a custom resolver
	// resolver: undefined,

	// Automatically restore mock state and implementation before every test
	restoreMocks: true,

	// The root directory that Jest should scan for tests and modules within
	// rootDir: undefined,

	// A list of paths to directories that Jest should use to search for files in
	// roots: [
	//   "<rootDir>"
	// ],

	// Allows you to use a custom runner instead of Jest's default test runner
	// runner: "jest-runner",

	// The paths to modules that run some code to configure or set up the testing environment before each test
	setupFiles: ['<rootDir>/src/jest-polyfills.ts'],

	// A list of paths to modules that run some code to configure or set up the testing framework before each test
	setupFilesAfterEnv: ['<rootDir>/src/jest-env-setup.ts'],

	// The number of seconds after which a test is considered as slow and reported as such in the results.
	// slowTestThreshold: 5,

	// A list of paths to snapshot serializer modules Jest should use for snapshot testing
	// snapshotSerializers: [],

	// The test environment that will be used for testing
	/**
	 * @note Override test environment to set again Request, Response, TextEncoder and other
	 * fields
	 * @see https://mswjs.io/docs/migrations/1.x-to-2.x#requestresponsetextencoder-is-not-defined-jest
	 * @see https://github.com/mswjs/msw/issues/1916#issuecomment-1919965699
	 */
	testEnvironment: '<rootDir>/src/tests/jsdom-extended.ts',

	// Options that will be passed to the testEnvironment
	testEnvironmentOptions: {
		/**
		 * @note Opt-out from JSDOM using browser-style resolution
		 * for dependencies. This is simply incorrect, as JSDOM is
		 * not a browser, and loading browser-oriented bundles in
		 * Node.js will break things.
		 *
		 * Consider migrating to a more modern test runner if you
		 * don't want to deal with this.
		 * @see https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
		 * @see https://github.com/mswjs/msw/issues/1786#issuecomment-1782559851
		 */
		customExportConditions: ['']
	},

	// Adds a location field to test results
	// testLocationInResults: false,

	// The glob patterns Jest uses to detect test files
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

	// An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
	testPathIgnorePatterns: ['/node_modules/', 'constants/test.ts'],

	// The regexp pattern or array of patterns that Jest uses to detect test files
	// testRegex: [],

	// This option allows the use of a custom results processor
	// testResultsProcessor: undefined,

	// This option allows use of a custom test runner
	// testRunner: "jest-circus/runner",

	// A map from regular expressions to paths to transformers
	transform: {
		'^.+\\.[t|j]sx?$': ['babel-jest', { configFile: './babel.config.jest.js' }],
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'./__mocks__/fileTransformer.js'
	},

	// An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
	transformIgnorePatterns: [
		`/node_modules/(?!${['@zextras/carbonio-ui-preview'].join('|')})`,
		'\\.pnp\\.[^\\/]+$'
	]

	// An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
	// unmockedModulePathPatterns: undefined,

	// Indicates whether each individual test should be reported during the run
	// verbose: undefined,

	// An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
	// watchPathIgnorePatterns: [],

	// Whether to use watchman for file crawling
	// watchman: true,
};

export default config;