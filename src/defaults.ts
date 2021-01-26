/**
 * This file defines the default scheme of classes, types, severities, encodings, and operations as per the IPEMS
 * specification. The IPEMS class exported from here MUST be the default export of this module.
 */

import { isNonEmptyString, isPropertyInObj } from "./utils";

import { TIpems } from "./core";
import { TIpemsOperationBase } from "./operation";
import { TIpemsSpecialClass } from "./specialClass";
import { Encoder, EncoderOptions } from "./types";
import {
	severities as severityCodes,
	classes as classCodes,
} from "./codes.json";
import nonTechnicalTypeExplanations from "./nonTechnicalTypeExplanations.json";

/**
 * A type for the parameters parsed to the `createMessage` function for the `nonTechnical` encoding.
 */
type NonTechnicalMessageCreatorProps = {
	numeric: unknown | string;
	short: unknown | string;
	typeExplanation: string;
};

/**
 * A type for the parameters parsed to the `createMessage` function for the `nonTechnical` operation-level encoding.
 */
type NonTechnicalOperationMessageCreatorProps = {
	encodings: unknown[];
};

/**
 * A utility function to capitalise the first letter of a string. This will not capitalise the first letter of each word.
 * @param str the string for which to capitalise the first letter
 */
const capitaliseFirstLetter = (str: string) =>
	str.charAt(0).toUpperCase() + str.slice(1);

// OPERATIONS
/**
 * Registers the default operation-level encodings on an IPEMS Union class.
 */
export const applyUnionDefaults = (
	IpemsUnionClass: TIpemsOperationBase
): TIpemsOperationBase => {
	// eslint-disable-next-line no-param-reassign
	IpemsUnionClass.defaultEncoding = "standard";
	IpemsUnionClass.registerEncoders({
		full: ({ encodings }) => encodings.join("|"),
		short: ({ encodings }) => encodings.join(" | "),
		numeric: ({ encodings }) => encodings.join(" | "),
		standard: ({ encodings }) => encodings.join(" OR "),
		verbose: ({ encodings }) =>
			`UnionError (the error could be any one of the following):\n${encodings.join(
				"\n--- OR ---\n"
			)}`,
		// The user can specify one `createMessage` for components and another for operations
		nonTechnical: ({ encodings }, customOpts) => {
			// According to the spec, non-technical form should call a callback allowing the user to string everything together
			const createMessage = customOpts?.createMessage as
				| ((
						options: NonTechnicalOperationMessageCreatorProps
				  ) => string)
				| undefined;
			if (typeof createMessage !== "function")
				throw new Error(
					"for the non-technical encoding, you must provide a `createMessage` function to create the final message out of multiple components, which will be parsed to that function (see the docs for more)"
				);

			// Leave the rest up to the user
			return createMessage({
				encodings,
			});
		},
	});
	return IpemsUnionClass;
};

/**
 * Registers the default operation-level encodings on an IPEMS Union class.
 */
export const applyIntersectionDefaults = (
	IpemsIntersectionClass: TIpemsOperationBase
): TIpemsOperationBase => {
	// eslint-disable-next-line no-param-reassign
	IpemsIntersectionClass.defaultEncoding = "standard";
	IpemsIntersectionClass.registerEncoders({
		full: ({ encodings }) => encodings.join("&"),
		short: ({ encodings }) => encodings.join(" & "),
		numeric: ({ encodings }) => encodings.join(" & "),
		standard: ({ encodings }) => encodings.join(" AND "),
		verbose: ({ encodings }) =>
			`IntersectionError (the error qualifies as all of the following simultaneously):\n${encodings.join(
				"\n--- AND ---\n"
			)}`,
		// The user can specify one `createMessage` for components and another for operations
		nonTechnical: ({ encodings }, customOpts) => {
			// According to the spec, non-technical form should call a callback allowing the user to string everything together
			const createMessage = customOpts?.createMessage as
				| ((
						options: NonTechnicalOperationMessageCreatorProps
				  ) => string)
				| undefined;
			if (typeof createMessage !== "function")
				throw new Error(
					"for the non-technical encoding, you must provide a `createMessage` function to create the final message out of multiple components, which will be parsed to that function (see the docs for more)"
				);

			// Leave the rest up to the user
			return createMessage({
				encodings,
			});
		},
	});
	return IpemsIntersectionClass;
};

