/**
 * This file declares necessary utility functions.
 * This means this module is completely self-contained, and so can be imported by anything (its goal).
 */

/**
 * Checks if the given value is a string.
 */
export const isString = (value: string | unknown): value is string =>
	typeof value === "string";

/**
 * Checks if the given value is a string with content.
 */
export const isNonEmptyString = (value: string | unknown): value is string =>
	isString(value) && value !== "";

/**
 * Checks if the given value is an array.
 */
export const isArray = <ArrayType = unknown>(
	value: ArrayType[] | unknown
): value is ArrayType[] => Array.isArray(value);

/**
 * Checks if the given value is an array with elements.
 */
export const isNonEmptyArray = <ArrayType = unknown>(
	value: ArrayType[] | unknown
): value is ArrayType[] => isArray(value) && value.length >= 1;

/**
 * Checks if the given value is an object.
 */
export const isObject = <ValueType = Record<string, unknown>>(
	value: ValueType | unknown
): value is ValueType =>
	typeof value === "object" && !Array.isArray(value) && value !== null;

/**
 * Checks if the given value is an object with elements.
 */
export const isNonEmptyObject = <ValueType = Record<string, unknown>>(
	value: ValueType | unknown
): value is ValueType => isObject(value) && Object.keys(value).length >= 1;

/**
 * Checks if the given value is a boolean.
 */
export const isBoolean = (value: boolean | unknown): value is boolean =>
	typeof value === "boolean";

/**
 * Checks if the given value is `undefined`.
 */
export const isUndefined = (value: undefined | unknown): value is undefined =>
	value === undefined;

/**
 * Provides an incredibly useful type guard for checking if a given value is a property of an object.
 * This allows you to index objects without worrying about the pitfalls of TypeScript's implementation of `Object.keys`.
 * See https://fettblog.eu/typescript-better-object-keys/ for more info.
 * @param value the value to check
 * @param obj the object whose keys to check
 */
export const isPropertyInObj = <ObjectType extends { [prop: string]: unknown }>(
	value: keyof ObjectType | string,
	obj: ObjectType
): value is keyof ObjectType =>
	// The value needs to be a string to index the object
	// We check if the value is present in the object's keys
	// If it is, we return a type guard that the value is a key of the object we provided as the second parameter,
	// which is of type `ObjectType`.
	isNonEmptyString(value) && Object.keys(obj).indexOf(value) !== -1;
