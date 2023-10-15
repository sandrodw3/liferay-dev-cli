import { bold, dim, green, red, yellow } from 'std/colors'

import { CMDS, getPortalPath } from 'liferay'
import { execute } from 'tools'
import { Result } from 'types'

/**
 * Formats current branch and returns a promise with the result
 */

export async function formatBranch(branch: string): Promise<Result> {
	// Change to portal-impl dir

	const portalPath = getPortalPath()

	Deno.chdir(`${portalPath}/portal-impl`)

	// Store previous git diff

	const previousDiff = await execute('git diff')

	// Run command to format branch, return error message if it failed

	try {
		await execute(CMDS.formatBranch)
	} catch {
		return {
			status: 'error',
			message: `${branch} ${dim(CMDS.formatBranch)} (found ${bold(
				red('errors')
			)})`,
		}
	}

	// Check if it generated some change by comparing diffs

	const diff = await execute('git diff')

	if (diff && previousDiff !== diff) {
		return {
			status: 'warning',
			message: `${branch} ${dim(CMDS.formatBranch)} (generated ${bold(
				yellow('changes')
			)}, please commit them)`,
		}
	}

	// Return success message

	return {
		status: 'success',
		message: `${branch} ${dim(CMDS.formatBranch)} (completed ${bold(
			green('successfully')
		)})`,
	}
}
