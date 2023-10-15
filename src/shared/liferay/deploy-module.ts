import { bold, blue, green, red, dim, yellow } from 'std/colors'

import { getPortalPath } from 'liferay'
import { execute, getBaseName, join } from 'tools'
import { Result } from 'types'

/**
 * Deploys the given module and logs the result, skip it if it's
 * skippable
 */

export async function deployModule(
	module: string,
	command: string
): Promise<Result> {
	Deno.chdir(module)

	const name = getBaseName(module)

	if (!command) {
		return {
			status: 'info',
			message: `${name} (${bold(blue('skipped'))})`,
		}
	} else if (command === 'manual') {
		return {
			status: 'warning',
			message: `${name} (should be deployed ${bold(yellow('manually'))})`,
		}
	}

	const gradlePath = join(getPortalPath(), 'gradlew')

	try {
		await execute(`${gradlePath} ${command}`)
	} catch ({ message }) {
		if (message.includes('FAILED')) {
			return {
				status: 'error',
				message: `${name} ${dim(command)} (${bold(red('failed'))})`,
			}
		}
	}

	return {
		status: 'success',
		message: `${name} ${dim(command)} (completed ${bold(
			green('successfully')
		)})`,
	}
}
