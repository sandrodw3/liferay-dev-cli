import { bold, green, red, yellow } from 'std/colors'

import { getPortalRoot } from 'liferay'
import { execute } from 'tools'
import { Result } from 'types'

const messages = {
	changes: `format-source-current-branch (generated ${bold(
		yellow('changes')
	)}, please commit them)`,
	error: `format-source-current-branch (found ${bold(
		red('errors')
	)}, please fix them)`,
	success: `format-source-current-branch (completed ${bold(
		green('successfully')
	)})`,
}

/**
 * Formats current branch and returns a promise with the result
 */

export async function formatBranch(): Promise<Result> {
	// Change to portal-impl dir

	const portalRoot = getPortalRoot()

	Deno.chdir(`${portalRoot}/portal-impl`)

	// Store previous git diff

	const previousDiff = await execute('git diff')

	// Run command to format branch , return error message if it failed

	try {
		await execute('ant format-source-current-branch')
	} catch {
		return {
			status: 'error',
			message: messages.error,
		}
	}

	// Check if it generated some change by comparing diffs

	const diff = await execute('git diff')

	if (diff && previousDiff !== diff) {
		return {
			status: 'warning',
			message: messages.changes,
		}
	}

	// Return success message

	return {
		status: 'success',
		message: messages.success,
	}
}
