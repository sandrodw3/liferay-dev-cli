/**
 * Execute a bash command and return a promise with the result
 */

async function runCommand(
	command: string,
	options: { spawn: true }
): Promise<undefined>

async function runCommand(
	command: string,
	options?: { ignoreError?: boolean; spawn?: false }
): Promise<string>

async function runCommand(
	command: string,
	options?: { ignoreError?: boolean; spawn?: boolean }
): Promise<string | undefined> {
	const [cmd, ...args] = command.split(' ')

	const process = new Deno.Command(cmd, {
		args,
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

export { runCommand }
