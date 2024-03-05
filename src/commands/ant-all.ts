import { blue, bold, dim, white } from 'std/colors'

import { getConfigEntry } from 'config'
import { CMDS, Profile } from 'liferay'
import { getBaseName, log, runAsyncFunction, runCommand } from 'tools'

type Props = {
	clean?: boolean
	defaultOutput?: boolean
	profile?: Profile
}

/**
 * Run ant all in the current Liferay project
 */

export async function antAll({ clean, defaultOutput, profile }: Props) {
	const portalPath = await getConfigEntry('portal.path')
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
			await runCommand(CMDS.cleanRepo, { spawn: true })

			log('')
		}

		if (profile) {
			await runCommand(
				profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal,
				{ spawn: true }
			)

			log('')
		}

		await runCommand(CMDS.antAll, { spawn: true })

		return
	}

	if (clean) {
		await runAsyncFunction({
			fn: async () => {
				await runCommand(CMDS.cleanRepo)
			},
			text: `${portalName} ${dim(CMDS.cleanRepo)}`,
		})
	}

	if (profile) {
		const cmd = profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal

		await runAsyncFunction({
			fn: async () => {
				await runCommand(cmd)
			},
			text: `${portalName} ${dim(cmd)}`,
		})
	}

	Deno.chdir(portalPath)

	await runAsyncFunction({
		fn: async () => {
			await runCommand(CMDS.antAll)
		},
		text: `${portalName} ${dim(CMDS.antAll)}`,
	})
}
