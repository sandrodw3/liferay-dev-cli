import { bold, dim, green, red } from 'std/colors'

import { Result } from 'types'
import { CMDS, getPortalPath } from 'liferay'
import { execute, getBaseName } from 'tools'

export async function runAntAll(): Promise<Result> {
	const portalPath = getPortalPath()
	const portalName = getBaseName(portalPath)

	Deno.chdir(portalPath)

	try {
		await execute(CMDS.antAll)
	} catch {
		return {
			status: 'error',
			message: `${portalName} ${dim(CMDS.antAll)} (${bold(
				red('error')
			)} occurred)`,
		}
	}

	return {
		status: 'success',
		message: `${portalName} ${dim(CMDS.antAll)} (completed ${bold(
			green('successfully')
		)})`,
	}
}
