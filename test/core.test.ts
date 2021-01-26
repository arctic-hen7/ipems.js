/* eslint-disable @typescript-eslint/no-explicit-any */
import "jest-extended";
import "jest-chain";

import createIpems from "../src/core";

describe("core", () => {
	describe("createIpems", () => {
		const Ipems = createIpems();
		it("should create valid class", () => {
			expect(Ipems).toBeFunction();
		});
		it("should have no classes at creation", () => {
			expect(Ipems.classes).toStrictEqual({});
		});
	});
	describe("registerClasses", () => {
		it("should allow registration of complete pattern", () => {
			const Ipems = createIpems();
			const register = {
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
			};
			Ipems.registerClasses(register);

			expect(Ipems.classes).toStrictEqual(register);
		});
		it("should allow registration of just classes", () => {
			const Ipems = createIpems();
			const register = {
				testClass: {
					types: {},
				},
				testClass1: {
					types: {},
				},
				testClass2: {
					types: {},
				},
			};
			Ipems.registerClasses(register);

			expect(Ipems.classes).toStrictEqual(register);
		});
	});
	describe("registerTypesOnClass", () => {
		it("should allow registration of new full type structure on existing class", () => {
			const Ipems = createIpems();
			const register = {
				testClass: {
					types: {},
				},
				testClass1: {
					types: {},
				},
				testClass2: {
					types: {},
				},
			};
			Ipems.registerClasses(register);
			const typeRegister = {
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
			};
			Ipems.registerTypesOnClass({
				...typeRegister,
				classToRegisterOn: "testClass2",
			});

			const fullRegister = {
				...register,
				testClass2: typeRegister,
			};
			expect(Ipems.classes).toStrictEqual(fullRegister);
		});
		it("should allow registration of new simple type structure on existing class", () => {
			const Ipems = createIpems();
			const register = {
				testClass: {
					types: {},
				},
				testClass1: {
					types: {},
				},
				testClass2: {
					types: {},
				},
			};
			Ipems.registerClasses(register);
			const typeRegister = {
				types: {
					testType: {
						severities: [],
						params: [],
						encoders: {},
					},
				},
			};
			Ipems.registerTypesOnClass({
				...typeRegister,
				classToRegisterOn: "testClass2",
			});

			const fullRegister = {
				...register,
				testClass2: typeRegister,
			};
			expect(Ipems.classes).toStrictEqual(fullRegister);
		});
	});
	describe("registerSeveritiesOnType", () => {
		it("should allow registration of new severities on existing types on existing class", () => {
			const Ipems = createIpems();
			const register = {
				testClass: {
					types: {},
				},
				testClass1: {
					types: {
						testType: {
							severities: [],
							params: [],
							encoders: {},
						},
						testType1: {
							severities: [],
							params: [],
							encoders: {},
						},
					},
				},
				testClass2: {
					types: {},
				},
			};
			Ipems.registerClasses(register);
			const severities = ["testSeverity"];
			Ipems.registerSeveritiesOnTypes({
				severities,
				typesToRegisterOn: ["testType", "testType1"],
				classToRegisterOn: "testClass1",
			});

			const fullRegister = {
				...register,
				testClass1: {
					types: {
						testType: {
							severities,
							params: [],
							encoders: {},
						},
						testType1: {
							severities,
							params: [],
							encoders: {},
						},
					},
				},
			};
			expect(Ipems.classes).toStrictEqual(fullRegister);
		});
	});
	describe("registerEncodersOnTypes", () => {
		it("should allow registration of new encoders on existing types on existing class", () => {
			const Ipems = createIpems();
			const register = {
				testClass: {
					types: {},
				},
				testClass1: {
					types: {
						testType: {
							severities: [],
							params: [],
							encoders: {},
						},
						testType1: {
							severities: [],
							params: [],
							encoders: {},
						},
					},
				},
				testClass2: {
					types: {},
				},
			};
			Ipems.registerClasses(register);
			const encoders = {
				testEncoding: () => "Test",
			};
			Ipems.registerEncodersOnTypes({
				encoders,
				typesToRegisterOn: ["testType", "testType1"],
				classToRegisterOn: "testClass1",
			});

			const fullRegister = {
				...register,
				testClass1: {
					types: {
						testType: {
							severities: [],
							params: [],
							encoders,
						},
						testType1: {
							severities: [],
							params: [],
							encoders,
						},
					},
				},
			};
			expect(Ipems.classes).toStrictEqual(fullRegister);
		});
	});
	describe("error formation", () => {
		const Ipems = createIpems();
		Ipems.registerClasses({
			testClass: {
				types: {
					testType: {
						severities: ["testSeverity"],
						params: [
							"testParam",
							{
								name: "testParamTyped",
								type: "function",
							},
							{
								name: "testParamOptional",
								required: false,
							},
						],
						encoders: {
							testEncoding: () => "This is a test.",
						},
					},
				},
			},
		});
		it("should create new IPEMS instance", () => {
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
						testParamOptional: "test",
					},
				})
			).toBeInstanceOf(Ipems);
		});
		it("should throw on nonexistent class", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("nonexistent", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should throw on nonexistent type", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("testClass", "nonexistent", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should throw on nonexistent severity", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("nonexistent", "testType", "nonexistent", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should throw on missing required parameter", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should treat simple parameters as required", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParamTyped: () => {},
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should throw on invalid parameter type", () => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: "this should be a function",
						testParamOptional: "test",
					},
				});
			}).toThrowError();
		});
		it("should allow missing optional parameter", () => {
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
					},
				})
			).toBeInstanceOf(Ipems);
		});
		it("should allow additional undeclared parameters", () => {
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "test",
						testParamTyped: () => {},
						testParamOptional: "test",
						additionParam: "test",
					},
				})
			).toBeInstanceOf(Ipems);
		});
		describe("additional options", () => {
			describe("solutions", () => {
				it("should be allowed", () => {
					expect(
						new Ipems("testClass", "testType", "testSeverity", {
							params: {
								testParam: "test",
								testParamTyped: () => {},
								testParamOptional: "test",
							},
							solutions: ["this is a test"],
						})
					).toBeInstanceOf(Ipems);
				});
				it("should throw if not array of non-empty strings", () => {
					expect(() => {
						// eslint-disable-next-line no-new
						new (Ipems as any)(
							"testClass",
							"testType",
							"testSeverity",
							{
								params: {
									testParam: "test",
									testParamTyped: () => {},
									testParamOptional: "test",
								},
								solutions: [5],
							}
						);
					}).toThrowError();
				});
			});
			describe("fallback", () => {
				it("should be allowed", () => {
					expect(
						new Ipems("testClass", "testType", "testSeverity", {
							params: {
								testParam: "test",
								testParamTyped: () => {},
								testParamOptional: "test",
							},
							fallback: "this is a test",
						})
					).toBeInstanceOf(Ipems);
				});
				it("should throw if not string", () => {
					expect(() => {
						// eslint-disable-next-line no-new
						new (Ipems as any)(
							"testClass",
							"testType",
							"testSeverity",
							{
								params: {
									testParam: "test",
									testParamTyped: () => {},
									testParamOptional: "test",
								},
								fallback: { foo: "bar" },
							}
						);
					}).toThrowError();
				});
			});
			describe("details", () => {
				it("should be allowed", () => {
					expect(
						new Ipems("testClass", "testType", "testSeverity", {
							params: {
								testParam: "test",
								testParamTyped: () => {},
								testParamOptional: "test",
							},
							details: "this is a test",
						})
					).toBeInstanceOf(Ipems);
				});
				it("should throw if not string", () => {
					expect(() => {
						// eslint-disable-next-line no-new
						new (Ipems as any)(
							"testClass",
							"testType",
							"testSeverity",
							{
								params: {
									testParam: "test",
									testParamTyped: () => {},
									testParamOptional: "test",
								},
								details: { foo: "bar" },
							}
						);
					}).toThrowError();
				});
			});
		});
	});
	describe("encodeAs", () => {
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
		it("should throw if unregistered encoding provided", () => {
			expect(() => {
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				}).encodeAs("blah");
			}).toThrowError();
		});
		it("should format as error instance by default", () => {
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				}).encodeAs("testEncoding")
			).toBeInstanceOf(Error);
		});
		it("should be able to be formatted as plain string", () => {
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				}).encodeAs("testEncoding", { asErrorInstance: false })
			)
				.toBeString()
				.toBe("This is a test.");
		});
		it.each([
			"errorClass",
			"type",
			"severity",
			"options",
			"params",
			"solutions",
			"fallback",
			"details",
		])("should pass property '%s' to encoder function", propName => {
			expect.assertions(1);
			Ipems.registerEncodersOnTypes({
				encoders: {
					testEncoding: props => {
						expect(props).toHaveProperty(propName);
						return "This is a test.";
					},
				},
				typesToRegisterOn: ["testType"],
				classToRegisterOn: "testClass",
			});
			new Ipems("testClass", "testType", "testSeverity", {
				params: {
					testParam: "blah",
				},
				solutions: ["test"],
				fallback: "test",
				details: "test",
			}).encodeAs("testEncoding");
		});
		describe("property 'stringReturn'", () => {
			it("should be passed to encoder function", () => {
				expect.assertions(1);
				Ipems.registerEncodersOnTypes({
					encoders: {
						testEncoding: props => {
							expect(props).toHaveProperty("stringReturn");
							return "This is a test.";
						},
					},
					typesToRegisterOn: ["testType"],
					classToRegisterOn: "testClass",
				});
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
					solutions: ["test"],
					fallback: "test",
					details: "test",
				}).encodeAs("testEncoding");
			});
			it("should be `true` if `asErrorInstance` is `true`", () => {
				expect.assertions(1);
				Ipems.registerEncodersOnTypes({
					encoders: {
						testEncoding: props => {
							expect(props).toHaveProperty("stringReturn", true);
							return "This is a test.";
						},
					},
					typesToRegisterOn: ["testType"],
					classToRegisterOn: "testClass",
				});
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
					solutions: ["test"],
					fallback: "test",
					details: "test",
				}).encodeAs("testEncoding");
			});
			it("should be `false` if `asErrorInstance` is `false`", () => {
				expect.assertions(1);
				Ipems.registerEncodersOnTypes({
					encoders: {
						testEncoding: props => {
							expect(props).toHaveProperty("stringReturn", false);
							return "This is a test.";
						},
					},
					typesToRegisterOn: ["testType"],
					classToRegisterOn: "testClass",
				});
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
					solutions: ["test"],
					fallback: "test",
					details: "test",
				}).encodeAs("testEncoding", { asErrorInstance: false });
			});
		});
		it("should pass custom options to encoder function", () => {
			expect.assertions(3);
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
			new Ipems("testClass", "testType", "testSeverity", {
				params: {
					testParam: "blah",
				},
			}).encodeAs("testEncoding", {
				customOpt1: "blah",
				customOpt2: { foo: "bar" },
				customOpt3,
			});
		});
	});
	describe("encodeAsDefault", () => {
		it("should initialise with default encoding `undefined`", () => {
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
			expect(Ipems.defaultEncoding).toBeUndefined();
			expect(() => {
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				}).encodeAsDefault();
			}).toThrowError();
		});
		it("should allow default encoding to be set with setter", () => {
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
			Ipems.defaultEncoding = "testEncoding";
			expect(Ipems.defaultEncoding).toBe("testEncoding");
		});
		it("should use `defaultEncoding` to call specified encoder", () => {
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
			Ipems.defaultEncoding = "testEncoding";
			expect(
				new Ipems("testClass", "testType", "testSeverity", {
					params: {
						testParam: "blah",
					},
				}).encodeAsDefault({ asErrorInstance: false })
			).toBe("This is a test.");
		});
	});
});
