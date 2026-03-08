type DBError = 'access-denied' | 'unknown-database' | undefined

/**
 * Process a database error and returns the type
 */

export function processDbError(error: Error): DBError {
	const { message } = error as Error

	if (
		message.includes('Access denied') ||
		message.includes('authentication failed')
	) {
		return 'access-denied'
	}

	if (message.includes('Unknown database')) {
		return 'unknown-database'
	}

	return
}
