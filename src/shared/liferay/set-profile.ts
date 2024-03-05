import { bold, dim, green, red } from 'std/colors'

import { Result } from 'types'
import { CMDS, getPortalPath } from 'liferay'
import { execute, getBaseName } from 'tools'
import { Profile } from 'types'

export async function setProfile(profile: Profile): Promise<Result> {
	const portalName = getBaseName(getPortalPath())
	const cmd = profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal

	try {
		await execute(cmd)
	} catch {
		return {
			status: 'error',
			message: `${portalName} ${dim(cmd)} (${bold(
				red('error')
			)} occurred)`,
		}
	}

	return {
		status: 'success',
		message: `${portalName} ${dim(cmd)} (set ${bold(
			green('successfully')
		)})`,
	}
}
