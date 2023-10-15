import { bold, blue, green, red, dim } from 'std/colors'

import { getModuleName } from 'liferay'
import { execute } from 'tools'
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

	const name = getModuleName(module)

	if (!command) {
		return {
			status: 'info',
			message: `${name} (${bold(blue('skipped'))})`,
		}
	}

	try {
		await execute(command)
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
