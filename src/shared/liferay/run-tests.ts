import { blue, bold, green, red } from 'std/colors'

import { getModuleName } from 'liferay'
import { execute } from 'tools'
import { Result } from 'types'

/**
 * Runs frontend tests in the given module and logs the result
 */

export async function runTests(module: string): Promise<Result> {
	Deno.chdir(module)

	const name = getModuleName(module)

	if (!name.endsWith('web')) {
		return {
			status: 'info',
			message: `${name} (no tests, ${bold(blue(`skipped`))})`,
		}
	}

	try {
		await execute('gradlew packageRunTest')
	} catch (error) {
		if (error.message.includes('not found')) {
			return {
				status: 'info',
				message: `${name} (no tests, ${bold(blue(`skipped`))})`,
			}
		}

		return {
			status: 'error',
			message: `${name} (${bold(red('failed'))})`,
		}
	}

	return {
		status: 'success',
		message: `${name} (${bold(green('passed'))})`,
	}
}
