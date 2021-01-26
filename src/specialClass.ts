import createIpems, { IpemsInstance, TIpems } from "./core";
import { Encoder, ErrorOptions } from "./types";

export type IpemsSpecialClassInstance = {
	ipemsInstance: IpemsInstance;

	encodeAs(
		encoding: string,
		options?: {
			asErrorInstance?: boolean;
			compositeForOperation?: boolean;
			[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
		}
	): Error | unknown;

	encodeAsDefault(options?: {
		asErrorInstance?: boolean;
		compositeForOperation?: boolean;
		[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
	}): Error | unknown;
};

export type TIpemsSpecialClass = {
	IpemsInternal: TIpems;
	defaultEncoding: string; // This substitutes the getter/setter methods from `_defaultEncoding`
	new (options?: ErrorOptions): IpemsSpecialClassInstance;

	registerEncoders(encoders: Record<string, Encoder>): TIpemsSpecialClass;
};

const createIpemsSpecialClass = (name: string): TIpemsSpecialClass => {
	const IpemsInternal = createIpems();
	IpemsInternal.registerClasses({
		[name]: {
			types: {
				[name]: {
					severities: [name],
					params: [],
					encoders: {},
				},
			},
		},
	});

	return class IpemsSpecialClass {
		static _defaultEncoding: string;

		static IpemsInternal: TIpems = IpemsInternal;

		/**
		 * An internal instance of the core IPEMS class for managing errors without replicating most of `./ipems.ts`
		 */
		ipemsInstance: IpemsInstance;

		/**
		 * Initialises a new generic error acccording to the IPEMS specification.
		 * @param options options this new error
		 * @param options.solutions potential solutions to this new error
		 * @param options.fallback an optional fallback being taken to mitigate the effects of this error (only needed with severities that don't signal jeopardising AOPs)
		 * @param options.details freeform string further details for this new error
		 */
		constructor(options?: ErrorOptions) {
			this.ipemsInstance = new IpemsSpecialClass.IpemsInternal(
				name,
				name,
				name,
				{
					...options,
				}
			);
		}

		public static get defaultEncoding(): string {
			return this._defaultEncoding;
		}

		// We need this so we can also set the `IpemsInternal` default encoding
		public static set defaultEncoding(value: string) {
			this._defaultEncoding = value;
			this.IpemsInternal.defaultEncoding = value;
		}

		/**
		 * Registersm a series of new encodings on the `IpemsSpecialClass` object.
		 * @param encoders the new encoders to add
		 */
		public static registerEncoders(
			encoders: Record<string, Encoder>
		): typeof IpemsSpecialClass {
			this.IpemsInternal.registerEncodersOnTypes({
				encoders,
				typesToRegisterOn: [name],
				classToRegisterOn: name,
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
			return this.ipemsInstance.encodeAs(encoding, options);
		}

		/**
		 * Encodes the error in the default encoding specified globally. That needs to be set with
		 * `IpemsSpecialClass.defaultEncoding = "blah"` first.
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
			return this.ipemsInstance.encodeAsDefault(options);
		}
	};
};

export default createIpemsSpecialClass;