// IPEMS

/**
 * The encoders that don't differ between types.
 */
const universalEncoders: Record<string, Encoder> = {
	short: ({ errorClass, type, severity }) =>
		`${capitaliseFirstLetter(errorClass)}${capitaliseFirstLetter(
			type
		)}${capitaliseFirstLetter(severity)}`,
	numeric: ({ errorClass, type, severity }) => {
		if (!isPropertyInObj(errorClass, classCodes))
			throw new Error(
				`no numeric code has been specified for error class '${errorClass}'; this is a library issue, please file an issue`
			);
		if (!isPropertyInObj(type, classCodes[errorClass].types))
			throw new Error(
				`no numeric code has been specified for error type '${type}' on class '${errorClass}'; this is a library issue, please file an issue`
			);
		if (!isPropertyInObj(severity, severityCodes))
			throw new Error(
				`no numeric code has been specified for severity '${severity}'; this is a library issue, please file an issue`
			);

		// Form: `[Class][Type]-[Severity]`
		// These could be confused with HTTP status codes, but its the user's responsibility to deal with that in transport (e.g. prepend with `IPEMS`)
		return `${classCodes[errorClass].code}${classCodes[errorClass].types[type]}-${severityCodes[severity]}`;
	},
	full: opts => {
		const optionsStr = JSON.stringify(opts.options);
		const short = universalEncoders.short(opts);

		return `${short}(${optionsStr})`;
	},
	nonTechnical: (opts, customOpts) => {
		// According to the spec, non-technical form should call a callback allowing the user to string everything together
		const createMessage = customOpts?.createMessage as
			| ((options: NonTechnicalMessageCreatorProps) => string)
			| undefined;
		if (typeof createMessage !== "function")
			throw new Error(
				"for the non-technical encoding, you must provide a `createMessage` function to create the final message out of multiple components, which will be parsed to that function (see the docs for more)"
			);
		if (!isPropertyInObj(opts.errorClass, nonTechnicalTypeExplanations))
			throw new Error(
				`no non-technical explanation has been specified for error class '${opts.errorClass}'; this is a library issue, please file an issue`
			);
		if (
			!isPropertyInObj(
				opts.type,
				nonTechnicalTypeExplanations[opts.errorClass]
			)
		)
			throw new Error(
				`no non-technical explanation has been specified for error type '${opts.type}' on class '${opts.errorClass}'; this is a library issue, please file an issue`
			);

		// We need to parse numeric and short form to the callback
		const numeric = universalEncoders.numeric(opts, customOpts);
		const short = universalEncoders.short(opts, customOpts);

		// Leave the rest up to the user
		return createMessage({
			numeric,
			short,
			typeExplanation:
				nonTechnicalTypeExplanations[opts.errorClass][opts.type],
		});
	},
};

/**
 * Abstracts the code to easily create an encoding for the `standard` format.
 * @param messageCreator a function to create the actual message, it's parsed the encoder's options
 */
const createStandardEncoder = (
	messageCreator: (opts: EncoderOptions) => string
): Encoder => opts => {
	const short = universalEncoders.short(opts);
	const message = messageCreator(opts);

	return `${short}: ${message}`;
};

/**
 * Abstracts the code to easily create an encoding for the `verbose` format.
 * @param messageCreator a function to create the actual message, it's parsed the encoder's options
 */
