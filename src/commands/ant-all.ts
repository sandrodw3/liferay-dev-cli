import { blue, bold, dim, white } from 'std/colors'

import { getConfigEntry } from 'config'
import { CMDS, Profile } from 'liferay'
import {
	folderExists,
	getBaseName,
	goUp,
	join,
	log,
	runAsyncFunction,
	runCommand,
} from 'tools'

type Props = {
	clean?: boolean
	defaultOutput?: boolean
	profile?: Profile
}

/**
 * Run ant all in the current Liferay portal project
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
		clean
			? ` and ${bold(white('removing bundles'))} (except properties files) and ${bold(white('untracked files'))}\n`
			: `\n`
	)

	log(description)

	// Clean bundles folder and untracked files if specified

	if (clean) {
		await runAsyncFunction({
			fn: async () => {
				await cleanBundles()
			},
			text: `${portalName} ${dim('Remove bundles (except properties files)')}`,
		})

		if (defaultOutput) {
			log('')

			await runCommand(CMDS.cleanRepo, { spawn: true })
		} else {
			await runAsyncFunction({
				fn: async () => {
					await runCommand(CMDS.cleanRepo)
				},
				text: `${portalName} ${dim(CMDS.cleanRepo)}`,
			})
		}
	}

	// Set profile is specified

	if (profile) {
		const cmd = profile === 'dxp' ? CMDS.profileDxp : CMDS.profilePortal

		defaultOutput
			? await runCommand(cmd, { spawn: true })
			: await runAsyncFunction({
					fn: async () => {
						await runCommand(cmd)
					},
					text: `${portalName} ${dim(cmd)}`,
				})
	}

	// Run ant all

	Deno.chdir(portalPath)

	defaultOutput
		? await runCommand(CMDS.antAll, { spawn: true })
		: await runAsyncFunction({
				fn: async () => {
					await runCommand(CMDS.antAll)
				},
				text: `${portalName} ${dim(CMDS.antAll)}`,
			})
}

/**
 * Empty bundles folder except properties files
 */

async function cleanBundles() {
	const portalPath = await getConfigEntry('portal.path')

	// Check bundles path exists

	const bundlesPath = join(goUp(portalPath), 'bundles')

	if (!folderExists(bundlesPath)) {
		return
	}

	// Copy properties files to new bundles folder

	const newBundlesPath = join(goUp(portalPath), Date.now().toString())
	await Deno.mkdir(newBundlesPath)

	for await (const entry of Deno.readDir(bundlesPath)) {
		if (entry.name.endsWith('properties')) {
			await Deno.copyFile(
				join(bundlesPath, entry.name),
				join(newBundlesPath, entry.name)
			)
		}
	}

	// Remove old bundles folder and rename new one

	await Deno.remove(bundlesPath, { recursive: true })
	await Deno.rename(newBundlesPath, bundlesPath)
}
