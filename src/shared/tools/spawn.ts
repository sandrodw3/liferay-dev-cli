/**
 * Spawns a bash command and returns the process
 */

export async function spawn(command: string) {
	const [cmd, ...args] = command.split(' ')

	const process = new Deno.Command(cmd, {
		args,
	})

	const spawn = process.spawn()

	await spawn.output()
}
