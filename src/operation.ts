/**
 * This file defines classes and factories to do with IPEMS operations.
 */

import { isNonEmptyObject, isBoolean } from "./utils";
import { IpemsInstance } from "./core";
import { OperationEncoder } from "./types";

/**
 * A type for the `IpemsOperationBase` class so we can type things as it. The class itself is locally scoped within a mixin,
 * so we can't access it.
 */
export interface TIpemsOperationBase {
	new (...instances: IpemsInstance[]): {
		instances: IpemsInstance[];
		encodeAs(
			encoding: string,
			options?: {
				asErrorInstance?: boolean;
				optsForOperation?: Record<string, unknown>;
				optsForComponents?: Record<string, unknown>;
			}
		): Error | unknown;

		encodeAsDefault(options?: {
			asErrorInstance?: boolean;
			compositeForOperation?: boolean;
			[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
		}): Error | unknown;
	};
	encoders: Record<string, OperationEncoder>;

	defaultEncoding: string;

	registerEncoders(
		encoders: Record<string, OperationEncoder>
	): TIpemsOperationBase;
}

/**
 * A factory function to create non-extendable operation classes in IPEMS. Users will very rarely have uses for these.
 * This function powers the `IpemsUnion` and `IpemsIntersection` operations.
 */
export default (): TIpemsOperationBase =>
	/**
	 * An operation that takes multiple IPEMS instances and holds its own operation-level encoders. These can be registered and
	 * used to join together encodings of multiple different IPEMS instances. No encoders are registered by default.
	 *
	 * We can't have private/protected properties in a class expression.
	 */
	class IpemsOperationBase {
		instances: IpemsInstance[];

		static defaultEncoding: string;

		static encoders: Record<string, OperationEncoder> = {};

		/**
		 * @param instances instances to operate on
		 */
		constructor(...instances: IpemsInstance[]) {
			// We superficially check if ther user has encoded any of the instances (common mistake)
			if (
				!instances.every(
					instance =>
						typeof instance === "object" && // We make sure it's an object (proper isntances will be)
						!(instance instanceof Error) // Encodings will by default use Error instances, so we'll make sure we don't have an Error
				)
			)
				throw new Error("you must not provide encoded instances");

			this.instances = instances;
		}

		/**
		 * Registers a series of new operation-level encoders on the root.
		 * @param classes the new classes to register
		 */
		public static registerEncoders(
			encoders: Record<string, OperationEncoder>
		): typeof IpemsOperationBase {
			if (!isNonEmptyObject(encoders))
				throw new Error("invalid encoders provided");

			this.encoders = { ...this.encoders, ...encoders };
			return this;
		}

		/**
		 * Encodes all component instances and strings them together with an operation-level encoder.
		 * @param encoding the encoding to use (must be implemented on all types and registered on `IpemsOperation`)
		 * @param options
		 * @param options.asErrorInstance whether or not the final return should be an instance of `Error`
		 * @param options.optsForOperation options to provide to each of the components of the operation (e.g. `createMessage` for the `nonTechnical` encoding format in the defaults)
		 * @param options.optsForComponents options to provide to the operation itself (e.g. `createMessage` for the `nonTechnical` encoding format in the defaults)
		 */
		public encodeAs(
			encoding: string,
			options?: {
				asErrorInstance?: boolean;
				optsForOperation?: Record<string, unknown>;
				optsForComponents?: Record<string, unknown>;
			}
		): Error | unknown {
			const asErrorInstance =
				isNonEmptyObject(options) && isBoolean(options.asErrorInstance)
					? options.asErrorInstance
					: true; // The majority of cases will want an error

			// We get encodings for all the component instances
			// Then we call the operation's implementation of this same encoding to string them all toegether
			const encodings = this.instances.map(instance =>
				// If the user wanted it in `Error` form, we'll take the stirng message, but refuse the `Error` wrapping
				// This is more convenient for operation-level encoders
				instance.encodeAs(encoding, {
					...options,
					...options?.optsForComponents, // This parses through custom options
					compositeForOperation: true,
				})
			);

			// An operation-level encoder's only function is to string multiple encoded errors together and return
			const operationEncoder = IpemsOperationBase.encoders[encoding];
			if (typeof operationEncoder !== "function")
				throw new Error(
					`this operation does not implement the requested encoding '${encoding}', please register it`
				);

			const encoded = operationEncoder(
				{
					encodings,
					stringReturn: asErrorInstance,
				},
				options?.optsForOperation // Operation-level encoders also get custom options
			);
			if (asErrorInstance) {
				if (typeof encoded !== "string")
					throw new Error(
						`encoder '${encoding}' in an operation was ordered to return a string but didn't`
					);

				return new Error(encoded);
			}

			return encoded;
		}

		public encodeAsDefault(options?: {
			asErrorInstance?: boolean;
			compositeForOperation?: boolean;
			[propName: string]: unknown; // Types should be able to have/need specific options passed to their encoders
		}): Error | unknown {
			return this.encodeAs(IpemsOperationBase.defaultEncoding, options);
		}
	};
