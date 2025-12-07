/**
 * Execute a bash command and return a promise with the result
 */

import { processCommand } from 'tools'

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

export { runCommand }
