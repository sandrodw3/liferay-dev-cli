import { bold, dim, green, red } from 'std/colors'

import { Result } from 'types'
import { CMDS, getPortalPath } from 'liferay'
import { execute, getBaseName } from 'tools'

export async function cleanLiferayRepo(): Promise<Result> {
	const portalName = getBaseName(getPortalPath())

	try {
		await execute(CMDS.cleanRepo)
	} catch {
		return {
			status: 'error',
			message: `${portalName} ${dim(CMDS.cleanRepo)} (${bold(
				red('error')
			)} occurred)`,
		}
	}

	return {
		status: 'success',
		message: `${portalName} ${dim(CMDS.cleanRepo)} (completed ${bold(
			green('successfully')
		)})`,
	}
}
