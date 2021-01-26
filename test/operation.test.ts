/* eslint-disable @typescript-eslint/no-explicit-any */
import "jest-extended";
import "jest-chain";

import createIpemsOperation from "../src/operation";
import createIpems from "../src/core";

describe("operations", () => {
	describe("createIpemsOperation", () => {
		const IpemsOperation = createIpemsOperation();
		it("should create valid class", () => {
			expect(IpemsOperation).toBeFunction();
		});
		it("should start with no encoders", () => {
			expect(IpemsOperation.encoders).toStrictEqual({});
		});
	});
	describe("error formation", () => {
		const IpemsOperation = createIpemsOperation();
		const Ipems = createIpems();
		Ipems.registerClasses({
			testClass: {
				types: {
					testType: {
						severities: ["testSeverity"],
						params: [
							{
								name: "testParam",
							},
						],
						encoders: {
							testEncoding: () => "This is a test.",
						},
					},
				},
			},
		});
		it("should take multiple Ipems instances", () => {
			expect(
				new IpemsOperation(
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					})
				)
			).toBeInstanceOf(IpemsOperation);
		});
		it("should throw if given encoded instance", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new (IpemsOperation as any)(
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}).encodeAs("testEncoding"),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					})
				);
			}).toThrowError();
		});
	});
	describe("registerEncoders", () => {
		it("should allow registration of new encoders", () => {
			const IpemsOperation = createIpemsOperation();
			const register = {
				testEncoding: () => "This is a test operation-level encoder.",
			};
			IpemsOperation.registerEncoders(register);

			expect(IpemsOperation.encoders).toStrictEqual(register);
		});
	});
	describe("encodeAs", () => {
		it("should encode operation correctly", () => {
			const Ipems = createIpems();
			Ipems.registerClasses({
				testClass: {
					types: {
						testType: {
							severities: ["testSeverity"],
							params: [
								{
									name: "testParam",
								},
							],
							encoders: {
								testEncoding: () => "This is a test.",
							},
						},
					},
				},
			});
			const IpemsOperation = createIpemsOperation();
			IpemsOperation.registerEncoders({
				testEncoding: () => "This is a test operation-level encoder.",
			});

			expect(
				new IpemsOperation(
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					})
				).encodeAs("testEncoding", { asErrorInstance: false })
			).toBe("This is a test operation-level encoder.");
		});
		it("should encode components correctly", () => {
			const Ipems = createIpems();
			Ipems.registerClasses({
				testClass: {
					types: {
						testType: {
							severities: ["testSeverity"],
							params: [
								{
									name: "testParam",
								},
							],
							encoders: {
								testEncoding: () => "This is a test.",
							},
						},
					},
				},
			});
			const IpemsOperation = createIpemsOperation();
			IpemsOperation.registerEncoders({
				testEncoding: ({ encodings }) => encodings.join(" + "),
			});

			expect(
				new IpemsOperation(
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					}),
					new Ipems("testClass", "testType", "testSeverity", {
						params: { testParam: "test" },
					})
				).encodeAs("testEncoding", { asErrorInstance: false })
			).toBe("This is a test. + This is a test. + This is a test.");
		});
		it("should parse custom props to components", () => {
			const Ipems = createIpems();
			Ipems.registerClasses({
				testClass: {
					types: {
						testType: {
							severities: ["testSeverity"],
							params: [
								{
									name: "testParam",
								},
							],
							encoders: {
								testEncoding: () => "This is a test.",
							},
						},
					},
				},
			});
			expect.assertions(3);
			const IpemsOperation = createIpemsOperation();
			IpemsOperation.registerEncoders({
				testEncoding: ({ encodings }) => encodings.join(" + "),
			});
			const customOpt3 = () => {}; // Function naming
			Ipems.registerEncodersOnTypes({
				encoders: {
					testEncoding: (_props, customOpts) => {
						expect(customOpts)
							.toHaveProperty("customOpt1", "blah")
							.toHaveProperty("customOpt2", { foo: "bar" })
							.toHaveProperty("customOpt3", customOpt3);
						return "This is a test.";
					},
				},
				typesToRegisterOn: ["testType"],
				classToRegisterOn: "testClass",
			});
			new IpemsOperation(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				})
			).encodeAs("testEncoding", {
				optsForComponents: {
					customOpt1: "blah",
					customOpt2: { foo: "bar" },
					customOpt3,
				},
			});
		});
		it("should pass custom props to operation-level encoder", () => {
			const Ipems = createIpems();
			Ipems.registerClasses({
				testClass: {
					types: {
						testType: {
							severities: ["testSeverity"],
							params: [
								{
									name: "testParam",
								},
							],
							encoders: {
								testEncoding: () => "This is a test.",
							},
						},
					},
				},
			});
			expect.assertions(3);
			const IpemsOperation = createIpemsOperation();
			const customOpt3 = () => {}; // Function naming
			IpemsOperation.registerEncoders({
				testEncoding: (_props, customOpts) => {
					expect(customOpts)
						.toHaveProperty("customOpt1", "blah")
						.toHaveProperty("customOpt2", { foo: "bar" })
						.toHaveProperty("customOpt3", customOpt3);
					return "This is a test.";
				},
			});
			new IpemsOperation(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				})
			).encodeAs("testEncoding", {
				optsForOperation: {
					customOpt1: "blah",
					customOpt2: { foo: "bar" },
					customOpt3,
				},
			});
		});
	});
	describe("encodeAsDefault", () => {
		const Ipems = createIpems();
		Ipems.registerClasses({
			testClass: {
				types: {
					testType: {
						severities: ["testSeverity"],
						params: ["testParam"],
						encoders: {
							testEncoding: () => "This is a test.",
						},
					},
				},
			},
		});
		it("should initialise with default encoding `undefined`", () => {
			const IpemsOperation = createIpemsOperation();
			expect(IpemsOperation.defaultEncoding).toBeUndefined();
			expect(() => {
				new IpemsOperation(
					new Ipems("testClass", "testType", "testSeverity", {
						params: {
							testParam: "blah",
						},
					})
				).encodeAsDefault();
			}).toThrowError();
		});
		it("should allow default encoding to be set with setter", () => {
			const IpemsOperation = createIpemsOperation();
			IpemsOperation.registerEncoders({
				testEncoding: () => "This is a test.",
			});
			IpemsOperation.defaultEncoding = "testEncoding";
			expect(IpemsOperation.defaultEncoding).toBe("testEncoding");
		});
		it("should use `defaultEncoding` to call specified encoder", () => {
			const IpemsOperation = createIpemsOperation();
			IpemsOperation.registerEncoders({
				testEncoding: () => "This is a test.",
			});
			IpemsOperation.defaultEncoding = "testEncoding";
			expect(
				new IpemsOperation(
					new Ipems("testClass", "testType", "testSeverity", {
						params: {
							testParam: "blah",
						},
					})
				).encodeAsDefault({ asErrorInstance: false })
			).toBe("This is a test.");
		});
	});
});
