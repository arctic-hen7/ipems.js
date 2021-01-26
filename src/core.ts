/**
 * This file defines classes, factories, and methods to do with core IPEMS functionality.
 */

import {
	isNonEmptyObject,
	isNonEmptyString,
	isNonEmptyArray,
	isBoolean,
	isUndefined,
} from "./utils";
import {
	Encoder,
	ErrorClassData,
	ErrorOptions,
	ErrorTypeData,
	ErrorTypeDataParamsObject,
} from "./types";

/**
 * A type for an instance of the `Ipems` class so we can type things as it. The class itself is locally scoped within a mixin,
 * so we can't access it.
 */
export type IpemsInstance = {
	errorClass: string;
	type: string;
	severity: string;
	options: ErrorOptions;

	encodeAs(
		encoding: string,
		options?: {
			asErrorInstance?: boolean;
			compositeForOperation?: boolean;
			[propName: string]: unknown;
		}
	): Error | unknown;

	encodeAsDefault(options?: {
		asErrorInstance?: boolean;
		compositeForOperation?: boolean;
		[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
	}): Error | unknown;
};

/**
 * A type for the `Ipems` class so we can type things as it. The class itself is locally scoped within a mixin,
 * so we can't access it.
 */
export type TIpems = {
	defaultEncoding: string;

	classes: Record<string, ErrorClassData>;

	new (
		errorClass: string,
		type: string,
		severity: string,
		options: ErrorOptions
	): IpemsInstance;

	registerClasses(classes: Record<string, ErrorClassData>): TIpems;

	registerTypesOnClass({
		types,
		classToRegisterOn,
	}: {
		types: Record<string, ErrorTypeData>;
		classToRegisterOn: string;
	}): TIpems;

	registerSeveritiesOnTypes({
		severities,
		classToRegisterOn,
		typesToRegisterOn,
	}: {
		severities: string[];
		classToRegisterOn: string;
		typesToRegisterOn: string[];
	}): TIpems;

	registerEncodersOnTypes({
		encoders,
		classToRegisterOn,
		typesToRegisterOn,
	}: {
		encoders: Record<string, Encoder>;
		classToRegisterOn: string;
		typesToRegisterOn: string[];
	}): TIpems;
};

/**
 * A factory function to create IPEMS classes with their own registry of error classes. Users should call this every time they
 * want to create a new IPEMS class. This prevents registry pollution for modules upon which a program may depend. Otherwise,
 * if the user declares some custom error class that a module has also declared, the one run second will override the former,
 * resulting in undefined behaviour.
 */
export default (): TIpems =>
	/**
	 * The root object for the whole module on which error classes, severities, and encodings are directly registered.
	 * You shouldn't extend this object directly, make a copy first with the spread operator.
	 */
	class Ipems {
		/**
		 * The default encoding to use. This SHOULD be preferred over specifying a literal encoding, because it allows end users
		 * to modify it according to their needs. Libraries SHOULD export a function to change this value.
		 */
		static defaultEncoding: string;

		static classes: Record<string, ErrorClassData> = {};

		errorInstance: Error;

		/**
		 * Initialises a new error acccording to the IPEMS specification.
		 * @param errorClass the error class for this new error
		 * @param type the type in that error class for this new error
		 * @param severity the severity in that type for this new error
		 * @param options options this new error
		 * @param options.params parameters to the type for initialising this new error
		 * @param options.solutions potential solutions to this new error
		 * @param options.fallback an optional fallback being taken to mitigate the effects of this error (only needed with severities that don't signal jeopardising AOPs)
		 * @param options.details freeform string further details for this new error
		 */
		constructor(
			public errorClass: string,
			public type: string,
			public severity: string,
			public options: ErrorOptions
		) {
			if (!Object.keys(Ipems.classes).includes(errorClass))
				throw new Error(
					`error class '${errorClass}' doesn't exist, please register it first or use a different error class`
				);
			if (!isNonEmptyObject(Ipems.classes[errorClass].types[type]))
				throw new Error(
					`error type '${type}' doesn't exist on error class '${errorClass}', please register it first or use a different error type`
				);
			if (
				!Ipems.classes[errorClass].types[type].severities.includes(
					severity
				)
			)
				throw new Error(
					`error severity '${severity}' doesn't exist on error class '${errorClass}' and error type '${type}', please register it first or use a different error severity`
				);

			// Validate the additional options
			if (
				options.solutions &&
				(!isNonEmptyArray(options.solutions) ||
					!options.solutions?.every(isNonEmptyString))
			)
				throw new Error(
					"additional option `solutions` must be an array of non-empty strings"
				);
			if (options.fallback && !isNonEmptyString(options.fallback))
				throw new Error(
					"additional option `fallback` must be a non-empty string"
				);
			if (options.details && !isNonEmptyString(options.details))
				throw new Error(
					"additional option `details` must be a non-empty string"
				);

			// Validate the parameters
			const setParams = Ipems.classes[errorClass].types[type].params;
			const { params } = options;
			setParams.forEach(setParamR => {
				// Parameters can be provided either as simple string names or objects defining their name, type, and whether
				// or not they're required. For ease, we process the simple strings into the full objects.
				let setParam: ErrorTypeDataParamsObject;
				if (isNonEmptyString(setParamR))
					setParam = {
						name: setParamR,
						required: true,
					};
				else if (!isBoolean(setParamR.required))
					// Default to parameters being required
					setParam = { ...setParamR, required: true };
				else setParam = setParamR;

				// TODO: check for no parameters and collate a list of needed parameters

				const givenParam = params?.[setParam.name];

				// If the parameter wasn't given, but also wasn't required, don't do anything
				if (!setParam.required && isUndefined(givenParam)) return;

				// If it was required but wasn't given, throw
				if (setParam.required && isUndefined(givenParam))
					throw new Error(
						`required parameter '${setParam.name}' was not provided for type '${type}' on error class '${errorClass}'`
					);

				// If a type was to be enforced but wasn't obeyed, throw
				if (setParam.type && typeof givenParam !== setParam.type)
					throw new Error(
						`parameter '${setParam.name}' must be of type '${
							setParam.type
						}', but was instead of type '${typeof givenParam}' for type '${type}' on error class '${errorClass}'`
					);
			});

			this.errorInstance = new Error();
		}

		/**
		 * Registers a series of new error classes on the root object.
		 * @param classes the new classes to register
		 */
		public static registerClasses(
			classes: Record<string, ErrorClassData>
		): typeof Ipems {
			if (!isNonEmptyObject(classes))
				throw new Error("invalid classes provided");

			this.classes = { ...this.classes, ...classes };
			return this;
		}

		/**
		 * Registers a series of new types on a given class.
		 * @param options
		 * @param options.types the new types to register
		 * @param options.classToRegisterOn the existing class to register on
		 */
		public static registerTypesOnClass({
			types,
			classToRegisterOn,
		}: {
			types: Record<string, ErrorTypeData>;
			classToRegisterOn: string;
		}): typeof Ipems {
			if (!isNonEmptyObject(types))
				throw new Error("invalid types provided");
			if (!isNonEmptyString(classToRegisterOn))
				throw new Error("invalid class to register on provided");
			if (!Object.keys(this.classes).includes(classToRegisterOn))
				throw new Error(
					`error class '${classToRegisterOn}' to register types on has not yet been globally registered`
				);

			this.classes[classToRegisterOn].types = {
				...this.classes[classToRegisterOn].types,
				...types,
			};

			return this;
		}

		/**
		 * Registers a series of new severities on multiple given types on a given class.
		 * @param options
		 * @param options.severities the new severities to register
		 * @param options.classToRegisterOn the existing class to register on
		 * @param options.typesToRegisterOn the existing types on that class to register on
		 */
		public static registerSeveritiesOnTypes({
			severities,
			classToRegisterOn,
			typesToRegisterOn,
		}: {
			severities: string[];
			classToRegisterOn: string;
			typesToRegisterOn: string[];
		}): typeof Ipems {
			if (!isNonEmptyArray(severities))
				throw new Error("invalid severities provided");
			if (!isNonEmptyString(classToRegisterOn))
				throw new Error("invalid class to register on provided");
			if (!Object.keys(this.classes).includes(classToRegisterOn))
				throw new Error(
					`error class '${classToRegisterOn}' to register types on has not yet been globally registered`
				);
			if (!isNonEmptyArray(typesToRegisterOn))
				throw new Error(
					`invalid types to register on error class '${classToRegisterOn}'`
				);
			if (
				!typesToRegisterOn.every(typeToRegisterOn =>
					Object.keys(this.classes[classToRegisterOn].types).includes(
						typeToRegisterOn
					)
				)
			)
				throw new Error(
					`one or more of the error types you're trying to register on '${classToRegisterOn}' has not yet been registered on that error class`
				);

			typesToRegisterOn.forEach(typeToRegisterOn =>
				this.classes[classToRegisterOn].types[
					typeToRegisterOn
				].severities.push(...severities)
			);

			return this;
		}

		/**
		 * Registers a series of new encoders on multiple given types on a given class.
		 * @param options
		 * @param options.encoders the new encodings to register
		 * @param options.classToRegisterOn the existing class to register on
		 * @param options.typesToRegisterOn the existing types on that class to register on
		 */
		public static registerEncodersOnTypes({
			encoders,
			classToRegisterOn,
			typesToRegisterOn,
		}: {
			encoders: Record<string, Encoder>;
			classToRegisterOn: string;
			typesToRegisterOn: string[];
		}): typeof Ipems {
			if (!isNonEmptyObject(encoders))
				throw new Error("invalid encoders provided");
			if (!isNonEmptyString(classToRegisterOn))
				throw new Error("invalid class to register on provided");
			if (!Object.keys(this.classes).includes(classToRegisterOn))
				throw new Error(
					`error class '${classToRegisterOn}' to register types on has not yet been globally registered`
				);
			if (!isNonEmptyArray(typesToRegisterOn))
				throw new Error(
					`invalid types to register on error class '${classToRegisterOn}'`
				);
			if (
				!typesToRegisterOn.every(typeToRegisterOn =>
					Object.keys(this.classes[classToRegisterOn].types).includes(
						typeToRegisterOn
					)
				)
			)
				throw new Error(
					`one or more of the error types you're trying to register on '${classToRegisterOn}' has not yet been registered on that error class`
				);

			typesToRegisterOn.forEach(typeToRegisterOn => {
				this.classes[classToRegisterOn].types[
					typeToRegisterOn
				].encoders = {
					...this.classes[classToRegisterOn].types[typeToRegisterOn]
						.encoders,
					...encoders,
				};
			});

			return this;
		}

		/**
		 * Encodes the error somehow. Note that the specified encoder must be implemented by the error's type.
		 * Wherever possible, prefer `encodeAsDefault`.
		 * @param encoding the encoding to use (must be implemented on the type)
		 * @param options
		 * @param options.asErrorInstance whether or not the final return should be an instance of `Error`
		 * @param options.compositeForOperation whether or not this is being called by an operation like `IpemsUnion` (users should almost never set this manually, see docs)
		 */
		public encodeAs(
			encoding: string,
			options?: {
				asErrorInstance?: boolean;
				compositeForOperation?: boolean;
				[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
			}
		): Error | unknown {
			const asErrorInstance =
				isNonEmptyObject(options) && isBoolean(options.asErrorInstance)
					? options.asErrorInstance
					: true; // The majority of cases will want an error
			const compositeForOperation =
				isNonEmptyObject(options) &&
				isBoolean(options.compositeForOperation)
					? options.compositeForOperation
					: false; // The majority of cases will not be called by an operation

			// Encodings are specifications, its up to error types to implement them properly.
			// Therefore, here we call the encoder methods the type should've implemented.
			// If it doesn't exist, we'll throw, otherwise, we'll return whatever it returns!
			const encoder =
				Ipems.classes[this.errorClass].types[this.type].encoders[
					encoding
				];
			if (typeof encoder !== "function")
				throw new Error(
					`the error type '${this.type}' (on class '${this.errorClass}') does not implement the requested encoding '${encoding}'`
				);

			const encoded = encoder(
				{
					...this.options,
					errorClass: this.errorClass,
					type: this.type,
					severity: this.severity,
					options: this.options,
					stringReturn: asErrorInstance, // If we need to return an instance of `Error`, the message has to be a string (this will be the message)
				},
				options // This parses through the user's custom options
			);
			if (asErrorInstance) {
				if (typeof encoded !== "string")
					throw new Error(
						`encoder '${encoding}' for error type '${this.type}' on class ${this.errorClass} was ordered to return a string but didn't`
					);

				// If this is being called as one of multiple encodings by an operation, then we won't wrap it in an error
				// Otherwise operation-level encoders would have to extract the `message` property
				if (compositeForOperation) return encoded;

				this.errorInstance.message = encoded;
				return this.errorInstance;
			}

			return encoded;
		}

		/**
		 * Encodes the error in the default encoding specified globally. That needs to be set with
		 * `Ipems.defaultEncoding = "blah"` first.
		 * This should be preferred to `encodeAs` in most cases.
		 * @param options
		 * @param options.asErrorInstance whether or not the final return should be an instance of `Error`
		 * @param options.compositeForOperation whether or not this is being called by an operation like `IpemsUnion` (users should almost never set this manually, see docs)
		 */
		public encodeAsDefault(options?: {
			asErrorInstance?: boolean;
			compositeForOperation?: boolean;
			[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
		}): Error | unknown {
			return this.encodeAs(Ipems.defaultEncoding, options);
		}
	};
