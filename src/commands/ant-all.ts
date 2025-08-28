import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { getBundlesPath, getPortalProcessPid, Profile } from 'liferay'
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
	const pid = await getPortalProcessPid()

	if (pid) {
		log(
			`A ${bold(blue('Liferay'))} portal process is running, please ${bold(yellow('stop'))} it and try again`
		)

		return
	}

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

		const cleanCmd =
			'git clean -fdx -e .classpath -e .idea -e .project -e *.eml -e *.iml -e *.properties'

		if (defaultOutput) {
			log(`\nClean ${bold(blue('bundles'))} folder and untracked files\n`)

			await runCommand(cleanCmd, { spawn: true })
		} else {
			await runAsyncFunction({
				fn: async () => {
					await runCommand(cleanCmd)
				},
				text: `${portalName} ${dim(cleanCmd)}`,
			})
		}
	}

	// Set profile is specified

	if (profile) {
		const cmd =
			profile === 'dxp'
				? 'ant setup-profile-dxp'
				: 'ant setup-profile-portal'

		if (defaultOutput) {
			log(`\nSet ${bold(white(profile))} profile\n`)

			await runCommand(cmd, { spawn: true })
		} else {
			await runAsyncFunction({
				fn: async () => {
					await runCommand(cmd)
				},
				text: `${portalName} ${dim(cmd)}`,
			})
		}
	}

	// Run ant all

	Deno.chdir(portalPath)

	if (defaultOutput) {
		if (clean || profile) {
			log(`\nRun ${bold(white('ant all'))}\n`)
		}

		await runCommand('ant all', { spawn: true })

		log('')
	} else {
		await runAsyncFunction({
			fn: async () => {
				try {
					await runCommand('ant all')
				} catch (error) {
					if (error instanceof Error) {
						throw new Error(
							`(build ${bold(red('failed'))})\n\n ${processError(error)}`
						)
					} else {
						throw error
					}
				}
			},
			text: `${portalName} ${dim('ant all')}`,
		})
	}

	Deno.chdir(`${portalPath}/modules/test/playwright`)

	await runAsyncFunction({
		fn: async () => {
			await runCommand('npm install', { ignoreError: true })
		},
		text: `${portalName} ${dim('Install playwright')}`,
	})
}

/**
 * Empty bundles folder except properties files
 */

async function cleanBundles() {
	// Check bundles path exists

	const bundlesPath = await getBundlesPath()

	if (!folderExists(bundlesPath)) {
		return
	}

	// Copy properties files to new bundles folder

	const newBundlesPath = join(goUp(bundlesPath), Date.now().toString())

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

/**
 * Process the error message
 */

function processError(error: Error) {
	return error.message
		.split('\n')
		.filter(
			(line) =>
				line.length &&
				!line.includes('BUILD FAILED') &&
				!line.includes('Total time')
		)
		.map((line) => line.replace(/^\s+/, ''))
		.join('\n')
}
