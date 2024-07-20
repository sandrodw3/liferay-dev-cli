import { blue, bold, dim, white } from 'std/colors'

import { getConfigEntry } from 'config'
import { getBaseName, log, runAsyncFunction, runCommand } from 'tools'

/**
 * Stop portal instance that is currently running
 */

export async function stop() {
	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)

	// Get Liferay portal process

	const processes = (await runCommand('ps aux')).split('\n')

	const process = processes.find((proc) => proc.includes('catalina'))

	// Exit if process is not found

	if (!process) {
		log(`There is no any ${bold(blue('Liferay'))} portal process running`)

		return
	}

	// Find process pid and kill it

	log(`${bold(white('Stopping'))} ${bold(blue(portalName))} process\n`)

	const [_, pid] = process.split(' ').filter(Boolean)

	await runAsyncFunction({
		fn: () => {
			Deno.kill(Number(pid), 'SIGKILL')
		},
		text: `${portalName} ${dim('Stop process')}`,
	})
}
