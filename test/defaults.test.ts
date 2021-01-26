import "jest-chain";
import "jest-extended";

import createDefaultIpems, {
	applyGenericDefaults,
	applyIntersectionDefaults,
	applyUnionDefaults,
	applyUnknownDefaults,
	createIpemsOperation,
	createIpemsSpecialClass,
} from "../src/index";

const defaults = {
	caller: {
		genericSeverities: ["critical", "error", "warning"],
		types: {
			parameter: {
				severities: ["critical", "error", "warning"],
				params: {
					invalidParam: "string",
					validityPrereqs: ["array"],
				},
			},
		},
	},
	callee: {
		genericSeverities: ["critical", "error", "warning"],
		types: {
			return: {
				severities: ["critical", "error", "warning"],
				params: {
					componentName: "string",
					invalidPart: "string",
					validityPrereqs: ["array"],
				},
			},
		},
	},
	external: {
		genericSeverities: ["critical", "error", "warning"],
		types: {
			network: {
				severities: ["critical", "error", "warning"],
				params: {
					resourceName: "string",
				},
			},
			return: {
				severities: ["critical", "error", "warning"],
				params: {
					resourceName: "string",
					invalidPart: "string",
					validityPrereqs: ["array"],
				},
			},
		},
	},
	user: {
		genericSeverities: ["error", "warning"],
		types: {
			input: {
				severities: ["error", "warning"],
				params: {
					inputName: "string",
					validityPrereqs: ["array"],
				},
			},
			authentication: {
				severities: ["error", "warning"],
				params: {
					inputName: "string",
				},
			},
		},
	},
	system: {
		genericSeverities: ["critical", "error", "warning"],
		types: {
			permissions: {
				severities: ["critical", "error", "warning"],
				params: {
					problemFileOrDir: "string",
					neededPermissions: ["array"],
					missingPermissions: ["array"],
					whyPermissionsNeeded: ["array"],
				},
			},
		},
	},
};
const encodings = {
	standard: /[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+: .+/, // Short: Message
	// TODO: make this regex more accurate
	verbose: /[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+:\n.+/, // Short:\nVerbose Message
	numeric: /[0-9]{3}-[0-2]/,
	short: /[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+/, // ClassTypeSeverity form
	full: /[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+\(\{.+\}\)/, // Short(JSONParams)
	nonTechnical: /Non-technical\./, // We use that for surface testing (`createMessage` is further tested later)
};

describe("defaults", () => {
	// The function we export that creates a new IPEMS class with the default options
	describe("createDefaultIpems", () => {
		it("should create a valid IPEMS instance", () => {
			const Ipems = createDefaultIpems();
			expect(Ipems).toBeFunction();
		});
	});

	describe("default IPEMS", () => {
		const Ipems = createDefaultIpems();
		it.each(
			Object.keys(defaults)
				.map(errorClass => {
					const tests: [string, string][] = [];
					defaults[
						errorClass
					].genericSeverities.forEach((severity: string) =>
						tests.push([errorClass, severity])
					);
					return tests;
				})
				.reduce((prev, current) => prev.concat(current))
		)(
			"should support generic types on class '%s' with severity '%s'",
			(errorClass, severity) => {
				expect(
					new Ipems(errorClass, "generic", severity, {})
				).toBeInstanceOf(Ipems);
			}
		);
		describe.each(
			// Loop through all the error classes
			Object.keys(defaults)
				.map(errorClass => {
					// Create tests for each type and severity combination on that class
					const tests: [
						string,
						string,
						string,
						Record<string, unknown>
					][] = [];
					Object.keys(defaults[errorClass].types).forEach(type =>
						defaults[errorClass].types[
							type
						].severities.forEach((severity: string) =>
							tests.push([
								errorClass,
								type,
								severity,
								defaults[errorClass].types[type].params,
							])
						)
					);

					return tests;
				})
				// Take all the arrays of tests for each class and concatenate them all into one massive array of all possible tests
				.reduce((prev, current) => prev.concat(current))
		)(
			"class '%s', type '%s', severity '%s', parameters '%p'",
			(errorClass, type, severity, params) => {
				it("should produce valid Ipems instance", () => {
					expect(
						new Ipems(errorClass, type, severity, { params })
					).toBeInstanceOf(Ipems);
				});
				describe.each(
					Object.keys(encodings).map(encoding => [
						encoding,
						encodings[encoding], // The RegEx pattern
					])
				)("encoding '%s'", (encoding, regex) => {
					const ipems = new Ipems(errorClass, type, severity, {
						params,
					});
					it("should match regex", () => {
						const encoded = ipems.encodeAs(encoding, {
							asErrorInstance: false,
							createMessage: () => "Non-technical.", // For the `nonTechnical` encoding
						}); // Don't wrap it as an error
						expect(encoded).toBeString().toMatch(regex);
					});
					it("should form valid error instance if requested", () => {
						const errForm = ipems.encodeAs(encoding, {
							asErrorInstance: true,
							createMessage: () => "Non-technical.", // For the `nonTechnical` encoding
						});
						expect(errForm).toBeInstanceOf(Error);
					});
				});
				describe("default encoding", () => {
					const ipems = new Ipems(errorClass, type, severity, {
						params,
					});
					it("should match regex for encoding 'standard'", () => {
						const encoded = ipems.encodeAsDefault({
							asErrorInstance: false,
						}); // Don't wrap it as an error
						expect(encoded)
							.toBeString()
							.toMatch(encodings.standard);
					});
					it("should form valid error instance if requested", () => {
						const errForm = ipems.encodeAsDefault({
							asErrorInstance: true,
						});
						expect(errForm).toBeInstanceOf(Error);
					});
				});
				describe("`nonTechnical` encoding", () => {
					const ipems = new Ipems(errorClass, type, severity, {
						params,
					});
					it("should parse `numeric` encoding to `createMessage`", () => {
						const encoded = ipems.encodeAs("nonTechnical", {
							asErrorInstance: false,
							createMessage: ({ numeric }) => numeric,
						});

						expect(encoded).toMatch(encodings.numeric);
					});
					it("should parse `short` encoding to `createMessage`", () => {
						const encoded = ipems.encodeAs("nonTechnical", {
							asErrorInstance: false,
							createMessage: ({ short }) => short,
						});

						expect(encoded).toMatch(encodings.short);
					});
					it("should parse non-technical type explanation to `createMessage`", () => {
						// TODO: run this through a complex language checker
						const encoded = ipems.encodeAs("nonTechnical", {
							asErrorInstance: false,
							createMessage: ({ typeExplanation }) =>
								typeExplanation,
						});

						expect(encoded).toBeString();
					});
					it("should throw if `createMessage` not provided", () => {
						expect(() => {
							ipems.encodeAs("nonTechnical");
						}).toThrowError();
					});
					// TODO: test message formation
				});
			}
		);
	});

	describe.each([
		["IpemsUnion", applyUnionDefaults],
		["IpemsIntersection", applyIntersectionDefaults],
	])("default operation '%s'", (_name, applyDefaults) => {
		const IpemsOperation = applyDefaults(createIpemsOperation());
		const Ipems = createDefaultIpems();
		it("should create valid IPEMS operations", () => {
			expect(IpemsOperation).toBeFunction();
		});
		it.each(
			Object.keys(encodings).map(encoding => [
				encoding,
				encodings[encoding], // The RegEx pattern
			])
		)("should support encoding '%s'", encoding => {
			expect(
				new IpemsOperation(
					new Ipems("caller", "parameter", "error", {
						params: {
							invalidParam: "test",
							validityPrereqs: ["test"],
						},
					})
				).encodeAs(encoding, {
					asErrorInstance: false,
					optsForComponents: {
						createMessage: () => "Test",
					},
					optsForOperation: {
						createMessage: () => "Test",
					},
				})
			).toBeString();
		});
	});
	describe.each([
		["IpemsGeneric", "generic", applyGenericDefaults],
		["IpemsUnknown", "unknown", applyUnknownDefaults],
	])(
		"default special class '%s'",
		(_name, specialClassName, applyDefaults) => {
			const IpemsSpecialClass = applyDefaults(
				createIpemsSpecialClass(specialClassName)
			);
			it("should create valid IPEMS operations", () => {
				expect(IpemsSpecialClass).toBeFunction();
			});
			it.each(
				Object.keys(encodings).map(encoding => [
					encoding,
					encodings[encoding], // The RegEx pattern
				])
			)("should support encoding '%s'", encoding => {
				expect(
					new IpemsSpecialClass().encodeAs(encoding, {
						asErrorInstance: false,
						createMessage: () => "Test",
					})
				).toBeString();
			});
			it("should match regex for encoding 'standard'", () => {
				const encoded = new IpemsSpecialClass().encodeAsDefault({
					asErrorInstance: false,
				}); // Don't wrap it as an error
				expect(encoded).toBeString().toMatch(encodings.standard);
			});
		}
	);
});