const createVerboseEncoder = (
	messageCreator: (opts: EncoderOptions) => string
): Encoder => opts => {
	const {
		options: { solutions, fallback, details },
	} = opts;
	const solutionsStr = solutions?.length
		? `Possible solutions to this problem are: \n\t\t• ${solutions?.join(
				"\n\t\t• "
		  )}`
		: "No solutions to this problem were provided.";
	const fallbackStr = isNonEmptyString(fallback)
		? `To try to work around the problem, this program will now run fallback logic:\n\t\t${fallback}`
		: "No fallback to attempt to automatically work around this problem was provided."; // Don't insert anything if no fallback was specified
	const detailsStr = isNonEmptyString(details)
		? `The following further details were provided about this problem:\n\t\t${details}`
		: "No further details are available about this problem.";
	const short = universalEncoders.short(opts);

	const message = messageCreator(opts);

	return `${short}:\n\t${message}\n\t${fallbackStr}\n\t${detailsStr}\n\t${solutionsStr}`;
};

/**
 * Registers the default error classes, types, severities, and encodings on an IPEMS class.
 */
export const applyCoreDefaults = (IpemsClass: TIpems): TIpems => {
	// eslint-disable-next-line no-param-reassign
	IpemsClass.defaultEncoding = "standard";
	IpemsClass.registerClasses({
		caller: {
			types: {
				generic: {
					severities: ["critical", "error", "warning"],
					params: [],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							() => "generic problem from function caller"
						),
						verbose: createVerboseEncoder(
							() =>
								"A generic problem occurred, caused by the caller of this function. Further details may be available below."
						),
					},
				},
				parameter: {
					severities: ["critical", "error", "warning"],
					params: [
						{
							name: "invalidParam",
							type: "string",
						},
						{
							name: "validityPrereqs",
							type: "object", // Array of form `["array", "each element contains '/'"]`
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`invalid parameter '${params?.invalidParam}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`The value of the parameter '${
									params?.invalidParam
								} is invalid. For it to be accepted, it must meet the following criteria:\n\t\t• ${(params?.validityPrereqs as string[]).join(
									"\n\t\t• "
								)}`
						),
					},
				},
			},
		},
		callee: {
			types: {
				generic: {
					severities: ["critical", "error", "warning"],
					params: [],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							() => "generic problem from called function"
						),
						verbose: createVerboseEncoder(
							() =>
								"A generic problem occurred, caused by an internal function this function depends on. Further details may be available below."
						),
					},
				},
				return: {
					severities: ["critical", "error", "warning"],
					params: [
						{
							name: "invalidPart", // `all` if the whole return value is invalid
							type: "string",
						},
						{
							name: "validityPrereqs",
							type: "object", // Array of form `["array", "each element contains '/'"]`
						},
						{
							name: "componentName", // The internal resource that failed
							type: "string",
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`invalid component '${params?.invalidPart}' returned from '${params?.componentName}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`A function this program depends on, '${
									params?.componentName
								}', returned an invalid value for one of its return parameters, '${
									params?.invalidPart
								}'. To be valid, it needs to meet the following criteria:\n\t\t• ${(params?.validityPrereqs as string[]).join(
									"\n\t\t• "
								)}`
						),
					},
				},
			},
		},
		// No critical errors are allowed for `User`-class errors,
		// the application should handle them as gracefully as possible.
		user: {
			types: {
				generic: {
					severities: ["error", "warning"],
					params: [],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							() => "generic user problem"
						),
						verbose: createVerboseEncoder(
							() =>
								"A generic problem occurred, caused by some action the user took. Further details may be available below."
						),
					},
				},
				input: {
					severities: ["error", "warning"],
					params: [
						{
							name: "inputName",
							type: "string",
						},
						{
							name: "validityPrereqs",
							type: "object", // Array of form `["array", "each element contains '/'"]`
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`invalid user input '${params?.inputName}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`The user inputted invalid data in the input '${
									params?.inputName
								}'. To be valid, it needs to meet the following criteria:\n\t\t• ${(params?.validityPrereqs as string[]).join(
									"\n\t\t• "
								)}`
						),
					},
				},
				authentication: {
					severities: ["error", "warning"],
					params: [
						{
							name: "inputName",
							type: "string",
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`authentication problem from user input '${params?.inputName}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`The user inputted data in the input '${params?.inputName}' that caused an authentication problem. This probably means the user got their password wrong or the like.`
						),
					},
				},
			},
		},
		external: {
			types: {
				generic: {
					severities: ["critical", "error", "warning"],
					params: [],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							() => "generic problem from external resource"
						),
						verbose: createVerboseEncoder(
							() =>
								"A generic problem occurred, caused by an external resource this function depends on. Further details may be available below."
						),
					},
				},
				return: {
					severities: ["critical", "error", "warning"],
					params: [
						{
							name: "invalidPart", // `all` if the whole return value is invalid
							type: "string",
						},
						{
							name: "validityPrereqs",
							type: "object", // Array of form `["array", "each element contains '/'"]`
						},
						{
							name: "resourceName",
							type: "string",
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`invalid component '${params?.invalidPart}' returned from '${params?.resourceName}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`An external resource this program depends on, '${
									params?.resourceName
								}', returned an invalid value for one of its return parameters, '${
									params?.invalidPart
								}'. To be valid, it needs to meet the following criteria:\n\t\t• ${(params?.validityPrereqs as string[]).join(
									"\n\t\t• "
								)}`
						),
					},
				},
				network: {
					severities: ["critical", "error", "warning"],
					params: [{ name: "resourceName", type: "string" }],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`network problem while trying to connect to '${params?.resourceName}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`The program tried to connect to the external resource '${params?.resourceName}' over the network, but some kind of network error occurred. Further details may be available below.`
						),
					},
				},
			},
		},
		system: {
			types: {
				generic: {
					severities: ["critical", "error", "warning"],
					params: [],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							() => "generic system-level problem"
						),
						verbose: createVerboseEncoder(
							() =>
								"A generic system problem occurred. Further details may be available below."
						),
					},
				},
				permissions: {
					severities: ["critical", "error", "warning"],
					params: [
						{ name: "problemFileOrDir", type: "string" },
						{ name: "neededPermissions", type: "object" },
						{ name: "missingPermissions", type: "object" },
						{
							name: "whyPermissionsNeeded",
							required: false,
							type: "object",
						},
					],
					encoders: {
						...universalEncoders,
						standard: createStandardEncoder(
							({ params }) =>
								`missing permissions (${(params?.missingPermissions as string[]).join(
									", "
								)}) to interface with file/directory '${
									params?.problemFileOrDir
								}'`
						),
						verbose: createVerboseEncoder(
							({ params }) =>
								`The program tried to interface with the file/directory '${
									params?.problemFileOrDir
								}', and to do so the following permissions are needed: \n\t\t• ${(params?.neededPermissions as string[]).join(
									"\n\t\t• "
								)}\n\tHowever, the following permissions are missing: \n\t\t• ${(params?.missingPermissions as string[]).join(
									"\n\t\t• "
								)}`
						),
					},
				},
			},
		},
	});
	return IpemsClass;
};

// SPECIAL CLASSES

export const applyGenericDefaults = (
	IpemsGeneric: TIpemsSpecialClass
): TIpemsSpecialClass => {
	// eslint-disable-next-line no-param-reassign
	IpemsGeneric.defaultEncoding = "standard";
	IpemsGeneric.registerEncoders({
		...universalEncoders,
		standard: createStandardEncoder(() => "generic program problem"),
		verbose: createVerboseEncoder(
			() =>
				"A generic problem occurred. This type is usually used when incrementally adopting IPEMS, and conveys no further information. Further details may be available below."
		),
	});

	return IpemsGeneric;
};

export const applyUnknownDefaults = (
	IpemsUnknown: TIpemsSpecialClass
): TIpemsSpecialClass => {
	// eslint-disable-next-line no-param-reassign
	IpemsUnknown.defaultEncoding = "standard";
	IpemsUnknown.registerEncoders({
		...universalEncoders,
		standard: createStandardEncoder(() => "unknown program problem"),
		verbose: createVerboseEncoder(
			() =>
				"An unknown problem occurred. This type is usually used when no definite information about an error is yet available. Further details may be available below."
		),
	});

	return IpemsUnknown;
};
