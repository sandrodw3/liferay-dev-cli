/**
 * Executes a bash command and returns a promise with the result
 */

export async function execute(command: string): Promise<string> {
	const [cmd, ...args] = command.split(' ')

	const { stdout, stderr } = await new Deno.Command(cmd, { args }).output()

	const decoder = new TextDecoder()

	const output = decoder.decode(stdout).trim()
	const error = decoder.decode(stderr).trim()

	if (error) {
		throw new Error(error)
	} else {
		return output
	}
}
