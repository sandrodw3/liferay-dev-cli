import { join } from 'tools'

const LAST_UPDATE_CHECK_PATH = join(
	Deno.env.get('HOME')!,
	'.lfr',
	'last-update-check'
)

/**
 * Get last update check date
 */

export async function getLastCheckDate() {
	try {
		return Number(await Deno.readTextFile(LAST_UPDATE_CHECK_PATH))
	} catch {
		return 0
	}
}

/**
 * Set last update check date
 */

export async function setLastCheckDate() {
	const minutes = Date.now()

	await Deno.writeTextFile(LAST_UPDATE_CHECK_PATH, minutes.toString())
}
