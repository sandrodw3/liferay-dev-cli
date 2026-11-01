/**
 * Signals an operation failure that should be rendered with the error
 * log level. When `exit` is set, the process terminates with code 1
 * after the message is logged.
 */
export class Failure extends Error {
	/** When `true`, the runner exits the process with code 1. */
	exit?: boolean
	/** Optional stack trace or debug information appended to the log. */
	trace?: string

	/**
	 * Create a `Failure` with an optional message, trace and exit flag.
	 */
	constructor({
		exit,
		message,
		trace,
	}: { exit?: boolean; message?: string; trace?: string } = {}) {
		super(message)
		this.exit = exit
		this.trace = trace
	}
}

/**
 * Signals an informational outcome that should be rendered with the
 * info log level instead of treated as an error.
 */
export class Info extends Error {
	/**
	 * Create an `Info` with the message to display.
	 */
	constructor(message: string) {
		super(message)
	}
}

/**
 * Signals a non-fatal warning that should be rendered with the warn
 * log level instead of treated as an error.
 */

export class Warning extends Error {
	/**
	 * Create a `Warning` with the message to display.
	 */
	constructor(message: string) {
		super(message)
	}
}
