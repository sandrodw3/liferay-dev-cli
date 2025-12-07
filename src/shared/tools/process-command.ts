type QuoteChar = '"' | "'" | null

/**
 * Process a full command and return the main cmd and the args
 */

export function processCommand(command: string) {
	const [cmd, ...rest] = command.split(' ')

	const args = []

	let currentArg = ''

	let quoteChar: QuoteChar = null

	for (const fragment of rest) {
		// If fragment starts and ends with the same quote char, just push it

		if (
			(fragment.startsWith('"') && fragment.endsWith('"')) ||
			(fragment.startsWith("'") && fragment.endsWith("'"))
		) {
			args.push(fragment.slice(1, -1))

			continue
		}

		// We are building an arg with quotes

		if (currentArg.length) {
			currentArg += ` ${fragment}`

			// If it's the end of the arg, push it in the list and clean temp variable

			if (fragment.endsWith(quoteChar!)) {
				args.push(currentArg.split(quoteChar!).join(''))

				currentArg = ''
				quoteChar = null
			}

			continue
		}

		// It's the start of a new arg with quotes

		if (fragment.startsWith('"') || fragment.startsWith("'")) {
			quoteChar = fragment[0] as QuoteChar
			currentArg = fragment

			continue
		}

		// It's not an arg with quotes

		args.push(fragment)
	}

	return { cmd, args }
}
