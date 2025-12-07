/**
 * Execute a bash command and return a promise with the result
 */

async function runCommand(
	command: string,
	options: { env?: Record<string, string>; spawn: true }
): Promise<undefined>

async function runCommand(
	command: string,
	options?: {
		env?: Record<string, string>
		ignoreError?: boolean
		spawn?: false
	}
): Promise<string>

async function runCommand(
	command: string,
	options?: {
		env?: Record<string, string>
		ignoreError?: boolean
		spawn?: boolean
	}
): Promise<string | undefined> {
	const { cmd, args } = processCommand(command)

	const process = new Deno.Command(cmd, {
		args,
		env: options?.env,
	})

	// If spawn is true, just spawn the command

	if (options?.spawn) {
		const spawn = process.spawn()

		await spawn.output()
	}
	// Otherwise, get its output and return it
	else {
		const result = await process.output()

		const decoder = new TextDecoder()

		const sdout = decoder.decode(result.stdout).trim()
		const stderr = decoder.decode(result.stderr).trim()

		if (result.code !== 0 && !options?.ignoreError) {
			throw new Error(stderr)
		} else {
			return [sdout, stderr].filter(Boolean).join('\n')
		}
	}
}

/**
 * Process a full command and return the main cmd and the args
 */

function processCommand(command: string) {
	const [cmd, ...rest] = command.split(' ')

	const args = []

	let currentArg = ''

	for (const fragment of rest) {
		// If fragment starts and ends with ", just push it

		if (fragment.startsWith('"') && fragment.endsWith('"')) {
			args.push(fragment.replaceAll('"', ''))

			continue
		}

		// We are building an arg with "

		if (currentArg.length) {
			currentArg += ` ${fragment}`

			// If it's the end of the arg, push it in the list and clean temp variable

			if (fragment.endsWith('"')) {
				args.push(currentArg.replaceAll('"', ''))

				currentArg = ''
			}

			continue
		}

		// It's the start of a new arg with "

		if (fragment.startsWith('"')) {
			currentArg = fragment

			continue
		}

		// It's not an arg with "

		if (!fragment.includes('"')) {
			args.push(fragment)

			continue
		}
	}

	return { cmd, args }
}

export { runCommand }
