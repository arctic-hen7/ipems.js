import createIpems, { TIpems, IpemsInstance } from "./core";
import createIpemsOperation, { TIpemsOperationBase } from "./operation";
import {
	applyCoreDefaults,
	applyUnionDefaults,
	applyIntersectionDefaults,
	applyGenericDefaults,
	applyUnknownDefaults,
} from "./defaults";
import createIpemsSpecialClass, {
	IpemsSpecialClassInstance,
	TIpemsSpecialClass,
} from "./specialClass";

const createIpemsGeneric = createIpemsSpecialClass("generic");
const createIpemsUnknown = createIpemsSpecialClass("unknown");

export {
	applyCoreDefaults,
	applyUnionDefaults,
	applyIntersectionDefaults,
	createIpems,
	createIpemsOperation,
	TIpems,
	TIpemsOperationBase,
	IpemsInstance,
	createIpemsSpecialClass,
	TIpemsSpecialClass,
	IpemsSpecialClassInstance,
	applyGenericDefaults,
	createIpemsGeneric,
	applyUnknownDefaults,
	createIpemsUnknown,
};

/**
 * A function that creates an IPEMS class with the defaults.
 * We don't export this named because it should only be used in simple circumstances.
 */
export default (): TIpems => applyCoreDefaults(createIpems());
