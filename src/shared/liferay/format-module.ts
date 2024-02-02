import { bold, dim, green, red, yellow } from 'std/colors'

import { getPortalPath } from 'liferay'
import { execute, getBaseName, join } from 'tools'
import { Result } from 'types'

/**
 * Formats the given module and returns a promise with the result
 */

export async function formatModule(module: string): Promise<Result> {
	Deno.chdir(module)

	const name = getBaseName(module)

	const gradlePath = join(getPortalPath(), 'gradlew')

	const command = `${gradlePath} formatSource`

	// Store previous git diff

	const previousDiff = await execute('git diff')

	// Run command to format branch, return error message if it failed

	try {
		await execute(command)
	} catch {
		return {
			status: 'error',
			message: `${name} ${dim('formatSource')} (found ${bold(
				red('errors')
			)})`,
		}
	}

	// Check if it generated some change by comparing diffs

	const diff = await execute('git diff')

	if (diff && previousDiff !== diff) {
		return {
			status: 'warning',
			message: `${name} ${dim('formatSource')} (generated ${bold(
				yellow('changes')
			)}, please commit them)`,
		}
	}

	// Return success message

	return {
		status: 'success',
		message: `${name} ${dim('formatSource')} (completed ${bold(
			green('successfully')
		)})`,
	}
}
