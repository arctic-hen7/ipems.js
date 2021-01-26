# IPEMS Default Paradigm Cheatsheet

IPEMS uses *paradigms* to organize groups of classes, types, severities, and encodings. The default paradigm is the main one, but you can add your own classes, types, severities, and encodings to it if you want. This document is a brief rundown of each class, type, severity, and encoding in the default paradigm. A good deal of this is copied directly from the [basic introduction to IPEMS](https://github.com/arctic-hen7/ipems/blob/main/protocol/basic-introduction.md).

## Classes and Types

- **Caller:**
	- **Parameter:** For errors where whatever called the function provided an invalid parameter (e.g. a user of your module provided a string instead of a number).
		- (REQUIRED) `invalidParam` - Name of the invalid parameter
		- (REQUIRED) `validityPrereqs` - Conditions for it to be valid
- **Callee:**
	- **Return:** For errors where another function you wrote, which your function depends on, returned invalid data. Don't use this for external resources like servers or databases. See below for using this with modules.
		- (REQUIRED) `componentName` - Name of the callee (function that stuffed up)
		- (REQUIRED) `invalidPart` - Part of the return value that was invalid
		- (REQUIRED) `validityPrereqs` - Conditions for it to be valid
- **External:**
	- **Return:** For errors where an external resource (like a server or database) that your function depends on returned invalid data. Don't use this for internal functions you've written. See below for using this with modules.
		- (REQUIRED) `resourceName` - Name of the external resource
		- (REQUIRED) `invalidPart` - Part of the return value that was invalid
		- (REQUIRED) `validityPrereqs` - Conditions for it to be valid
	- **Network:** For errors where your function can't connect to an external resource. Don't use this if a server for example tells you a resource isn't found, only use it if you can't connect to the server at all. This usually means the user is having connection problems.
		- (REQUIRED) `resourceName` - Name of the external resource
- **User:** (doesn't support the *Critical* severity because errors coming from the user should always be handled gracefully, they should never be able to shut down a whole app)
	- **Input:** For errors where something the user inputted (e.g. their email into a form field on a website) was invalid (say they didn't include '@' in the email address).
		- (REQUIRED) `inputName` - Name of the input field where the user entered invalid data
		- (REQUIRED) `validityPrereqs` - Conditions for it to be valid
	- **Authentication:** For errors where the user entered a value that resulted in an authentication failure. This is usually an incorrect password, but it could also be a bad two-factor authentication token or something similar.
		- (REQUIRED) `inputName` - Name of the input field where the user entered invalid data
- **System:** (implementations are highly recommended to include these, but they technically don't have to, so they might not be available everywhere)
	- **Permissions:** For errors to do with file permissions. Use this if your program is denied read/write/access/etc. permissions to some file (e.g. the user has accidentally changed things so only root can access your program's configuration files).
		- (REQUIRED) `problemFileOrDir` - File/directory that produced the error
		- (REQUIRED) `neededPermissions` - What permissions are required
		- (OPTIONAL) `whyPermissionsNeeded` - Why each of those permissions is required
		- (REQUIRED) `missingPermissions` - What permissions are missing

## Severities

- Critical errors are for when the program has to terminate (end) completely. It can't even continue by just displaying an error message to the user, it has to completely shut down.
	- Pulling the power plug.
	- Imagine the program got shot in the head and is completely dead.
- Error errors (yeah...) are for when the program can't do what it's supposed to, and has to do something else, like just display an error message and wait for the user to do something about it.
	- You're installing some software, and it can't be installed in the default folder for some reason, so it suspends its normal activities (installing itself), and prompts you to specify an alternative folder to install into.
	- Imagine the program stepped on a landmine and is in hospital recovering.
- Warning errors are for when the program encounters a relatively minor error that doesn't stop it from doing its normal duties.
	- You unplugged your webcam, so a video conferencing app can't connect to it, so it falls back to audio-only. It still works, it's just not the best scenario.
	- Imagine the program got shot in the arm, but it can still fight on!

## Encodings

- **Full:** For when you want to convey the full meaning of the error, complete with additional options and type parameters, as a string. This uses the short encoding, followed by all the options you provided as a stringified JSON object.
- **Standard:** For when you want a brief and to the point error message. This doesn't include any of the additional options, but bases the generated message off the type parameters. It also includes short form.
- **Short:** `[ClassName][TypeName][SeverityName]`, e.g. `CallerParameterCritical` or `UserAuthenticationWarning`.
- **Numerical:** For when you want a numerical code. The severity is attached to that as `-[Severity code]`. See the [codes list](https://github.com/arctic-hen7/ipems/blob/main/protocol/default-paradigm.md#specification) in the default paradigm for what the codes are for each class/type/severity.
- **Verbose:** For when you want a highly detailed error message explaining everything known about the error. This includes short form and a message composed from type parameters and all additional options. This may span multiple sentences, and potentially could have extra formatting (like dot points).
- **Non-technical:** For when you want to display an error message to a non-programmer, say because your website crashed. This requires you to provide a function to string together a few pieces of information: the short form, numerical form, and a non-technical type explanation. The IPEMS protocol advises what these explanations could be, but they may vary between implementations.

## What about modules?

The question here is this: if I use a module someone else wrote in my program, and it throws an error, is that classified as a *CalleeReturn* error because it's still part of my program, or an *ExternalReturn* error because it's not code I wrote? The answer is, you decide. Generally, you should decide which you're going with at the beginning of developing a program, and stick with that for consistency, but it's up to you to decide whether you want to use *External* or *Callee* for modules. We pass no judgement on the matter (yet).

The IPEMS protocol developers have stated that a recommendation may be given in future based on experience when the system is more mature, but that would be a breaking change to the protocol and thus this module.
