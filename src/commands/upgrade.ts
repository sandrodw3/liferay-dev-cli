import { bold, cyan, dim, red, white } from 'std/colors'

import { log, runCommand } from 'tools'
import { getLatestVersion } from 'version'

/**
 * Upgrade lfr to latest version
 */

export async function upgrade(current: string) {
	// Get latest version and check if it's the one installed

	log(`Current lfr version: ${bold(cyan(current))}\n`)

	log(dim(`Looking up latest version...\n`))

	const latest = await getLatestVersion()

	if (!latest) {
		log(
			`An ${bold(red('error'))} occurred while ${bold(white('checking updates'))}, please try again later`
		)

		return
	}

	if (latest === current) {
		log(
			`Installed lfr version ${bold(cyan(current))} is the latest version`
		)

		return
	}

	// Upgrade to latest version

	log(`Found latest version ${bold(cyan(latest))}\n`)

	log(dim(`Installing it...\n`))

	const repo = `https://raw.githubusercontent.com/sandrodw3/liferay-dev-cli/${latest}`

	const cmd = `deno install ${repo}/src/lfr.ts --import-map ${repo}/deno.json --allow-env --allow-net --allow-read --allow-run --allow-write -f -g -r`

	await runCommand(cmd, { spawn: true })

	log(`\nUpgraded successfully to lfr ${bold(cyan(latest))}`)
}
