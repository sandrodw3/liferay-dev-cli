import { bold, cyan, green, magenta } from 'std/colors'
import { greaterThan, parse } from 'std/semver'

import { log } from 'tools'
import { getLatestVersion, setLastCheckDate } from 'version'

/**
 * Check if some update is available for the app
 */

export async function checkUpdate(current: string) {
	const latest = await getLatestVersion()

	if (!latest) {
		return
	}

	if (greaterThan(parse(latest), parse(current))) {
		log(
			`A ${green('new version')} of lfr is available (${bold(cyan(current))} → ${bold(cyan(latest))}), run ${bold(magenta('lfr upgrade'))} to install it\n`
		)
	}

	await setLastCheckDate()
}
