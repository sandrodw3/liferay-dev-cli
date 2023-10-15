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
