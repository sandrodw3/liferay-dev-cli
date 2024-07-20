import { blue, bold, white } from 'std/colors'

import { log, runCommand } from 'tools'

/**
 * Stop portal instance that is currently running
 */

export async function stop() {
	// Get Liferay portal process

	const processes = (await runCommand('ps aux')).split('\n')

	const process = processes.find((proc) => proc.includes('catalina'))

	// Exit if process is not found

	if (!process) {
		log(`There is no any ${bold(blue('Liferay'))} portal process running`)

		return
	}

	// Find process pid and kill it

	const [_, pid] = process.split(' ').filter(Boolean)

	Deno.kill(Number(pid), 'SIGKILL')

	log(
		`Successfully ${bold(white('stopped'))} ${bold(blue('Liferay'))} portal process`
	)
}
