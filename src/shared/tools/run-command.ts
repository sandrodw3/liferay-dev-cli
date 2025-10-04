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
	// Otherwise, gets its output and returns it
	else {
		const { stdout, stderr } = await process.output()

		const decoder = new TextDecoder()

		const output = decoder.decode(stdout).trim()
		const error = decoder.decode(stderr).trim()

		if (error && !options?.ignoreError) {
			throw new Error(error)
		} else {
			return output
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
