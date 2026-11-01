type QuoteChar = '"' | "'" | null

/**
 * Process a full command and return the main cmd and the args
 */

export function processCommand(command: string): {
	cmd: string
	args: string[]
} {
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

/**
 * Execute a bash command and resolve with its combined stdout and
 * stderr. Throws if the command exits with a non-zero status, unless
 * `ignoreError` is set.
 */

async function runCommand(
	command: string,
	options?: {
		cwd?: string
		env?: Record<string, string>
		ignoreError?: boolean
	}
): Promise<string>

/**
 * Execute a bash command in spawn mode, inheriting the parent's stdio
 * so the user sees the command's output live. Throws if the command
 * exits with a non-zero status, unless `ignoreError` is set. Resolves
 * with `undefined` once the process exits.
 */

async function runCommand(
	command: string,
	options: {
		cwd?: string
		env?: Record<string, string>
		ignoreError?: boolean
		spawn: true
	}
): Promise<undefined>

/**
 * Execute a bash command and stream each output line to `processOutput`
 * as it arrives. Resolves with the full combined output once the
 * process exits.
 */

async function runCommand(
	command: string,
	options?: {
		cwd?: string
		env?: Record<string, string>
		ignoreError?: boolean
		processOutput: (line: string) => void
	}
): Promise<string>

async function runCommand(
	command: string,
	options?: {
		cwd?: string
		env?: Record<string, string>
		ignoreError?: boolean
		processOutput?: (line: string) => void
		spawn?: boolean
	}
): Promise<string | undefined> {
	const { cmd, args } = processCommand(command)

	if (options?.processOutput) {
		const process = new Deno.Command(cmd, {
			args,
			cwd: options?.cwd,
			env: options?.env,
			stdout: 'piped',
			stderr: 'piped',
		})

		const child = process.spawn()

		const readStream = async (
			stream: ReadableStream<Uint8Array> | null,
			onLine?: (line: string) => void
		): Promise<string> => {
			if (!stream) {
				return ''
			}

			const textStream = stream.pipeThrough(new TextDecoderStream())
			const reader = textStream.getReader()

			let content = ''
			let pending = ''

			while (true) {
				const { value, done } = await reader.read()

				if (done) {
					break
				}

				if (!value) {
					continue
				}

				content += value
				pending += value

				const lines = pending.split(/\r\n|\n|\r/)

				pending = lines.pop() || ''

				for (const line of lines) {
					onLine?.(line)
				}
			}

			if (pending) {
				onLine?.(pending)
			}

			reader.releaseLock()

			return content
		}

		const [stdout, stderr, status] = await Promise.all([
			readStream(child.stdout, options?.processOutput),
			readStream(child.stderr, options?.processOutput),
			child.status,
		])

		const sdout = stdout.trim()
		const error = stderr.trim()

		if (status.code !== 0 && !options?.ignoreError) {
			throw new Error(
				error || sdout || `Command failed with code ${status.code}`
			)
		}

		if (!options?.spawn) {
			return [sdout, error].filter(Boolean).join('\n')
		}

		return
	}

	// If spawn is true, just spawn the command

	if (options?.spawn) {
		const process = new Deno.Command(cmd, {
			args,
			cwd: options?.cwd,
			env: options?.env,
		})

		const child = process.spawn()

		const status = await child.status

		if (!status.success && !options?.ignoreError) {
			throw new Error(`Command failed with code ${status.code}`)
		}

		return
	}

	// Otherwise, get its output and return it

	const process = new Deno.Command(cmd, {
		args,
		cwd: options?.cwd,
		env: options?.env,
	})

	const result = await process.output()

	const decoder = new TextDecoder()

	const sdout = decoder.decode(result.stdout).trim()
	const stderr = decoder.decode(result.stderr).trim()

	if (result.code !== 0 && !options?.ignoreError) {
		throw new Error(stderr)
	}

	return [sdout, stderr].filter(Boolean).join('\n')
}

export { runCommand }
