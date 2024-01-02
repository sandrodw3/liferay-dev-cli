import { bold, yellow } from 'std/colors'

import { execute, log } from 'tools'

const GRADLE_OPTIONS = ['gradlew', 'gradle', 'gw']

/**
 * Returns the installed gradle command and exits with error code
 * if it's not found
 */

export async function getGradleCommand(): Promise<string> {
	for (const option of GRADLE_OPTIONS) {
		try {
			await execute(option)

			return option
		} catch {
			continue
		}
	}

	log(`You don't have any ${bold(yellow('gradle'))} command installed 😔`)

	Deno.exit(1)
}
