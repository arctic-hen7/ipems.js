/**
 * A type for data error classes store.
 */
export type ErrorClassData = {
	types: Record<string, ErrorTypeData>;
};

/**
 * A type for the data types store.
 */
export type ErrorTypeData = {
	severities: string[];
	params: (string | ErrorTypeDataParamsObject)[];
	encoders: Record<string, Encoder>;
};

/**
 * A type for the `params` object of `ErrorTypeData`.
 */
export type ErrorTypeDataParamsObject = {
	name: string;
	required?: boolean; // Parameters default to required
	type?:
		| "string"
		| "number"
		| "bigint"
		| "boolean"
		| "object"
		| "function"
		// We don't allow `undefined` as a type, that's how we check if parameters are missing (null is fine though)
		| "symbol"; // Typeof check
};

/**
 * A type for the options provided as the fourth argument to the constructor.
 */
export type ErrorOptions = {
	params?: Record<string, unknown>;
	solutions?: string[];
	fallback?: string;
	details?: string;
};

/**
 * A type for encoder functions.
 */
export type Encoder = (
	options: EncoderOptions,
	customOptions?: Record<string, unknown>
) => string | unknown;

/**
 * A type for the options parsed to encoder functions (not including the custom options, they're a separate argument)
 */
export type EncoderOptions = ErrorOptions & {
	errorClass: string;
	type: string;
	severity: string;
	options: ErrorOptions;
	stringReturn: boolean; // Whether or not the encoder must return a string
};

/**
 * A type for operation-level encoders.
 */
export type OperationEncoder = (
	options: {
		encodings: (string | unknown)[]; // All the encodings to join together
		stringReturn: boolean;
	},
	customOptions?: Record<string, unknown>
) => string | unknown;
