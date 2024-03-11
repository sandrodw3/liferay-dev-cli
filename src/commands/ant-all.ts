import { blue, bold, dim, white } from 'std/colors'

import {
	CMDS,
	cleanLiferayRepo,
	getPortalPath,
	runAntAll,
	setProfile,
} from 'liferay'
import { getBaseName, log, run, spawn } from 'tools'
import { Profile } from 'types'

type Props = {
	clean?: boolean
	defaultOutput?: boolean
	profile?: Profile
}

/**
 * Runs ant all in the current Liferay project
 */

export async function antAll({ clean, defaultOutput, profile }: Props) {
	const portalPath = getPortalPath()
	const portalName = getBaseName(portalPath)

	Deno.chdir(portalPath)

	let description = `${bold(white('Executing ant all'))} in ${bold(
		blue(portalName)
	)}`

	if (profile) {
		description = description.concat(
			` with ${bold(white(`${profile} profile`))}`
		)
	}

	description = description.concat(
		clean ? ` and ${bold(white('cleaning untracked files'))}\n` : `\n`
	)

	log(description)

	if (defaultOutput) {
		if (clean) {
			await spawn(CMDS.cleanRepo)

			log('')
		}

		if (profile) {
			await spawn(
				profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal
			)

			log('')
		}

		await spawn(CMDS.antAll)

		return
	}

	if (clean) {
		await run({
			function: () => cleanLiferayRepo(),
			message: `${portalName} ${dim(CMDS.cleanRepo)}`,
			callbacks: {
				error: () => Deno.exit(1),
			},
		})
	}

	if (profile) {
		await run({
			function: () => setProfile(profile),
			message: `${portalName} ${dim(
				profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal
			)}`,
			callbacks: {
				error: () => Deno.exit(1),
			},
		})
	}

	await run({
		function: () => runAntAll(),
		message: `${portalName} ${dim(CMDS.antAll)}`,
		callbacks: {
			error: () => Deno.exit(1),
		},
	})
}
