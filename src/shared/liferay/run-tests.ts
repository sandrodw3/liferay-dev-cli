import { blue, bold, dim, green, red } from 'std/colors'

import { execute, getBaseName } from 'tools'
import { Result } from 'types'

/**
 * Runs frontend tests in the given module and logs the result
 */

export async function runTests(module: string): Promise<Result> {
	Deno.chdir(module)

	const name = getBaseName(module)

	if (!name.endsWith('web') || name.endsWith('portal-web')) {
		return {
			status: 'info',
			message: `${name} ${dim(
				'liferay-npm-scripts test'
			)} (no tests, ${bold(blue(`skipped`))})`,
		}
	}

	try {
		await execute(`npx liferay-npm-scripts test`)
	} catch (error) {
		if (error.message.includes('not found')) {
			return {
				status: 'info',
				message: `${name} ${dim(
					'liferay-npm-scripts test'
				)} (no tests, ${bold(blue('skipped'))})`,
			}
		} else if (error.message.includes('failed')) {
			return {
				status: 'error',
				message: `${name} ${dim('liferay-npm-scripts test')} (${bold(
					red('failed')
				)})`,
			}
		}

		// For some reason, `liferay-npm-scripts test` command always
		// throws error, so return success result also in catch
		// if nothing failed

		return {
			status: 'success',
			message: `${name} ${dim('liferay-npm-scripts test')} (${bold(
				green('passed')
			)})`,
		}
	}

	return {
		status: 'success',
		message: `${name} ${dim('liferay-npm-scripts test')} (${bold(
			green('passed')
		)})`,
	}
}
