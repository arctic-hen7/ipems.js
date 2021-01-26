import "jest-extended";
import "jest-chain";

import createIpemsSpecialClass from "../src/specialClass";

describe("special classes", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	afterAll(() => {
		jest.clearAllMocks();
	});

	describe("createIpemsSpecialClass", () => {
		const IpemsSpecialClass = createIpemsSpecialClass("test");
		it("should create valid class", () => {
			expect(IpemsSpecialClass).toBeFunction();
		});
		it("should be initialised with paradigm from name", () => {
			expect(IpemsSpecialClass.IpemsInternal.classes).toStrictEqual({
				test: {
					types: {
						test: {
							severities: ["test"],
							params: [],
							encoders: {}, // This covers starting with no encoders
						},
					},
				},
			});
		});
	});
	describe("registerEncoders", () => {
		it("should allow registration of new encoders", () => {
			const IpemsSpecialClass = createIpemsSpecialClass("test");
			const register = {
				testEncoding: () => "This is a test operation-level encoder.",
			};
			IpemsSpecialClass.registerEncoders(register);

			expect(
				IpemsSpecialClass.IpemsInternal.classes.test.types.test.encoders // Yeah...
			).toStrictEqual(register);
		});
	});
	describe("error formation", () => {
		const IpemsSpecialClass = createIpemsSpecialClass("test");
		IpemsSpecialClass.registerEncoders({
			testEncoding: () => "This is a test operation-level encoder.",
		});
		it("should create instance with no arguments", () => {
			expect(new IpemsSpecialClass()).toBeInstanceOf(IpemsSpecialClass);
		});
		it.each([
			["details", "test"],
			["solutions", ["test"]],
			["fallback", "test"],
		])("should accept additional option '%s'", (optName, optValue) => {
			expect(
				new IpemsSpecialClass({
					[optName]: optValue,
				})
			).toBeInstanceOf(IpemsSpecialClass);
		});
	});
	describe("encodeAs", () => {
		it("should call internal core `encodeAs` function", () => {
			const IpemsSpecialClass = createIpemsSpecialClass("test");
			IpemsSpecialClass.registerEncoders({
				testEncoding: () => "This is a test operation-level encoder.",
			});
			const instance = new IpemsSpecialClass();
			// Mock the core's `encodeAs` function and check if it gets called (then we don't need to rewrite all the core tests)
			const coreFn = jest.spyOn(instance.ipemsInstance, "encodeAs");
			instance.encodeAs("testEncoding", {
				asErrorInstance: false,
			});

			expect(coreFn).toHaveBeenCalled();
			expect(coreFn.mock.calls[0][0]).toBe("testEncoding");
			expect(coreFn.mock.calls[0][1]).toStrictEqual({
				asErrorInstance: false,
			});
		});
	});
	describe("encodeAsDefault", () => {
		it("should initialise with default encoding `undefined`", () => {
			const IpemsSpecialClass = createIpemsSpecialClass("test");
			expect(IpemsSpecialClass.defaultEncoding).toBeUndefined();
			expect(() => {
				new IpemsSpecialClass().encodeAsDefault();
			}).toThrowError();
		});
		it("should allow default encoding to be set with setter", () => {
			const IpemsSpecialClass = createIpemsSpecialClass("test");
			IpemsSpecialClass.registerEncoders({
				testEncoding: () => "This is a test.",
			});
			IpemsSpecialClass.defaultEncoding = "testEncoding";
			expect(IpemsSpecialClass.defaultEncoding).toBe("testEncoding");
		});
		it("should call internal core `encodeAsDefault` function", () => {
			const IpemsSpecialClass = createIpemsSpecialClass("test");
			IpemsSpecialClass.registerEncoders({
				testEncoding: () => "This is a test operation-level encoder.",
			});
			IpemsSpecialClass.defaultEncoding = "testEncoding";
			const instance = new IpemsSpecialClass();
			// Mock the core's `encodeAs` function and check if it gets called (then we don't need to rewrite all the core tests)
			const coreFn = jest.spyOn(
				instance.ipemsInstance,
				"encodeAsDefault"
			);
			instance.encodeAsDefault({
				asErrorInstance: false,
			});

			expect(coreFn).toHaveBeenCalled();
			expect(coreFn.mock.calls[0][0]).toStrictEqual({
				asErrorInstance: false,
			});
		});
	});
});
