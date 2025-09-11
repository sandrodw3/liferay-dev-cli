/**
 * Exception Failure class
 */
export class Failure extends Error {
	trace?: string

	constructor({ message, trace }: { message?: string; trace?: string } = {}) {
		super(message)
		this.trace = trace
	}
}

/**
 * Exception Info class
 */
export class Info extends Error {
	constructor(message: string) {
		super(message)
	}
}

/**
 * Exception Warning class
 */

export class Warning extends Error {
	constructor(message: string) {
		super(message)
	}
}
