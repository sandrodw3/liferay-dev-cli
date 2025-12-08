import { blue, bold, white } from 'std/colors'

import { getPortalProcessPid } from 'liferay'
import { log } from 'tools'

/**
 * Stop portal instance that is currently running
 */

export async function stop() {
	// Get Liferay portal process pid

	const pid = await getPortalProcessPid()

	// Exit if not found

	if (!pid) {
		log(`There is no any ${bold(blue('Liferay'))} portal process running`)

		Deno.exit(0)
	}

	// Kill the process

	Deno.kill(Number(pid), 'SIGKILL')

	log(
		`Successfully ${bold(white('stopped'))} ${bold(blue('Liferay'))} portal process`
	)
}
